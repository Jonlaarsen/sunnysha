"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

interface DrawingFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  extension?: string;
}

interface BarcodeScannerProps {
  onFileSelected?: (filePath: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onFileSelected }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawingSearchResults, setDrawingSearchResults] = useState<
    DrawingFile[]
  >([]);
  const [isSearchingDrawings, setIsSearchingDrawings] = useState(false);
  const [showDrawingDropdown, setShowDrawingDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search drawings folder when search query changes
  useEffect(() => {
    async function searchDrawings() {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setDrawingSearchResults([]);
        setShowDrawingDropdown(false);
        return;
      }

      try {
        setIsSearchingDrawings(true);
        const url = `/api/smb/drawings-search?search=${encodeURIComponent(searchQuery.trim())}&limit=10`;
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 503 || res.status === 404) {
            setDrawingSearchResults([]);
            setShowDrawingDropdown(false);
            return;
          }
          throw new Error("无法搜索图纸。");
        }

        const data = await res.json();
        if (data.success && data.files) {
          setDrawingSearchResults(data.files);
          setShowDrawingDropdown(data.files.length > 0);
        } else {
          setDrawingSearchResults([]);
          setShowDrawingDropdown(false);
        }
      } catch {
        setDrawingSearchResults([]);
        setShowDrawingDropdown(false);
      } finally {
        setIsSearchingDrawings(false);
      }
    }

    const timeoutId = setTimeout(() => {
      searchDrawings();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDrawingDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDrawingSelect = (file: DrawingFile) => {
    setSearchQuery(file.name);
    setShowDrawingDropdown(false);

    const fileUrl = `/api/smb/file?path=${encodeURIComponent(file.path)}`;

    if (onFileSelected) {
      onFileSelected(fileUrl);
    }

    toast.success(`已选择：${file.name}`, { duration: 2000 });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 字节";
    const k = 1024;
    const sizes = ["字节", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 my-6 border border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            图纸搜索
          </h3>
          <p className="text-sm text-gray-600">
            在图纸文件夹中搜索 PDF、TIF、JPG 文件
          </p>
        </div>
      </div>

      <div className="mb-4 px-3 py-2 bg-blue-50/80 rounded-lg border border-blue-100 text-sm text-gray-700">
        <p className="font-medium text-gray-800 mb-1">使用方法：</p>
        <ol className="list-decimal list-inside space-y-0.5 text-gray-600">
          <li>打开 SMB 共享</li>
          <li>在 SMB 共享中进入 <strong>SUNNY</strong> 文件夹</li>
          <li>在下方输入部品番号或文件名进行搜索</li>
        </ol>
      </div>

      <div className="relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDrawingDropdown(true);
            }}
            onFocus={() => {
              if (drawingSearchResults.length > 0) {
                setShowDrawingDropdown(true);
              }
            }}
            placeholder="按部品番号或文件名搜索..."
            className="w-full px-4 py-2 border bg-white/80 focus:bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearchingDrawings && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <FaSpinner className="animate-spin text-blue-500 text-sm" />
            </div>
          )}
        </div>

        {/* Drawing Search Results Dropdown */}
        {showDrawingDropdown && drawingSearchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600">
                在图纸文件夹中找到 {drawingSearchResults.length} 个文件（PDF、TIF、JPG）：
              </p>
            </div>
            {drawingSearchResults.map((file, index) => (
              <button
                key={`${file.path}-${index}`}
                onClick={() => handleDrawingSelect(file)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      {file.extension && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 uppercase">
                          {file.extension.replace(".", "")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(file.modified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDrawingDropdown &&
          searchQuery.trim().length >= 2 &&
          !isSearchingDrawings &&
          drawingSearchResults.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-xl">
              未找到与「{searchQuery}」匹配的文件
            </div>
          )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
