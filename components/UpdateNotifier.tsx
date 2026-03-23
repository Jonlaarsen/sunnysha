"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    electronAPI?: {
      onUpdateEvent: (cb: (data: {
        type: string;
        version?: string;
        percent?: number;
        message?: string;
      }) => void) => void;
      checkForUpdates: () => Promise<{ error?: string }>;
      quitAndInstall: () => void;
      isElectron?: boolean;
    };
  }
}

export default function UpdateNotifier() {

  const quitAndInstall = useCallback(() => {
    if (typeof window !== "undefined" && window.electronAPI?.quitAndInstall) {
      window.electronAPI.quitAndInstall();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.isElectron) return;

    const api = window.electronAPI;

    api.onUpdateEvent((data) => {
      switch (data.type) {
        case "checking":
          toast.loading("正在检查更新...", { id: "update-check" });
          break;
        case "available":
          toast.dismiss("update-check");
          toast.success(`发现新版本 v${data.version}，正在下载...`, {
            id: "update-available",
            duration: 4000,
          });
          break;
        case "not-available":
          toast.dismiss("update-check");
          break;
        case "progress":
          if (data.percent !== undefined) {
            const msg = `下载中 ${Math.round(data.percent)}%`;
            toast.loading(msg, { id: "update-progress", duration: Infinity });
          }
          break;
        case "downloaded":
          toast.dismiss("update-progress");
          toast.success(
            (t) => (
              <span className="flex flex-col gap-2">
                <span>更新已下载完成（v{data.version}）</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    quitAndInstall();
                  }}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  立即重启应用
                </button>
              </span>
            ),
            { id: "update-downloaded", duration: Infinity }
          );
          break;
        case "error":
          toast.dismiss("update-check");
          toast.dismiss("update-progress");
          toast.error(`更新失败：${data.message || "未知错误"}`, {
            duration: 5000,
          });
          break;
      }
    });
  }, [quitAndInstall]);

  return null;
}
