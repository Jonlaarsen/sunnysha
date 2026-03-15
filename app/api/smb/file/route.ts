import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Base path for SMB share
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";

export async function GET(req: NextRequest) {
  try {
    const filePath = req.nextUrl.searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Security: Ensure path is within SMB base
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(SMB_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json(
        { error: "Access denied: Path outside SMB share" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.isDirectory()) {
        return NextResponse.json(
          { error: "Path is a directory, not a file" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "File does not exist or is not accessible" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(resolvedPath);
    const fileName = path.basename(resolvedPath);
    const ext = path.extname(fileName).toLowerCase();

    // Determine content type
    let contentType = "application/octet-stream";
    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".xls" || ext === ".xlsx") {
      contentType = "application/vnd.ms-excel";
    } else if (ext === ".txt") {
      contentType = "text/plain";
    } else if (ext === ".csv") {
      contentType = "text/csv";
    } else if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".tif" || ext === ".tiff") {
      contentType = "image/tiff";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".gif") {
      contentType = "image/gif";
    }

    // Return file
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SMB file read error:", errorMessage);
    
    return NextResponse.json(
      {
        error: "Failed to read file from SMB",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

