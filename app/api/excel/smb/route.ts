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

const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const SUNNY_PATH = path.basename(SMB_BASE_PATH) === "SUNNY" ? SMB_BASE_PATH : path.join(SMB_BASE_PATH, "SUNNY");
const EXCEL_FOLDER = path.join(SUNNY_PATH, "品管", "日锦升", "标准类", "受入检查数据表");

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
        { message: "请输入文件名。" },
        { status: 400 }
      );
    }

    // Security: Ensure filename doesn't contain path traversal
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      return NextResponse.json(
        { message: "文件名无效。" },
        { status: 400 }
      );
    }

    const filePath = path.join(EXCEL_FOLDER, fileName);

    // Security: Ensure resolved path is within Excel folder
    const resolvedPath = path.resolve(filePath);
    const resolvedFolder = path.resolve(EXCEL_FOLDER);
    
    if (!resolvedPath.startsWith(resolvedFolder)) {
      return NextResponse.json(
        { message: "访问被拒绝：路径超出 Excel 文件夹范围" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return NextResponse.json(
          { message: "路径是目录，不是文件" },
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

    const sheets = await readExcelFile(arrayBuffer as ArrayBuffer);

    const payload: ExcelFile = {
      fileName,
      sheets,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load Excel file from SMB", error);
    return NextResponse.json(
      {
        message: "无法从 SMB 共享加载 Excel 文件。",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
