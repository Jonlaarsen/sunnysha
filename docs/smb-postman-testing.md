# SMB Connection Testing Guide for Postman

This guide explains how to test SMB file access endpoints using Postman.

## Prerequisites

1. **Mount the SMB share** before testing:
   - Open Finder
   - Press `Cmd+K` (or Go > Connect to Server)
   - Enter: `smb://192.168.1.120`
   - Login with credentials: `sit0009` / `123456`
   - Navigate to: `SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书`
   - The share will be mounted at `/Volumes/SUNNYSHA`

2. **Start your Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Base URL**: `http://localhost:3000`

---

## Test Endpoints

### 1. Test SMB Mount Status

**Endpoint**: `GET /api/sql-server/test?test=smb-mount`

**Description**: Checks if the SMB share is mounted and accessible.

**Postman Setup**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/sql-server/test?test=smb-mount`
- **Query Parameters** (optional):
  - `path`: Custom path to check (default: `/Volumes`)

**Example Requests**:

```
# Check default /Volumes directory
GET http://localhost:3000/api/sql-server/test?test=smb-mount

# Check specific path
GET http://localhost:3000/api/sql-server/test?test=smb-mount&path=/Volumes/SUNNYSHA
```

**Expected Response**:
```json
{
  "success": true,
  "testType": "smb-mount",
  "message": "SMB mount check",
  "path": "/Volumes",
  "exists": true,
  "isDirectory": true,
  "entries": ["Macintosh HD", "SUNNYSHA"],
  "totalEntries": 2
}
```

---

### 2. Test SMB Files Discovery

**Endpoint**: `GET /api/sql-server/test?test=smb-files`

**Description**: Searches for files in the inspection records folder.

**Postman Setup**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/sql-server/test?test=smb-files`
- **Query Parameters** (optional):
  - `path`: Custom folder path to search

**Example Requests**:

```
# Search default inspection folder
GET http://localhost:3000/api/sql-server/test?test=smb-files

# Search specific path
GET http://localhost:3000/api/sql-server/test?test=smb-files&path=/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书
```

**Expected Response**:
```json
{
  "success": true,
  "testType": "smb-files",
  "message": "Found SMB share and files",
  "foundPath": "/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书",
  "fileCount": 4,
  "files": [
    {
      "name": "受检脱脂确认25.6-8.pdf",
      "size": 123456,
      "modified": "2025-01-15T10:30:00.000Z",
      "isDirectory": false,
      "extension": ".pdf"
    }
  ]
}
```

---

### 3. List Files from SMB Share

**Endpoint**: `GET /api/smb/files`

**Description**: Lists files in a specific folder with optional filtering.

**Postman Setup**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/smb/files`
- **Query Parameters**:
  - `year` (optional): Year folder to access (e.g., `2025`, `2024`)
  - `path` (optional): Custom folder path
  - `type` (optional): Filter by file type (`pdf`, `xls`, `xlsx`, `all`)

**Example Requests**:

```
# List all files in default folder
GET http://localhost:3000/api/smb/files

# List files in 2025 folder
GET http://localhost:3000/api/smb/files?year=2025

# List only PDF files in 2025 folder
GET http://localhost:3000/api/smb/files?year=2025&type=pdf

# List Excel files
GET http://localhost:3000/api/smb/files?year=2025&type=xls,xlsx

# Use custom path
GET http://localhost:3000/api/smb/files?path=/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书/2025
```

**Expected Response**:
```json
{
  "success": true,
  "path": "/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书/2025",
  "fileCount": 10,
  "files": [
    {
      "name": "受检脱脂确认25.6-8.pdf",
      "size": 123456,
      "modified": "2025-01-15T10:30:00.000Z",
      "isDirectory": false,
      "extension": ".pdf"
    }
  ]
}
```

**Error Responses**:

```json
// Path not found
{
  "error": "Path does not exist or is not accessible"
}

// Access denied (path outside SMB share)
{
  "error": "Access denied: Path outside SMB share"
}
```

---

### 4. Download/View File from SMB Share

**Endpoint**: `GET /api/smb/file`

**Description**: Downloads or views a specific file from the SMB share.

**Postman Setup**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/smb/file`
- **Query Parameters**:
  - `path` (required): Full path to the file

**Example Requests**:

```
# Download a PDF file from 2025 folder
GET http://localhost:3000/api/smb/file?path=/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书/2025/受检脱脂确认25.6-8.pdf

# Download Excel file
GET http://localhost:3000/api/smb/file?path=/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书/2025/report.xlsx
```

**Expected Response**:
- **Status**: `200 OK`
- **Content-Type**: 
  - `application/pdf` for PDF files
  - `application/vnd.ms-excel` for Excel files
  - `text/plain` for text files
- **Body**: Binary file content

**In Postman**:
1. Send the request
2. Click "Send and Download" to save the file
3. Or view in Postman's response viewer (for PDFs)

**Error Responses**:

