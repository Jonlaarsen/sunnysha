"use client";

import { useEffect, useState } from "react";

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

export default function ExcelDisplay() {
  const [excelFiles, setExcelFiles] = useState<ExcelFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function loadExcel() {
      try {
        const res = await fetch("/api/excel");

        if (!res.ok) {
          throw new Error("Unable to load Excel data.");
        }

        const data: ExcelFile[] = await res.json();
        setExcelFiles(data);
        setActiveIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    loadExcel();
  }, []);

  if (isLoading) {
    return <p className="px-4 text-sm text-zinc-500">Loading Excel data…</p>;
  }

  if (error) {
    return (
      <p className="px-4 text-sm text-red-600">
        Failed to load Excel data: {error}
      </p>
    );
  }

  if (excelFiles.length === 0) {
    return (
      <p className="px-4 text-sm text-zinc-500">
        No Excel files found in `test-folder`.
      </p>
    );
  }

  const activeFile = excelFiles[Math.min(activeIndex, excelFiles.length - 1)];

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      {excelFiles.length > 1 && (
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span>Showing {activeFile.fileName}</span>
          <select
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs focus:border-zinc-500 focus:outline-none"
            value={activeIndex}
            onChange={(event) => setActiveIndex(Number(event.target.value))}
          >
            {excelFiles.map((file, index) => (
              <option key={file.fileName} value={index}>
                {file.fileName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-2 text-base font-semibold text-zinc-800">
          {activeFile.fileName}
        </div>
        <div className="flex flex-col gap-4 p-4">
          {activeFile.sheets.map((sheet) => {
            const headers = getHeaders(sheet.rows);

            return (
              <div key={sheet.sheetName} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-zinc-600">
                  Sheet: {sheet.sheetName}
                </p>

                {sheet.rows.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No data in this sheet.
                  </p>
                ) : (
                  <div className="">
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
                            {headers.map((header) => (
                              <td
                                key={`${sheet.sheetName}-${rowIndex}-${header}`}
                                className="border border-zinc-200 px-3 py-1 align-top"
                              >
                                {String(row[header] ?? "")}
                              </td>
                            ))}
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
    </div>
  );
}
