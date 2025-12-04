import { NextRequest, NextResponse } from "next/server";
import { getSqlServerConfig } from "@/lib/sql-server-config";
import sql from "mssql";

export async function GET() {
  let pool: sql.ConnectionPool | null = null;
  
  try {
    const config = getSqlServerConfig();
    // Test connection
    pool = await sql.connect(config);
    
    // Test query - get SQL Server version
    const result = await pool.request().query("SELECT @@VERSION as version, DB_NAME() as current_database");
    
    await pool.close();
    
    return NextResponse.json({
      success: true,
      message: "Connected to SQL Server successfully",
      version: result.recordset[0]?.version || "Unknown",
      database: result.recordset[0]?.current_database || "Unknown",
      config: {
        server: config.server,
        database: config.database,
        port: config.port,
        // Don't expose password
      },
    });
  } catch (error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unknown error");
    console.error("SQL Server connection error:", normalizedError);
    
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
        error: normalizedError.message,
        message: "Failed to connect to SQL Server. Please check your connection settings.",
        config: {
          server: config.server,
          database: config.database,
          port: config.port,
          // Don't expose password
        },
      },
      { status: 500 }
    );
  }
}

