import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

type SheetData = {
  sheetName: string;
  rows: Record<string, unknown>[];
};

type ExcelFile = {
  fileName: string;
  sheets: SheetData[];
};

const EXCEL_DIR = path.join(process.cwd(), "test-folder");

async function readExcelFile(filePath: string): Promise<SheetData[]> {
  const buffer = await fs.readFile(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    return { sheetName, rows };
  });
}

export async function GET() {
  try {
    const entries = await fs.readdir(EXCEL_DIR);
    const excelFiles = entries.filter((entry) =>
      entry.toLowerCase().match(/\.xls[x]?$/),
    );

    const payload: ExcelFile[] = await Promise.all(
      excelFiles.map(async (fileName) => {
        const filePath = path.join(EXCEL_DIR, fileName);
        const sheets = await readExcelFile(filePath);

        return { fileName, sheets };
      }),
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load Excel files", error);
    return NextResponse.json(
      { message: "Unable to load Excel files." },
      { status: 500 },
    );
  }
}

