import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// SMB folder path for drawings (图纸)
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const DRAWINGS_FOLDER = path.join(
  SMB_BASE_PATH,
  "SUNNY",
  "品管",
  "图纸"
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!searchQuery) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

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

    // Check if drawings folder exists
    try {
      const folderStats = await fs.stat(DRAWINGS_FOLDER);
      if (!folderStats.isDirectory()) {
        return NextResponse.json(
          { message: "Drawings folder is not accessible" },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          message: "Drawings folder not found or not accessible",
          error: error instanceof Error ? error.message : "Unknown error",
          expectedPath: DRAWINGS_FOLDER
        },
        { status: 404 }
      );
    }

    // List all files in the drawings folder (recursively)
    async function listFilesRecursive(dir: string, fileList: Array<{ name: string; path: string; size: number; modified: Date }> = []): Promise<Array<{ name: string; path: string; size: number; modified: Date }>> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            // Recursively search subdirectories
            await listFilesRecursive(fullPath, fileList);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            // Only include PDF, TIF, and JPG files
            if (ext === '.pdf' || ext === '.tif' || ext === '.tiff' || ext === '.jpg' || ext === '.jpeg') {
              const stats = await fs.stat(fullPath);
              fileList.push({
                name: entry.name,
                path: fullPath,
                size: stats.size,
                modified: stats.mtime,
              });
            }
          }
        } catch (error) {
          // Skip files/folders we can't access
          continue;
        }
      }
      
      return fileList;
    }

    // Get all files recursively
    const allFiles = await listFilesRecursive(DRAWINGS_FOLDER);

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
        message: "Unable to search drawings from SMB share.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
