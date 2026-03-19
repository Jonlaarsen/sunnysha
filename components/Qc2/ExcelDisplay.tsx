"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type SheetData = {
  sheetName: string;
  rows: Record<string, unknown>[];
};

type ExcelFile = {
  fileName: string;
  sheets: SheetData[];
};

const getHeaders = (rows: Record<string, unknown>[]) => {
  const uniqueHeaders = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => uniqueHeaders.add(key));
  });

  return Array.from(uniqueHeaders);
};

const STORAGE_KEY_FILE = "excel_selected_file";
const STORAGE_KEY_SEARCH = "excel_search_query";

export default function ExcelDisplay() {
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(null);
  const [editedData, setEditedData] = useState<Record<string, Record<number, Record<string, string>>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY_SEARCH) || "";
    }
    return "";
  });
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load selected file from SMB share
  const loadFile = useCallback(async (fileName: string, updateSearchQuery: boolean = true) => {
    try {
      setIsLoadingFile(true);
      setError(null);
      if (updateSearchQuery) {
        setSearchQuery(fileName);
      }
      setShowDropdown(false);

      // Use SMB endpoint to load Excel file
      const url = `/api/excel/smb?file=${encodeURIComponent(fileName)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "无法加载 Excel 文件。" }));
        throw new Error(errorData.message || "无法加载 Excel 文件。");
      }

      const data: ExcelFile = await res.json();
      setSelectedFile(data);
      
      // Save selected file to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_FILE, fileName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSelectedFile(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_FILE);
      }
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  // Load saved file and edited data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedFileName = localStorage.getItem(STORAGE_KEY_FILE);
    if (savedFileName) {
      loadFile(savedFileName, false); // false = don't update search query yet
    }
  }, [loadFile]);

  // Save search query to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (searchQuery) {
        localStorage.setItem(STORAGE_KEY_SEARCH, searchQuery);
      } else {
        localStorage.removeItem(STORAGE_KEY_SEARCH);
      }
    }
  }, [searchQuery]);

  // Initialize edited data when file is loaded and restore from localStorage
  useEffect(() => {
    if (selectedFile && typeof window !== "undefined") {
      const storageKey = `excel_edited_${selectedFile.fileName}`;
      const savedEditedData = localStorage.getItem(storageKey);
      
      if (savedEditedData) {
        try {
          const parsed = JSON.parse(savedEditedData);
          setEditedData(parsed);
        } catch {
          // If parsing fails, initialize empty
          const newEditedData: Record<string, Record<number, Record<string, string>>> = {};
          selectedFile.sheets.forEach((sheet) => {
            newEditedData[sheet.sheetName] = {};
          });
          setEditedData(newEditedData);
        }
      } else {
        // Initialize empty edited data structure
        const newEditedData: Record<string, Record<number, Record<string, string>>> = {};
        selectedFile.sheets.forEach((sheet) => {
          newEditedData[sheet.sheetName] = {};
        });
        setEditedData(newEditedData);
      }
    }
  }, [selectedFile]);

  const getCellValue = (sheetName: string, rowIndex: number, header: string, originalValue: unknown): string => {
    const sheetData = editedData[sheetName];
    if (sheetData && sheetData[rowIndex] && sheetData[rowIndex][header] !== undefined) {
      return sheetData[rowIndex][header];
    }
    return String(originalValue ?? "");
  };

  const updateCellValue = (sheetName: string, rowIndex: number, header: string, value: string) => {
    setEditedData((prev) => {
      const updated = {
        ...prev,
        [sheetName]: {
          ...prev[sheetName],
          [rowIndex]: {
            ...prev[sheetName]?.[rowIndex],
            [header]: value,
          },
        },
      };
      
      // Save to localStorage whenever edited data changes
      if (selectedFile && typeof window !== "undefined") {
        const storageKey = `excel_edited_${selectedFile.fileName}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      
      return updated;
    });
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for files in SMB share
  useEffect(() => {
    async function searchFiles() {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      try {
        setIsLoading(true);
        // Use SMB endpoint to search for Excel files
        const url = `/api/excel/smb-list?search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);

        if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "无法搜索文件。" }));
        throw new Error(errorData.message || "无法搜索文件。");
        }

        const data: string[] = await res.json();
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      searchFiles();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <div className="relative" ref={searchRef}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜索 SMB 共享中的 Excel 文件（标准类/受入检查数据表）..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                搜索中...
              </div>
            )}
          </div>
          {(searchQuery || selectedFile) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedFile(null);
                setEditedData({});
                setShowDropdown(false);
                setError(null);
                // Clear localStorage
                if (typeof window !== "undefined") {
                  localStorage.removeItem(STORAGE_KEY_FILE);
                  localStorage.removeItem(STORAGE_KEY_SEARCH);
                  if (selectedFile) {
                    localStorage.removeItem(`excel_edited_${selectedFile.fileName}`);
                  }
                }
              }}
              className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              清除
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg">
            {searchResults.map((fileName) => (
              <button
                key={fileName}
                onClick={() => loadFile(fileName)}
                className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
              >
                {fileName}
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchQuery && !isLoading && searchResults.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 shadow-lg">
            未找到与「{searchQuery}」匹配的文件
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {isLoadingFile && (
        <p className="px-4 text-sm text-zinc-500">正在加载 Excel 文件…</p>
      )}

      {selectedFile && !isLoadingFile && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-2 text-base font-semibold text-zinc-800">
            {selectedFile.fileName}
          </div>
          <div className="flex flex-col gap-4 p-4">
            {selectedFile.sheets.map((sheet) => {
              const headers = getHeaders(sheet.rows);

              return (
                <div key={sheet.sheetName} className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-zinc-600">
                    工作表：{sheet.sheetName}
                  </p>

                  {sheet.rows.length === 0 ? (
                    <p className="text-xs text-zinc-400">
                      此工作表无数据。
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] border border-zinc-200 text-xs">
                        <thead className="bg-zinc-50">
                          <tr>
                            {headers.map((header, index) => (
                              <th
                                key={header}
                                className="border w-auto border-zinc-200 px-3 py-2 text-left font-semibold"
                              >
                                {index === 0 ? "SunnySha" : index - 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.rows.map((row, rowIndex) => (
                            <tr
                              key={`${sheet.sheetName}-${rowIndex}`}
                              className="odd:bg-white even:bg-zinc-50"
                            >
                              {headers.map((header) => {
                                const originalValue = row[header];
                                const cellValue = getCellValue(sheet.sheetName, rowIndex, header, originalValue);
                                const isEmpty = !originalValue || String(originalValue).trim() === "";

                                return (
                                  <td
                                    key={`${sheet.sheetName}-${rowIndex}-${header}`}
                                    className="border border-zinc-200 px-3 py-1 align-top"
                                  >
                                    {isEmpty ? (
                                      <input
                                        type="text"
                                        value={cellValue}
                                        onChange={(e) =>
                                          updateCellValue(sheet.sheetName, rowIndex, header, e.target.value)
                                        }
                                        className="w-full min-w-[80px] text-blue-600 rounded px-2 py-1 text-xs focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                        placeholder=""
                                      />
                                    ) : (
                                      <span className="block py-1">{cellValue}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedFile && !isLoadingFile && !error && !searchQuery && (
        <div className="px-4 text-sm text-zinc-500">
          <p className="mb-2">从 SMB 共享搜索 Excel 文件：</p>
          <p className="text-xs text-zinc-400">
            路径：SUNNY/品管/日锦升/标准类/受入检查数据表
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            搜索示例：「4038219303」、「基准书」或文件名任意部分
          </p>
        </div>
      )}
    </div>
  );
}
