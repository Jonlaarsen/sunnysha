import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Base path for SMB share (adjust if needed)
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const INSPECTION_FOLDER = path.join(
  SMB_BASE_PATH,
  "SUNNY",
  "品管",
  "日锦升",
  "出货检查成绩书"
);

// Helper function to get folder path for a specific year
function getYearFolder(year?: string | null): string {
  const yearToUse = year || new Date().getFullYear().toString();
  return path.join(INSPECTION_FOLDER, yearToUse);
}

export async function GET(req: NextRequest) {
  try {
    const customPath = req.nextUrl.searchParams.get("path");
    const year = req.nextUrl.searchParams.get("year");
    const folderPath = customPath || (year ? getYearFolder(year) : INSPECTION_FOLDER);
    const fileType = req.nextUrl.searchParams.get("type") || "all"; // all, pdf, xls, xlsx

    // Security: Ensure path is within SMB base
    const resolvedPath = path.resolve(folderPath);
    const resolvedBase = path.resolve(SMB_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json(
        { error: "Access denied: Path outside SMB share" },
        { status: 403 }
      );
    }

    // Check if path exists
    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: "Path is not a directory" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Path does not exist or is not accessible" },
        { status: 404 }
      );
    }

    // Read directory
    const entries = await fs.readdir(resolvedPath);

    // Filter by file type if specified
    let files = entries;
    if (fileType !== "all") {
      const extensions = fileType.split(",").map((ext) => {
        const trimmed = ext.trim().toLowerCase();
        // Remove leading dot if present
        return trimmed.startsWith(".") ? trimmed.slice(1) : trimmed;
      });
      files = entries.filter((entry) => {
        const ext = path.extname(entry).toLowerCase().slice(1); // Remove leading dot
        return extensions.includes(ext);
      });
    }

    // Get file stats
    const fileDetails = await Promise.all(
      files.map(async (fileName) => {
        try {
          const filePath = path.join(resolvedPath, fileName);
          const stats = await fs.stat(filePath);
          return {
            name: fileName,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
            extension: path.extname(fileName).toLowerCase(),
          };
        } catch {
          return {
            name: fileName,
            error: "Could not read file stats",
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      path: resolvedPath,
      fileCount: fileDetails.length,
      files: fileDetails,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SMB files error:", errorMessage);
    
    return NextResponse.json(
      {
        error: "Failed to read SMB files",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

