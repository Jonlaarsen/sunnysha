const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const isDev = !app.isPackaged && process.env.NODE_ENV === "development";
let nextServer = null;
let mainWindow = null;

let hasShownError = false;
function showErrorAndQuit(title, message) {
  if (hasShownError) return;
  hasShownError = true;
  if (app.isPackaged) {
    dialog.showErrorBox(title, message);
  } else {
    console.error(`[Electron] ${title}:`, message);
  }
  app.quit();
}

function sendUpdateEvent(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-event", data);
  }
}

/**
 * Load environment variables from .env.local and .env
 * Ensures env vars are available in production Electron build.
 * Tries multiple locations: project root, app path, resources path.
 */
function loadEnvVars() {
  try {
    const dotenv = require("dotenv");

    const resourcesPath = process.resourcesPath || app.getAppPath();
    const appPath = app.getAppPath();
    const paths = [
      path.join(appPath, ".env.local"),
      path.join(appPath, ".env"),
      path.join(appPath, "..", ".env.local"),
      path.join(appPath, "..", ".env"),
      path.join(resourcesPath, ".env.local"),
      path.join(resourcesPath, ".env"),
      path.join(resourcesPath, "app.asar.unpacked", "standalone", ".env.local"),
      path.join(resourcesPath, "app.asar.unpacked", "standalone", ".env"),
      path.join(resourcesPath, "app.asar.unpacked", ".env.local"),
      path.join(resourcesPath, "app.asar.unpacked", ".env"),
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), ".env"),
    ];
    try {
      const exeDir = path.dirname(app.getPath("exe"));
      paths.push(path.join(exeDir, "..", "..", ".env.local"), path.join(exeDir, "..", "..", ".env"));
    } catch (_) { /* exe path not available in some contexts */ }

    for (const envPath of paths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: false });
        console.log("[Electron] Loaded env from:", envPath);
        break;
      }
    }
  } catch (err) {
    console.warn("[Electron] Could not load .env:", err.message);
  }
}

function setupAutoUpdater() {
  if (isDev) return;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false;

    autoUpdater.on("checking-for-update", () => {
      sendUpdateEvent({ type: "checking" });
    });

    autoUpdater.on("update-available", (info) => {
      sendUpdateEvent({ type: "available", version: info.version });
      autoUpdater.downloadUpdate();
    });

    autoUpdater.on("update-not-available", () => {
      sendUpdateEvent({ type: "not-available" });
    });

    autoUpdater.on("download-progress", (progress) => {
      sendUpdateEvent({
        type: "progress",
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      sendUpdateEvent({ type: "downloaded", version: info.version });
    });

    autoUpdater.on("error", (err) => {
      console.error("[Electron] Auto-update error:", err);
      sendUpdateEvent({ type: "error", message: err.message });
    });

    app.on("browser-window-created", () => {
      setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 3000);
    });
  } catch (err) {
    console.warn("[Electron] Auto-updater not configured:", err.message);
  }
}

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("[Electron] Page failed to load:", errorCode, errorDescription);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (nextServer) {
      nextServer.kill();
      nextServer = null;
    }
  });
}

ipcMain.handle("check-for-updates", async () => {
  if (isDev) return;
  try {
    const { autoUpdater } = require("electron-updater");
    const result = await autoUpdater.checkForUpdates();
    return { check: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle("quit-and-install", () => {
  const { autoUpdater } = require("electron-updater");
  autoUpdater.quitAndInstall(false, true);
});

app.on("web-contents-created", (_, contents) => {
  contents.on("render-process-gone", (_, details) => {
    if (details.reason !== "clean-exit") {
      showErrorAndQuit("应用崩溃", "渲染进程意外退出: " + (details.reason || "未知原因"));
    }
  });
});

app.whenReady().then(() => {
  loadEnvVars();
  setupAutoUpdater();

  if (isDev) {
    createWindow();
    return;
  }

  // Production: start Next.js standalone server
  // Try multiple paths (packaged with asarUnpack, or development)
  const resourcesPath = process.resourcesPath || path.dirname(app.getAppPath());
  const possibleStandaloneDirs = [
    path.join(path.dirname(app.getAppPath()), "app.asar.unpacked", "standalone"),
    path.join(resourcesPath, "app.asar.unpacked", "standalone"),
    path.join(app.getAppPath(), "standalone"),
    path.join(resourcesPath, "standalone"),
    path.join(process.cwd(), "standalone"),
  ];

  let standaloneDir = null;
  for (const dir of possibleStandaloneDirs) {
    if (fs.existsSync(path.join(dir, "server.js"))) {
      standaloneDir = dir;
      break;
    }
  }

  if (!standaloneDir) {
    const msg = "Next.js 服务器未找到。\n\nTried: " + possibleStandaloneDirs.join("\n");
    showErrorAndQuit("启动失败", msg);
    return;
  }

  // When launched from Finder, PATH may not include node. Add common locations.
  const pathEnv = process.env.PATH || "";
  const nodePaths =
    process.platform === "darwin"
      ? "/usr/local/bin:/opt/homebrew/bin:/opt/local/bin"
      : process.platform === "win32"
        ? "C:\\Program Files\\nodejs;C:\\Program Files (x86)\\nodejs"
        : "/usr/local/bin:/usr/bin";
  const env = {
    ...process.env,
    PORT: "3000",
    NODE_ENV: "production",
    PATH: `${nodePaths}:${pathEnv}`,
  };

  nextServer = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    env,
    stdio: "inherit",
  });

  nextServer.on("error", (err) => {
    showErrorAndQuit("启动失败", "无法启动 Next.js 服务器: " + (err.message || err));
  });

  nextServer.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error("[Electron] Next.js server exited with code:", code);
    }
    nextServer = null;
  });

  // Wait for server to be ready before opening window
  let waitAttempts = 0;
  const maxWaitAttempts = 60; // 60 * 500ms = 30 seconds max
  const waitForServer = () => {
    const http = require("http");
    const req = http.get("http://localhost:3000", (res) => {
      createWindow();
    });
    req.on("error", () => {
      waitAttempts++;
      if (waitAttempts >= maxWaitAttempts) {
        showErrorAndQuit("启动超时", "Next.js 服务器在 30 秒内未能启动。请检查控制台输出。");
        return;
      }
      setTimeout(waitForServer, 500);
    });
  };

  setTimeout(waitForServer, 3000);
});

app.on("window-all-closed", () => {
  if (nextServer) {
    nextServer.kill();
  }
  app.quit();
});
