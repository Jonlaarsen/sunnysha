import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// SMB folder path for Excel files
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const EXCEL_FOLDER = path.join(
  SMB_BASE_PATH,
  "SUNNY",
  "品管",
  "日锦升",
  "标准类",
  "受入检查数据表"
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";

    // Check if SMB base path exists
    try {
      const baseStats = await fs.stat(SMB_BASE_PATH);
      if (!baseStats.isDirectory()) {
        return NextResponse.json(
          { message: "SMB base path is not accessible" },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          message: "SMB share not mounted. Please mount the SMB share first.",
          error: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 503 }
      );
    }

    // Check if Excel folder exists
    try {
      const folderStats = await fs.stat(EXCEL_FOLDER);
      if (!folderStats.isDirectory()) {
        return NextResponse.json(
          { message: "Excel folder is not accessible" },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          message: "Excel folder not found or not accessible",
          error: error instanceof Error ? error.message : "Unknown error",
          expectedPath: EXCEL_FOLDER
        },
        { status: 404 }
      );
    }

    // List all files in the Excel folder
    const entries = await fs.readdir(EXCEL_FOLDER);
    const files: Array<{ name: string; size: number; modified: Date }> = [];

    for (const entry of entries) {
      const fullPath = path.join(EXCEL_FOLDER, entry);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          // Only include Excel files
          if (ext === ".xls" || ext === ".xlsx") {
            files.push({
              name: entry,
              size: stats.size,
              modified: stats.mtime,
            });
          }
        }
      } catch (error) {
        // Skip files we can't access
        continue;
      }
    }

    // Filter by search query if provided
    let filteredFiles = files;
    if (searchQuery) {
      filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery)
      );
    }

    // Sort by name and limit results
    const sortedFiles = filteredFiles
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50) // Limit to 50 results
      .map((file) => file.name);

    return NextResponse.json(sortedFiles);
  } catch (error) {
    console.error("Failed to list Excel files from SMB", error);
    return NextResponse.json(
      {
        message: "Unable to list Excel files from SMB share.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
