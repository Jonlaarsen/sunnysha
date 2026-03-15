import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Base path for SMB share
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";

export async function GET(req: NextRequest) {
  try {
    const filePath = req.nextUrl.searchParams.get("path");
    const format = req.nextUrl.searchParams.get("format") || "png";

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

    const ext = path.extname(resolvedPath).toLowerCase();
    
    // Only convert TIF files
    if (ext !== ".tif" && ext !== ".tiff") {
      return NextResponse.json(
        { error: "Only TIF/TIFF files can be converted" },
        { status: 400 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(resolvedPath);

    // Convert TIF to PNG using sharp
    try {
      const pngBuffer = await sharp(fileBuffer)
        .png()
        .toBuffer();
      
      return new NextResponse(pngBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="${path.basename(resolvedPath, ext)}.png"`,
          "Content-Length": pngBuffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (conversionError) {
      console.error("TIF conversion error:", conversionError);
      // If conversion fails, return original file
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": "image/tiff",
          "Content-Disposition": `attachment; filename="${path.basename(resolvedPath)}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SMB file conversion error:", errorMessage);
    
    return NextResponse.json(
      {
        error: "Failed to convert file from SMB",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
