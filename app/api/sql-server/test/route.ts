import { NextRequest, NextResponse } from "next/server";
import { getSqlServerConfig } from "@/lib/sql-server-config";
import sql from "mssql";

export async function GET(req: NextRequest) {
  const testType = req.nextUrl.searchParams.get("test") || "connection";
  let pool: sql.ConnectionPool | null = null;
  
  try {
    const config = getSqlServerConfig();
    
    switch (testType) {
      case "connection":
        return await testConnection(config);
      
      case "tables":
        return await testTables(config);
      
      case "join":
        return await testJoin(config);
      
      case "aggregation":
        return await testAggregation(config);
      
      case "parameters":
        return await testParameters(config, req);
      
      case "full-query":
        return await testFullQuery(config, req);
      
      case "schema":
        return await testSchema(config, req);
      
      default:
        return NextResponse.json({
          error: "Invalid test type",
          availableTests: [
            "connection",
            "tables",
            "join",
            "aggregation",
            "parameters",
            "full-query",
            "schema"
          ]
        }, { status: 400 });
    }
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error("Unknown error");
    console.error(`SQL Server test error (${testType}):`, normalizedError);
    
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("Failed to close SQL connection:", closeError);
      }
    }

    return NextResponse.json({
      success: false,
      testType,
      error: normalizedError.message,
    }, { status: 500 });
  }
}

// Test 1: Basic connection
async function testConnection(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query("SELECT @@VERSION as version, DB_NAME() as current_database");
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "connection",
      message: "Connection test passed",
      version: result.recordset[0]?.version || "Unknown",
      database: result.recordset[0]?.current_database || "Unknown",
      config: {
        server: config.server,
        database: config.database,
        port: config.port,
      },
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 2: Check if tables exist
async function testTables(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    
    // Test if the tables used in the product query exist
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
        AND (TABLE_NAME = '送货单' OR TABLE_NAME = '收货明细')
      ORDER BY TABLE_NAME
    `;
    
    const result = await pool.request().query(tablesQuery);
    await pool.close();
    
    const tableNames = result.recordset.map((row: any) => row.TABLE_NAME);
    
    return NextResponse.json({
      success: true,
      testType: "tables",
      message: "Table existence check",
      tablesFound: tableNames,
      tablesChecked: ["送货单", "收货明细"],
      allTablesExist: tableNames.length === 2,
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 3: Test JOIN operation
async function testJoin(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    
    // Test the JOIN part of the query without aggregation
    const joinQuery = `
      SELECT TOP 5
        a.supplier,
        a.po,
        a.partscode,
        a.ShouHuo_Date,
        b.条形码,
        b.date,
        b.qty
      FROM 送货单 a
      INNER JOIN 收货明细 b 
        ON a.po = b.po 
        AND a.item = b.item 
        AND a.ShouHuo_Date = CONVERT(date, b.date, 121)
      ORDER BY a.ShouHuo_Date DESC
    `;
    
    const result = await pool.request().query(joinQuery);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "join",
      message: "JOIN operation test",
      rowCount: result.recordset.length,
      sampleRows: result.recordset.slice(0, 3),
      columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 4: Test aggregation (GROUP BY)
async function testAggregation(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    
    // Test aggregation without WHERE clause
    const aggQuery = `
      SELECT TOP 10
        supplier,
        po,
        partscode,
        Date = ShouHuo_Date,
        qty = SUM(qty)
      FROM (
        SELECT a.*, b.qty
        FROM 送货单 a
        INNER JOIN 收货明细 b 
          ON a.po = b.po 
          AND a.item = b.item 
          AND a.ShouHuo_Date = CONVERT(date, b.date, 121)
      ) a
      GROUP BY supplier, po, partscode, ShouHuo_Date
      ORDER BY ShouHuo_Date DESC
    `;
    
    const result = await pool.request().query(aggQuery);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "aggregation",
      message: "Aggregation (GROUP BY) test",
      rowCount: result.recordset.length,
      sampleRows: result.recordset.slice(0, 3),
      columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 5: Test parameter binding
async function testParameters(config: sql.config, req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const testBarcode = req.nextUrl.searchParams.get("barcode") || "TEST123";
    pool = await sql.connect(config);
    
    // Test parameterized query with WHERE clause
    const paramQuery = `
      SELECT TOP 5
        a.supplier,
        a.po,
        a.partscode,
        a.ShouHuo_Date,
        b.条形码,
        b.qty
      FROM 送货单 a
      INNER JOIN 收货明细 b 
        ON a.po = b.po 
        AND a.item = b.item 
        AND a.ShouHuo_Date = CONVERT(date, b.date, 121)
      WHERE b.条形码 = @barcode
    `;
    
    const sqlRequest = pool.request();
    sqlRequest.input("barcode", sql.NVarChar, testBarcode);
    const result = await sqlRequest.query(paramQuery);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "parameters",
      message: "Parameter binding test",
      testBarcode,
      rowCount: result.recordset.length,
      sampleRows: result.recordset,
      columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 6: Test full query (exact replica of product route)
async function testFullQuery(config: sql.config, req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const barcode = req.nextUrl.searchParams.get("barcode");
    
    if (!barcode) {
      return NextResponse.json({
        error: "Barcode parameter required for full-query test",
        example: "/api/sql-server/test?test=full-query&barcode=YOUR_BARCODE"
      }, { status: 400 });
    }
    
    pool = await sql.connect(config);
    
    // Exact query from product route
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
    
    const sqlRequest = pool.request();
    sqlRequest.input("barcode", sql.NVarChar, barcode);
    const result = await sqlRequest.query(query);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "full-query",
      message: "Full query test (exact replica of product route)",
      barcode,
      rowCount: result.recordset.length,
      recordsets: [result.recordset],
      recordset: result.recordset,
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 7: Test schema/column existence
async function testSchema(config: sql.config, req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const tableName = req.nextUrl.searchParams.get("table") || "送货单";
    pool = await sql.connect(config);
    
    // Get column information for the table
    const schemaQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `;
    
    const sqlRequest = pool.request();
    sqlRequest.input("tableName", sql.NVarChar, tableName);
    const result = await sqlRequest.query(schemaQuery);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "schema",
      message: "Schema/column check",
      tableName,
      columnCount: result.recordset.length,
      columns: result.recordset,
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}
