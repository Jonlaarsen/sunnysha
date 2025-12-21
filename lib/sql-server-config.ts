import sql from "mssql";

/**
 * SQL Server connection configuration
 * 
 * Set these environment variables in your .env.local file:
 * - SQL_SERVER: Server address (default: localhost)
 * - SQL_DATABASE: Database name
 * - SQL_USER: Username
 * - SQL_PASSWORD: Password
 * - SQL_PORT: Port number (default: 1433)
 * - SQL_ENCRYPT: Use encryption (default: false for local)
 * - SQL_TRUST_CERT: Trust server certificate (default: true for local)
 */
export const getSqlServerConfig = (): sql.config => {
  return {
    server: process.env.SQL_SERVER || "localhost",
    database: process.env.SQL_DATABASE || "",
    user: process.env.SQL_USER || "",
    password: process.env.SQL_PASSWORD || "",
    options: {
      encrypt: process.env.SQL_ENCRYPT === "true",
      trustServerCertificate: process.env.SQL_TRUST_CERT === "true",
      enableArithAbort: true,
      // Connection timeout in milliseconds (default: 15000)
      connectTimeout: parseInt(process.env.SQL_CONNECT_TIMEOUT || "15000"),
      // Request timeout in milliseconds (default: 15000)
      requestTimeout: parseInt(process.env.SQL_REQUEST_TIMEOUT || "15000"),
    },
    port: parseInt(process.env.SQL_PORT || "1433"),
    // Connection pool settings
    pool: {
      max: 10, // Maximum pool size
      min: 0,  // Minimum pool size
      idleTimeoutMillis: 30000, // Idle timeout
    },
  };
};

/**
 * Create a SQL Server connection pool
 * Remember to close the pool when done: await pool.close()
 */
export async function createSqlConnection(): Promise<sql.ConnectionPool> {
  const config = getSqlServerConfig();
  return await sql.connect(config);
}


