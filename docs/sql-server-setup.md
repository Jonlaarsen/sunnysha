# SQL Server Connection Setup Guide

This guide explains how to connect your Next.js application to a local SQL Server database.

## Prerequisites

- SQL Server installed and running locally (or accessible on your network)
- SQL Server credentials (username and password)
- Database name you want to connect to

## Step 1: Find Your Connection Details

From your Mac dashboard connection, note down:
- **Server name/IP**: Usually `localhost` or `127.0.0.1` for local, or network IP like `192.168.x.x`
- **Database name**: The database you connect to (e.g., `Sunny`, `品管`, etc.)
- **Port**: Usually `1433` (default SQL Server port)
- **Authentication**: SQL Server Authentication (username/password) or Windows Authentication

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
# SQL Server Configuration (Local)
SQL_SERVER=localhost
# Or use IP address if connecting to remote server: 192.168.x.x

SQL_DATABASE=your_database_name
SQL_USER=your_username
SQL_PASSWORD=your_password
SQL_PORT=1433

# SQL Server Connection Options
# For local SQL Server development:
SQL_ENCRYPT=false
SQL_TRUST_CERT=true

# For Azure SQL or remote servers:
# SQL_ENCRYPT=true
# SQL_TRUST_CERT=false

# Optional: Connection timeouts (in milliseconds)
SQL_CONNECT_TIMEOUT=15000
SQL_REQUEST_TIMEOUT=15000
```

**Important:** 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Replace the placeholder values with your actual connection details

## Step 3: Test the Connection

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit the test endpoint in your browser:
   ```
   http://localhost:3000/api/sql-server/test
   ```

3. You should see a JSON response with:
   - `success: true` if connection works
   - SQL Server version and database name
   - Connection error details if it fails

## Step 4: Using the API Routes

### Test Connection
```
GET /api/sql-server/test
```

### Fetch Product Data by Barcode
```
GET /api/sql-server/product?barcode=YOUR_BARCODE
```

### Fetch Inspection Records
```
GET /api/sql-server/inspection-records?partscode=PART123&supplier=SupplierName&limit=10
```

Query Parameters:
- `partscode` (optional): Filter by part code
- `supplier` (optional): Filter by supplier
- `date` (optional): Filter by inspection date (YYYY-MM-DD)
- `limit` (optional): Limit number of results (default: 100)

## Step 5: Customize for Your Database Schema

The inspection records route (`/api/sql-server/inspection-records/route.ts`) uses placeholder table and column names. You need to update them to match your actual database:

1. **Table Name**: Update `出货检查成绩书` to match your actual table name
2. **Column Names**: Update column names in the SELECT statement to match your schema:
   - `partscode`
   - `supplier`
   - `inspection_date`
   - `pdf_path` or `pdf_url` (for PDF file locations)
   - etc.

Example query structure:
```sql
SELECT 
  partscode,
  supplier,
  po_number,
  inspection_date,
  pdf_path,
  file_name
FROM YourActualTableName
WHERE partscode = @partscode
ORDER BY inspection_date DESC
```

## Common Issues and Solutions

### Connection Timeout
- **Problem**: Connection takes too long or times out
- **Solution**: 
  - Check if SQL Server is running
  - Verify firewall settings allow port 1433
  - Check if SQL Server allows TCP/IP connections (SQL Server Configuration Manager)

### Authentication Failed
- **Problem**: Login failed for user
- **Solution**:
  - Verify username and password are correct
  - Check if SQL Server Authentication is enabled (not just Windows Authentication)
  - Ensure the user has access to the specified database

### Database Not Found
- **Problem**: Cannot open database
- **Solution**:
  - Verify database name is correct (case-sensitive)
  - Check if database exists
  - Ensure user has permissions to access the database

### Certificate/Encryption Errors
- **Problem**: Certificate validation errors
- **Solution**:
  - For local development: Set `SQL_TRUST_CERT=true` and `SQL_ENCRYPT=false`
  - For production: Use proper SSL certificates

## Windows Authentication

If your Mac dashboard uses Windows Authentication, you'll need to configure it differently. The current setup uses SQL Server Authentication (username/password). For Windows Authentication, you may need:

1. Additional configuration in the connection options
2. Kerberos setup (complex on Mac)
3. Consider using SQL Server Authentication instead for easier setup

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test connection with `/api/sql-server/test`
3. ✅ Update table/column names in inspection-records route
4. ✅ Create additional routes for your specific data needs
5. ✅ Integrate with your frontend components

## Example: Fetching PDFs

If PDFs are stored as file paths in your database, you can create a route to serve them:

```typescript
// app/api/sql-server/pdf/route.ts
// Fetch PDF path from database and serve the file
```

Or if PDFs are stored as binary data:
```typescript
// Return PDF as blob/stream
```

## Security Notes

- ✅ Never expose SQL credentials in client-side code
- ✅ Use environment variables for all sensitive data
- ✅ Use parameterized queries (already implemented) to prevent SQL injection
- ✅ Consider using connection pooling for better performance
- ✅ Close connections properly to avoid connection leaks

