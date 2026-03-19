import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const SUNNY_PATH = path.basename(SMB_BASE_PATH) === "SUNNY" ? SMB_BASE_PATH : path.join(SMB_BASE_PATH, "SUNNY");
const DRAWINGS_FOLDER = path.join(SUNNY_PATH, "品管", "图纸");

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
let cachedFiles: Array<{ name: string; path: string; size: number; modified: Date }> | null = null;
let cacheTime = 0;

async function listFilesRecursive(
  dir: string,
  fileList: Array<{ name: string; path: string; size: number; modified: Date }> = []
): Promise<Array<{ name: string; path: string; size: number; modified: Date }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) {
        await listFilesRecursive(fullPath, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".pdf" || ext === ".tif" || ext === ".tiff" || ext === ".jpg" || ext === ".jpeg") {
          const stats = await fs.stat(fullPath);
          fileList.push({ name: entry.name, path: fullPath, size: stats.size, modified: stats.mtime });
        }
      }
    } catch {
      continue;
    }
  }
  return fileList;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!searchQuery) {
      return NextResponse.json(
        { message: "请输入搜索关键词" },
        { status: 400 }
      );
    }

    // Check if SMB base path exists
    try {
      const baseStats = await fs.stat(SUNNY_PATH);
      if (!baseStats.isDirectory()) {
        return NextResponse.json(
          { message: "SMB 基础路径不可访问" },
          { status: 500 }
        );
      }
    } catch (error) {
      cachedFiles = null;
      return NextResponse.json(
        { 
          message: "SMB 共享未挂载，请先挂载 SMB 共享。",
          error: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 503 }
      );
    }

    // Check if drawings folder exists
    try {
      const folderStats = await fs.stat(DRAWINGS_FOLDER);
      if (!folderStats.isDirectory()) {
        return NextResponse.json(
          { message: "图纸文件夹不可访问" },
          { status: 500 }
        );
      }
    } catch (error) {
      cachedFiles = null;
      return NextResponse.json(
        { 
          message: "图纸文件夹未找到或不可访问",
          error: error instanceof Error ? error.message : "Unknown error",
          expectedPath: DRAWINGS_FOLDER
        },
        { status: 404 }
      );
    }

    // Use cache if valid, otherwise scan and cache
    let allFiles: Array<{ name: string; path: string; size: number; modified: Date }>;
    const now = Date.now();
    if (cachedFiles && now - cacheTime < CACHE_TTL_MS) {
      allFiles = cachedFiles;
    } else {
      allFiles = await listFilesRecursive(DRAWINGS_FOLDER);
      cachedFiles = allFiles;
      cacheTime = now;
    }

    // Filter by search query and file type
    const matchingFiles = allFiles
      .filter((file) => {
        const fileName = file.name.toLowerCase();
        const ext = path.extname(fileName).toLowerCase();
        // Only include PDF, TIF, and JPG files
        const isValidType = ext === '.pdf' || ext === '.tif' || ext === '.tiff' || ext === '.jpg' || ext === '.jpeg';
        return isValidType && fileName.includes(searchQuery);
      })
      .sort((a, b) => {
        // Sort by relevance (exact matches first, then by name)
        const aExact = a.name.toLowerCase() === searchQuery;
        const bExact = b.name.toLowerCase() === searchQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit)
      .map((file) => ({
        name: file.name,
        path: file.path,
        size: file.size,
        modified: file.modified.toISOString(),
        extension: path.extname(file.name).toLowerCase(),
      }));

    return NextResponse.json({
      success: true,
      count: matchingFiles.length,
      files: matchingFiles,
    });
  } catch (error) {
    console.error("Failed to search drawings from SMB", error);
    return NextResponse.json(
      {
        message: "无法从 SMB 共享搜索图纸。",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
