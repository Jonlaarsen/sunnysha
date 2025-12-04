import { NextRequest, NextResponse } from "next/server";
import { getSqlServerConfig } from "@/lib/sql-server-config";
import sql from "mssql";

export async function GET(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    // Get query parameters
    const partscode = req.nextUrl.searchParams.get("partscode");
    const supplier = req.nextUrl.searchParams.get("supplier");
    const date = req.nextUrl.searchParams.get("date");
    const limit = req.nextUrl.searchParams.get("limit");

    // Connect to SQL Server
    const config = getSqlServerConfig();
    pool = await sql.connect(config);

    // Query for inspection records (出货检查成绩书)
    // Adjust table and column names based on your actual database schema
    let query = `
      SELECT TOP ${limit ? parseInt(limit) : 100}
        -- Adjust these column names to match your actual schema
        partscode,
        supplier,
        po_number,
        inspection_date,
        delivery_date,
        pdf_path,      -- Path to PDF file if stored in database
        pdf_url,       -- URL if PDFs are stored elsewhere
        file_name,     -- PDF file name
        created_at,
        -- Add other columns you need from your inspection records table
        *
      FROM 出货检查成绩书  -- Adjust table name to match your actual table
      WHERE 1=1
    `;

    const sqlRequest = pool.request();
    
    // Add parameters if provided
    if (partscode) {
      query += ` AND partscode = @partscode`;
      sqlRequest.input("partscode", sql.NVarChar, partscode);
    }
    if (supplier) {
      query += ` AND supplier = @supplier`;
      sqlRequest.input("supplier", sql.NVarChar, supplier);
    }
    if (date) {
      query += ` AND CAST(inspection_date AS DATE) = @date`;
      sqlRequest.input("date", sql.Date, date);
    }

    query += ` ORDER BY inspection_date DESC, created_at DESC`;

    const result = await sqlRequest.query(query);
    await pool.close();

    return NextResponse.json({
      success: true,
      message: `Fetched ${result.recordset.length} inspection records`,
      data: result.recordset,
      count: result.recordset.length,
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("SQL Server error:", normalizedError);
    
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("Failed to close SQL connection:", closeError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch inspection records",
        details: normalizedError.message,
        hint: "Please check your table name and column names match your database schema",
      },
      { status: 500 }
    );
  }
}

