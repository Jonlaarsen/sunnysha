# Vercel Deployment Guide

This guide covers deploying your QC System to Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project configured
- Resend account for emails (optional)

## Step 1: Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

## Step 2: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Configuration
ADMIN_EMAILS=admin@example.com,another-admin@example.com

# App URL (your Vercel deployment URL)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Optional Variables

```env
# SQL Server Configuration (if using SQL Server)
SQL_SERVER=your-sql-server-ip
SQL_DATABASE=your_database_name
SQL_USER=your_username
SQL_PASSWORD=your_password
SQL_PORT=1433
SQL_ENCRYPT=false
SQL_TRUST_CERT=true

# Email Configuration (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=QC System <noreply@yourdomain.com>
```

## Step 3: Important Notes for Vercel

### File System Limitations

- **Vercel is serverless**: No persistent file system
- The `test-folder` directory won't exist on Vercel
- Excel file reading will return empty array (gracefully handled)
- Mock data files won't be available (using inline mock data instead)

### SQL Server Connection

- SQL Server must be accessible from the internet (not localhost)
- Use your public IP address or domain name
- Ensure firewall allows connections from Vercel's IP ranges
- Consider using Azure SQL or a VPN for better security

### Build Configuration

- Build command: `npm run build` (default)
- Output directory: `.next` (default)
- Install command: `npm install` (default)

## Step 4: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Step 5: Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Verify Supabase connection
- [ ] Test admin user creation
- [ ] Verify email sending (if configured)
- [ ] Test SQL Server connection (if configured)
- [ ] Check all API routes are working
- [ ] Verify environment variables are set correctly

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all TypeScript errors are fixed
- Verify all dependencies are in `package.json`

### Environment Variables Not Working

- Make sure variables are set in Vercel project settings
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### SQL Server Connection Fails

- Verify SQL Server is accessible from internet
- Check firewall rules allow Vercel IPs
- Ensure SQL Server Authentication is enabled
- Check connection timeout settings

### File System Errors

- Excel route will return empty array (expected on Vercel)
- Mock data endpoints use inline data instead of files
- This is normal behavior for serverless functions

## Performance Optimization

- API routes have 30-second timeout (configured in `vercel.json`)
- Consider using Vercel Edge Functions for faster responses
- Enable caching where appropriate
- Use Supabase connection pooling

## Security Best Practices

- Never commit `.env.local` files
- Use Vercel's environment variables for secrets
- Enable Supabase Row Level Security (RLS)
- Use HTTPS only (Vercel handles this automatically)
- Regularly rotate API keys and passwords

## Monitoring

- Check Vercel dashboard for deployment status
- Monitor function logs for errors
- Set up Vercel Analytics (optional)
- Use Supabase dashboard to monitor database usage

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs

