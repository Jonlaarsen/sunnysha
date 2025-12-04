import { NextRequest, NextResponse } from "next/server";
import { getSqlServerConfig } from "@/lib/sql-server-config";
import sql from "mssql";

export async function GET(req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    const barcode = req.nextUrl.searchParams.get("barcode");
    const mock = req.nextUrl.searchParams.get("mock");

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 }
      );
    }

    if (mock === "true") {
      // Mock data for testing (Vercel doesn't have persistent file system)
      const mockData = {
        recordsets: [[
          {
            supplier: "Test Supplier",
            po: "PO12345",
            partscode: barcode || "TEST123",
            Date: new Date().toISOString().split('T')[0],
            qty: 100
          }
        ]],
        recordset: [{
          supplier: "Test Supplier",
          po: "PO12345",
          partscode: barcode || "TEST123",
          Date: new Date().toISOString().split('T')[0],
          qty: 100
        }]
      };
      return NextResponse.json(mockData);
    }

    // Connect to SQL Server (uses connection pooling)
    const config = getSqlServerConfig();
    pool = await sql.connect(config);

    // SQL query with parameterized barcode
    const query = `
      select 
        supplier,
        po,
        partscode,
        Date=ShouHuo_Date,
        qty=sum(qty) 
      from (
        select a.* 
        from 送货单 a, 收货明细 b 
        where a.po=b.po 
          and a.item=b.item 
          and a.ShouHuo_Date=convert(date,b.date,121) 
          and b.条形码=@barcode
      ) a 
      group by supplier,po,partscode,ShouHuo_Date
    `;

    // Execute query with parameter
    const sqlRequest = pool.request();
    sqlRequest.input("barcode", sql.NVarChar, barcode);
    const result = await sqlRequest.query(query);

    // Close connection pool (in production, you might want to keep it open)
    await pool.close();

    // Return the result
    // mssql returns data in result.recordset
    return NextResponse.json({
      recordsets: [result.recordset],
      recordset: result.recordset,
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("SQL Server error:", normalizedError);
    
    // Close connection pool on error if it exists
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("Failed to close SQL connection pool:", closeError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch data from SQL Server",
        details: normalizedError.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

