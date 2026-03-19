# SU-WH

A Next.js + Electron desktop application for QC workflows.

## Development

### Web (Next.js only)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Electron (desktop app)

```bash
npm run electron:dev
```

Runs Next.js dev server and opens the app in an Electron window. Environment variables from `.env.local` are loaded automatically.

## Building for Production

### Electron desktop app

```bash
npm run electron:build
```

Creates installers in `dist/`:
- **macOS**: `.dmg` and `.zip`
- **Windows**: `.exe` (NSIS) and portable
- **Linux**: `.AppImage`

## Environment Variables

Your `.env.local` file is loaded in both development and production.

### SMB share path

If you connect to `smb://192.168.1.120/SUNNYSHA/SUNNY`, the share mounts at `/Volumes/SUNNY`. Add to `.env.local`:

```
SMB_BASE_PATH=/Volumes/SUNNY
```

If you connect to `smb://192.168.1.120/SUNNYSHA` (mounts at `/Volumes/SUNNYSHA`), no change needed.

### Production build

For the packaged Electron app, env vars are loaded from (in order):

1. `.env.local` or `.env` in the app resources
2. `.env.local` or `.env` next to the `.app` bundle (macOS) or executable
3. Current working directory

**To include env in the packaged app** (optional, for distribution):

1. Create `.env.local` in the project root before running `npm run electron:build`
2. Add to `package.json` under `build.extraFiles`:
   ```json
   "extraFiles": [
     { "source": ".env.local", "destination": "." }
   ]
   ```

**Security note**: Avoid bundling secrets in the app. Prefer placing `.env.local` next to the installed app for production deployments.

## Project Structure

- `app/` – Next.js App Router pages and API routes
- `components/` – React components
- `electron/main.js` – Electron main process
- `lib/` – Supabase, SQL Server config