```json
// Missing path parameter
{
  "error": "File path is required"
}

// File not found
{
  "error": "File does not exist or is not accessible"
}

// Access denied
{
  "error": "Access denied: Path outside SMB share"
}
```

---

### 5. Test SMB API Endpoints

**Endpoint**: `GET /api/sql-server/test?test=smb-api`

**Description**: Tests both SMB API endpoints (files and file) automatically.

**Postman Setup**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/sql-server/test?test=smb-api`

**Expected Response**:
```json
{
  "success": true,
  "testType": "smb-api",
  "message": "SMB API endpoints test",
  "filesEndpoint": {
    "url": "http://localhost:3000/api/smb/files",
    "success": true,
    "status": 200,
    "data": {
      "success": true,
      "path": "/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书",
      "fileCount": 4,
      "files": [...]
    }
  },
  "fileEndpoint": {
    "tested": true,
    "result": {
      "success": true,
      "status": 200,
      "contentType": "application/pdf",
      "fileName": "受检脱脂确认25.6-8.pdf"
    }
  }
}
```

---

## Postman Collection Setup

### Create a Postman Collection

1. **Create New Collection**: "SMB Testing"
2. **Add Environment Variables**:
   - `base_url`: `http://localhost:3000`
   - `smb_path`: `/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书`

### Collection Structure

```
SMB Testing
├── 1. Test SMB Mount
│   └── GET {{base_url}}/api/sql-server/test?test=smb-mount
├── 2. Test SMB Files Discovery
│   └── GET {{base_url}}/api/sql-server/test?test=smb-files
├── 3. List Files (Default)
│   └── GET {{base_url}}/api/smb/files
├── 4. List Files (2025)
│   └── GET {{base_url}}/api/smb/files?year=2025
├── 5. List PDF Files Only
│   └── GET {{base_url}}/api/smb/files?year=2025&type=pdf
├── 6. Download File
│   └── GET {{base_url}}/api/smb/file?path={{smb_path}}/2025/example.pdf
└── 7. Test SMB API
    └── GET {{base_url}}/api/sql-server/test?test=smb-api
```

---

## Common Testing Scenarios

### Scenario 1: Verify SMB Share is Mounted

```
1. GET /api/sql-server/test?test=smb-mount
   → Should return success: true with entries including "SUNNYSHA"
```

### Scenario 2: List All Files in 2025 Folder

```
1. GET /api/smb/files?year=2025
   → Should return list of files in 2025 folder
```

### Scenario 3: Filter PDF Files Only

```
1. GET /api/smb/files?year=2025&type=pdf
   → Should return only PDF files
```

### Scenario 4: Download a Specific File

```
1. First, get file list:
   GET /api/smb/files?year=2025
   
2. Copy a file path from response, then:
   GET /api/smb/file?path=/Volumes/SUNNYSHA/SUNNY/品管/日锦升/出货检查成绩书/2025/[filename]
   → Should download the file
```

### Scenario 5: Test Error Handling

```
# Test with invalid path
GET /api/smb/files?path=/invalid/path
→ Should return 404 or 403 error

# Test with missing path parameter
GET /api/smb/file
→ Should return 400 error with "File path is required"

# Test with path outside SMB share
GET /api/smb/file?path=/etc/passwd
→ Should return 403 "Access denied"
```

---

## Troubleshooting

### Issue: "Path does not exist or is not accessible"

**Solutions**:
1. Verify SMB share is mounted: `ls /Volumes/SUNNYSHA`
2. Check the path is correct (case-sensitive)
3. Ensure you have read permissions

### Issue: "Access denied: Path outside SMB share"

**Solutions**:
1. Ensure path starts with `/Volumes/SUNNYSHA`
2. Don't use `..` or absolute paths outside the share
3. Check `SMB_BASE_PATH` environment variable

### Issue: Empty file list

**Solutions**:
1. Verify files exist in the folder
2. Check file type filter (e.g., `type=pdf` might filter out other files)
3. Try without filters first: `GET /api/smb/files?year=2025`

### Issue: File download returns error

**Solutions**:
1. Verify file path is correct (copy from files list response)
2. Ensure file exists and is readable
3. Check file isn't locked by another process

---

## Quick Reference

| Endpoint | Method | Purpose | Required Params |
|----------|--------|---------|-----------------|
| `/api/sql-server/test?test=smb-mount` | GET | Check mount status | None |
| `/api/sql-server/test?test=smb-files` | GET | Discover files | None |
| `/api/smb/files` | GET | List files | None (year recommended) |
| `/api/smb/file` | GET | Download file | `path` |
| `/api/sql-server/test?test=smb-api` | GET | Test all endpoints | None |

---

## Notes

- All paths are case-sensitive
- File paths must be URL-encoded when using special characters
- The SMB share must be mounted before testing
- Year folders (2025, 2024, etc.) must exist in the inspection records folder
- File downloads return binary content, not JSON
