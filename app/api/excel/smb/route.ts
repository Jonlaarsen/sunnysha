import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";

type SheetData = {
  sheetName: string;
  rows: Record<string, unknown>[];
};

type ExcelFile = {
  fileName: string;
  sheets: SheetData[];
};

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

async function readExcelFile(buffer: ArrayBuffer): Promise<SheetData[]> {
  const workbook = XLSX.read(buffer, { type: "array" });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    return { sheetName, rows };
  });
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json(
        { message: "File name is required." },
        { status: 400 }
      );
    }

    // Security: Ensure filename doesn't contain path traversal
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      return NextResponse.json(
        { message: "Invalid file name." },
        { status: 400 }
      );
    }

    const filePath = path.join(EXCEL_FOLDER, fileName);

    // Security: Ensure resolved path is within Excel folder
    const resolvedPath = path.resolve(filePath);
    const resolvedFolder = path.resolve(EXCEL_FOLDER);
    
    if (!resolvedPath.startsWith(resolvedFolder)) {
      return NextResponse.json(
        { message: "Access denied: Path outside Excel folder" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return NextResponse.json(
          { message: "Path is a directory, not a file" },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { message: `File not found: ${fileName}` },
        { status: 404 }
      );
    }

    // Read file from SMB share
    const fileBuffer = await fs.readFile(filePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const sheets = await readExcelFile(arrayBuffer);

    const payload: ExcelFile = {
      fileName,
      sheets,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load Excel file from SMB", error);
    return NextResponse.json(
      {
        message: "Unable to load Excel file from SMB share.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
