import { NextRequest, NextResponse } from "next/server";
import { getSqlServerConfig } from "@/lib/sql-server-config";
import sql from "mssql";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const testType = req.nextUrl.searchParams.get("test") || "connection";
  
  // Handle SMB tests that don't require SQL Server config
  const smbTests = ["smb-mount", "smb-files", "smb-api", "smb-search"];
  if (smbTests.includes(testType)) {
    try {
      switch (testType) {
        case "smb-mount":
          return await testSmbMount(req);
        case "smb-files":
          return await testSmbFiles(req);
        case "smb-api":
          return await testSmbApi(req);
        case "smb-search":
          return await testSmbSearch(req);
      }
    } catch (error: unknown) {
      const normalizedError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`SMB test error (${testType}):`, normalizedError);
      return NextResponse.json({
        success: false,
        testType,
        error: normalizedError.message,
      }, { status: 500 });
    }
  }
  
  // Handle SQL Server tests that require config
  try {
    const config = getSqlServerConfig();
    
    switch (testType) {
      case "connection":
        return await testConnection(config);
      
      case "connection-detailed":
        return await testConnectionDetailed(config);
      
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
      
      case "supplier-contact":
        return await testSupplierContact(config, req);
      
      case "connection-timeout":
        return await testConnectionTimeout(config, req);
      
      case "connection-pool":
        return await testConnectionPool(config);
      
      default:
        return NextResponse.json({
          error: "Invalid test type",
          availableTests: [
            "connection",
            "connection-detailed",
            "tables",
            "join",
            "aggregation",
            "parameters",
            "full-query",
            "schema",
            "supplier-contact",
            "connection-timeout",
            "connection-pool",
            "smb-mount",
            "smb-files",
            "smb-api",
            "smb-search"
          ]
        }, { status: 400 });
    }
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error("Unknown error");
    console.error(`SQL Server test error (${testType}):`, normalizedError);

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

// Test 1b: Detailed connection diagnostics
async function testConnectionDetailed(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  const diagnostics: any = {
    config: {
      server: config.server,
      database: config.database,
      port: config.port,
      user: config.user || "not set",
      options: {
        encrypt: config.options?.encrypt || false,
        trustServerCertificate: config.options?.trustServerCertificate || false,
        connectTimeout: config.options?.connectTimeout || 15000,
        requestTimeout: config.options?.requestTimeout || 15000,
      },
    },
    timings: {},
    errors: [],
  };
  
  try {
    const connectStart = Date.now();
    
    // Attempt connection with detailed error handling
    try {
      pool = await sql.connect(config);
      diagnostics.timings.connectDuration = Date.now() - connectStart;
      diagnostics.connected = true;
    } catch (connectError: unknown) {
      diagnostics.timings.connectDuration = Date.now() - connectStart;
      diagnostics.connected = false;
      const errorMsg = connectError instanceof Error ? connectError.message : String(connectError);
      diagnostics.errors.push({
        stage: "connection",
        error: errorMsg,
        code: (connectError as any)?.code,
        errno: (connectError as any)?.errno,
        syscall: (connectError as any)?.syscall,
      });
      
      // Try to provide helpful diagnostics
      if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("Could not connect")) {
        diagnostics.suggestions = [
          "Check if SQL Server is running",
          "Verify the server address and port are correct",
          "Check firewall rules allow connections",
          "Ensure SQL Server TCP/IP protocol is enabled",
          "Try connecting with SQL Server Management Studio to verify connectivity",
        ];
      } else if (errorMsg.includes("Login failed") || errorMsg.includes("authentication")) {
        diagnostics.suggestions = [
          "Verify username and password are correct",
          "Check SQL Server authentication mode (SQL Server or Windows)",
          "Ensure the user has permission to access the database",
        ];
      } else if (errorMsg.includes("timeout")) {
        diagnostics.suggestions = [
          "Increase SQL_CONNECT_TIMEOUT in .env.local",
          "Check network latency to the SQL Server",
          "Verify SQL Server is not overloaded",
        ];
      }
      
      throw connectError;
    }
    
    // Test basic query
    const queryStart = Date.now();
    try {
      const result = await pool.request().query("SELECT @@VERSION as version, DB_NAME() as current_database, @@SERVERNAME as server_name, SUSER_NAME() as [current_user]");
      diagnostics.timings.queryDuration = Date.now() - queryStart;
      diagnostics.querySuccess = true;
      diagnostics.queryResult = {
        version: result.recordset[0]?.version || "Unknown",
        database: result.recordset[0]?.current_database || "Unknown",
        serverName: result.recordset[0]?.server_name || "Unknown",
        currentUser: result.recordset[0]?.current_user || "Unknown",
      };
    } catch (queryError: unknown) {
      diagnostics.timings.queryDuration = Date.now() - queryStart;
      diagnostics.querySuccess = false;
      const errorMsg = queryError instanceof Error ? queryError.message : String(queryError);
      diagnostics.errors.push({
        stage: "query",
        error: errorMsg,
      });
      throw queryError;
    }
    
    await pool.close();
    diagnostics.timings.totalDuration = Date.now() - connectStart;
    
    return NextResponse.json({
      success: true,
      testType: "connection-detailed",
      message: "Detailed connection test passed",
      diagnostics,
    });
  } catch (error: unknown) {
    if (pool) {
      try {
        await pool.close();
      } catch {
        // Ignore close errors
      }
    }
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    diagnostics.timings.totalDuration = Date.now() - (diagnostics.timings.connectStart || Date.now());
    
    return NextResponse.json({
      success: false,
      testType: "connection-detailed",
      message: "Detailed connection test failed",
      error: errorMsg,
      diagnostics,
    }, { status: 500 });
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

// SMB Test Constants
const SMB_BASE_PATH = process.env.SMB_BASE_PATH || "/Volumes/SUNNYSHA";
const INSPECTION_FOLDER = path.join(
  SMB_BASE_PATH,
  "SUNNY",
  "品管",
  "日锦升",
  "出货检查成绩书"
);

// Test 8: Test supplier contact query
async function testSupplierContact(config: sql.config, req: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const supplier = req.nextUrl.searchParams.get("supplier") || "英科特";
    pool = await sql.connect(config);
    
    // Test query: select 担当 from 供应商明细 where 供应商='英科特'
    const query = `
      SELECT 担当 
      FROM 供应商明细 
      WHERE 供应商 = @supplier
    `;
    
    const sqlRequest = pool.request();
    sqlRequest.input("supplier", sql.NVarChar, supplier);
    const result = await sqlRequest.query(query);
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "supplier-contact",
      message: "Supplier contact query test",
      supplier,
      rowCount: result.recordset.length,
      records: result.recordset,
      columns: result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [],
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test 9: Test connection with different timeout settings
async function testConnectionTimeout(config: sql.config, req: NextRequest) {
  const timeoutMs = parseInt(req.nextUrl.searchParams.get("timeout") || "30000");
  
  // Create a config with custom timeout
  const timeoutConfig: sql.config = {
    ...config,
    options: {
      ...config.options,
      connectTimeout: timeoutMs,
      requestTimeout: timeoutMs,
    },
  };
  
  let pool: sql.ConnectionPool | null = null;
  const timings: any = {};
  
  try {
    const startTime = Date.now();
    pool = await sql.connect(timeoutConfig);
    timings.connectDuration = Date.now() - startTime;
    
    const queryStart = Date.now();
    const result = await pool.request().query("SELECT 1 as test");
    timings.queryDuration = Date.now() - queryStart;
    
    await pool.close();
    timings.totalDuration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      testType: "connection-timeout",
      message: `Connection test with ${timeoutMs}ms timeout`,
      timeout: timeoutMs,
      timings,
      config: {
        server: timeoutConfig.server,
        port: timeoutConfig.port,
        connectTimeout: timeoutConfig.options?.connectTimeout,
        requestTimeout: timeoutConfig.options?.requestTimeout,
      },
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      success: false,
      testType: "connection-timeout",
      message: `Connection test failed with ${timeoutMs}ms timeout`,
      timeout: timeoutMs,
      error: errorMsg,
      timings,
    }, { status: 500 });
  }
}

// Test 10: Test connection pool settings
async function testConnectionPool(config: sql.config) {
  let pool: sql.ConnectionPool | null = null;
  const results: any = {
    poolConfig: config.pool || {},
    tests: [],
  };
  
  try {
    // Test 1: Single connection
    const start1 = Date.now();
    pool = await sql.connect(config);
    const duration1 = Date.now() - start1;
    results.tests.push({ test: "single-connection", success: true, duration: duration1 });
    
    // Test 2: Multiple concurrent requests
    const concurrentStart = Date.now();
    const concurrentQueries = Array(5).fill(null).map(async () => {
      return pool!.request().query("SELECT @@SPID as session_id, DB_NAME() as db");
    });
    
    const concurrentResults = await Promise.all(concurrentQueries);
    const concurrentDuration = Date.now() - concurrentStart;
    results.tests.push({
      test: "concurrent-queries",
      success: true,
      duration: concurrentDuration,
      queryCount: concurrentResults.length,
      uniqueSessions: new Set(concurrentResults.map(r => r.recordset[0]?.session_id)).size,
    });
    
    // Test 3: Pool state
    results.poolState = {
      totalConnections: (pool as any).pool?.totalCount || "unknown",
      idleConnections: (pool as any).pool?.idleCount || "unknown",
      activeConnections: (pool as any).pool?.activeCount || "unknown",
    };
    
    await pool.close();
    
    return NextResponse.json({
      success: true,
      testType: "connection-pool",
      message: "Connection pool test",
      results,
    });
  } catch (error: unknown) {
    if (pool) await pool.close();
    throw error;
  }
}

// Test SMB Mount Status
async function testSmbMount(req: NextRequest) {
  try {
    const checkPath = req.nextUrl.searchParams.get("path") || "/Volumes";
    const resolvedPath = path.resolve(checkPath);
    
    try {
      const stats = await fs.stat(resolvedPath);
      const entries = await fs.readdir(resolvedPath);
      
      return NextResponse.json({
        success: true,
        testType: "smb-mount",
        message: "SMB mount check",
        path: resolvedPath,
        exists: true,
        isDirectory: stats.isDirectory(),
        entries: entries,
        totalEntries: entries.length,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({
        success: false,
        testType: "smb-mount",
        message: "SMB mount check failed",
        path: resolvedPath,
        exists: false,
        error: errorMessage,
      }, { status: 404 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      testType: "smb-mount",
      error: errorMessage,
    }, { status: 500 });
  }
}

// Test SMB Files Discovery
async function testSmbFiles(req: NextRequest) {
  try {
    const customPath = req.nextUrl.searchParams.get("path");
    const searchPath = customPath || INSPECTION_FOLDER;
    const resolvedPath = path.resolve(searchPath);
    
    // Security check
    const resolvedBase = path.resolve(SMB_BASE_PATH);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return NextResponse.json({
        success: false,
        testType: "smb-files",
        error: "Access denied: Path outside SMB share",
      }, { status: 403 });
    }
    
    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({
          success: false,
          testType: "smb-files",
          error: "Path is not a directory",
        }, { status: 400 });
      }
      
      const entries = await fs.readdir(resolvedPath);
      const fileDetails = await Promise.all(
        entries.map(async (fileName) => {
          try {
            const filePath = path.join(resolvedPath, fileName);
            const fileStats = await fs.stat(filePath);
            return {
              name: fileName,
              size: fileStats.size,
              modified: fileStats.mtime.toISOString(),
              isDirectory: fileStats.isDirectory(),
              extension: path.extname(fileName).toLowerCase(),
            };
          } catch {
            return {
              name: fileName,
              error: "Could not read file stats",
            };
          }
        })
      );
      
      return NextResponse.json({
        success: true,
        testType: "smb-files",
        message: "Found SMB share and files",
        foundPath: resolvedPath,
        fileCount: fileDetails.length,
        files: fileDetails,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({
        success: false,
        testType: "smb-files",
        foundPath: resolvedPath,
        error: errorMessage,
      }, { status: 404 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      testType: "smb-files",
      error: errorMessage,
    }, { status: 500 });
  }
}

// Test SMB API Endpoints
async function testSmbApi(req: NextRequest) {
  try {
    const baseUrl = req.nextUrl.origin;
    const results: any = {
      success: true,
      testType: "smb-api",
      message: "SMB API endpoints test",
      filesEndpoint: null,
      fileEndpoint: null,
    };
    
    // Test /api/smb/files endpoint
    try {
      const filesUrl = new URL("/api/smb/files", baseUrl);
      const filesResponse = await fetch(filesUrl.toString());
      const filesData = await filesResponse.json();
      
      results.filesEndpoint = {
        url: filesUrl.toString(),
        success: filesResponse.ok,
        status: filesResponse.status,
        data: filesData,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.filesEndpoint = {
        success: false,
        error: errorMessage,
      };
    }
    
    // Test /api/smb/file endpoint (if we have a file path)
    // First try to get a file list to find a test file
    try {
      const filesUrl = new URL("/api/smb/files", baseUrl);
      const filesResponse = await fetch(filesUrl.toString());
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const firstFile = filesData.files?.find((f: any) => !f.isDirectory && f.name);
        
        if (firstFile) {
          // Construct file path
          const filePath = path.join(filesData.path || INSPECTION_FOLDER, firstFile.name);
          const fileUrl = new URL("/api/smb/file", baseUrl);
          fileUrl.searchParams.set("path", filePath);
          
          const fileResponse = await fetch(fileUrl.toString());
          
          results.fileEndpoint = {
            tested: true,
            result: {
              success: fileResponse.ok,
              status: fileResponse.status,
              contentType: fileResponse.headers.get("content-type") || "unknown",
              fileName: firstFile.name,
            },
          };
        } else {
          results.fileEndpoint = {
            tested: false,
            message: "No files found to test download",
          };
        }
      } else {
        results.fileEndpoint = {
          tested: false,
          message: "Could not get file list to test download",
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.fileEndpoint = {
        tested: true,
        result: {
          success: false,
          error: errorMessage,
        },
      };
    }
    
    return NextResponse.json(results);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      testType: "smb-api",
      error: errorMessage,
    }, { status: 500 });
  }
}

// Test SMB Search - Recursively search for a specific file
async function testSmbSearch(req: NextRequest) {
  try {
    const fileName = req.nextUrl.searchParams.get("filename");
    const startPath = req.nextUrl.searchParams.get("path") || SMB_BASE_PATH;
    const maxDepth = parseInt(req.nextUrl.searchParams.get("maxDepth") || "10");
    
    if (!fileName) {
      return NextResponse.json({
        error: "filename parameter is required",
        example: "/api/sql-server/test?test=smb-search&filename=example.pdf",
      }, { status: 400 });
    }
    
    const resolvedStartPath = path.resolve(startPath);
    const resolvedBase = path.resolve(SMB_BASE_PATH);
    
    // Security check
    if (!resolvedStartPath.startsWith(resolvedBase)) {
      return NextResponse.json({
        success: false,
        testType: "smb-search",
        error: "Access denied: Path outside SMB share",
      }, { status: 403 });
    }
    
    // Recursive search function
    async function searchRecursive(
      currentPath: string,
      searchName: string,
      depth: number,
      visitedPaths: Set<string>
    ): Promise<{ path: string; stats: any } | null> {
      if (depth > maxDepth || visitedPaths.has(currentPath)) {
        return null;
      }
      
      visitedPaths.add(currentPath);
      
      try {
        const stats = await fs.stat(currentPath);
        
        if (stats.isFile()) {
          const basename = path.basename(currentPath);
          // Check if filename matches (case-insensitive or exact)
          if (basename.toLowerCase().includes(searchName.toLowerCase()) || basename === searchName) {
            return {
              path: currentPath,
              stats: {
                name: basename,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                extension: path.extname(basename).toLowerCase(),
              },
            };
          }
        } else if (stats.isDirectory()) {
          try {
            const entries = await fs.readdir(currentPath);
            
            // Search files first (faster)
            for (const entry of entries) {
              const entryPath = path.join(currentPath, entry);
              try {
                const entryStats = await fs.stat(entryPath);
                if (entryStats.isFile()) {
                  const basename = path.basename(entryPath);
                  if (basename.toLowerCase().includes(searchName.toLowerCase()) || basename === searchName) {
                    return {
                      path: entryPath,
                      stats: {
                        name: basename,
                        size: entryStats.size,
                        modified: entryStats.mtime.toISOString(),
                        extension: path.extname(basename).toLowerCase(),
                      },
                    };
                  }
                }
              } catch {
                // Skip entries we can't access
                continue;
              }
            }
            
            // Then search subdirectories
            for (const entry of entries) {
              const entryPath = path.join(currentPath, entry);
              try {
                const entryStats = await fs.stat(entryPath);
                if (entryStats.isDirectory()) {
                  const result = await searchRecursive(entryPath, searchName, depth + 1, visitedPaths);
                  if (result) {
                    return result;
                  }
                }
              } catch {
                // Skip directories we can't access
                continue;
              }
            }
          } catch {
            // Skip directories we can't read
            return null;
          }
        }
      } catch {
        // Skip paths we can't access
        return null;
      }
      
      return null;
    }
    
    const visitedPaths = new Set<string>();
    const found = await searchRecursive(resolvedStartPath, fileName, 0, visitedPaths);
    
    if (found) {
      return NextResponse.json({
        success: true,
        testType: "smb-search",
        message: "File found",
        searchTerm: fileName,
        startPath: resolvedStartPath,
        found: {
          path: found.path,
          relativePath: path.relative(resolvedStartPath, found.path),
          ...found.stats,
        },
        visitedDirectories: visitedPaths.size,
      });
    } else {
      return NextResponse.json({
        success: false,
        testType: "smb-search",
        message: "File not found",
        searchTerm: fileName,
        startPath: resolvedStartPath,
        visitedDirectories: visitedPaths.size,
        maxDepth,
      }, { status: 404 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      testType: "smb-search",
      error: errorMessage,
    }, { status: 500 });
  }
}
