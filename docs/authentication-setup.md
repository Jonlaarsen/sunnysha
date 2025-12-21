# Authentication Setup Guide

This guide explains how to set up the authentication system with Supabase Auth and email notifications.

## Prerequisites

1. Supabase project created
2. Resend account (for sending emails) - [Sign up at resend.com](https://resend.com)

## Step 1: Configure Supabase Auth

1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. **Disable** "Enable email signup" (we only want admin-created users)
3. **Disable** "Enable email confirmations" (admin creates users with confirmed emails)
4. Configure your email provider in **Email Templates** if needed

## Step 2: Set Up Resend (Email Service)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain (or use the test domain for development)

## Step 3: Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="QC System <noreply@yourdomain.com>"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Emails (comma-separated)
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

**Important:**
- `SUPABASE_SERVICE_ROLE_KEY`: Get this from Supabase Dashboard → Settings → API → service_role key (click "Reveal")
- `ADMIN_EMAILS`: List of email addresses that can create users and view all records
- `EMAIL_FROM`: Must be a verified domain in Resend (or use test domain for development)

## Step 4: Create Your First Admin User

Since there's no self-registration, you need to create the first admin user manually:

### Option A: Using Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Check **"Auto Confirm User"**
5. Click **"Create user"**

### Option B: Using SQL (if you have database access)

```sql
-- This will create a user but you'll need to set the password via Supabase Auth API
-- Better to use the dashboard or API
```

### Option C: Using the API (after first admin is created)

Once you have one admin user, you can use the `/api/admin/create-user` endpoint to create more users.

## Step 5: Test the System

1. **Login:**
   - Go to your app
   - Use the admin email and password you created
   - You should be logged in

2. **Create a User (as admin):**
   ```bash
   curl -X POST http://localhost:3000/api/admin/create-user \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{
       "email": "newuser@example.com",
       "password": "SecurePassword123",
       "name": "New User"
     }'
   ```
   
   The new user should receive an email with their login credentials.

3. **Test QC Record Creation:**
   - Log in as a regular user
   - Fill out the QC form
   - Click save
   - The record should be saved with the user's ID

## Step 6: User Management

### Creating Users (Admin Only)

Only users listed in `ADMIN_EMAILS` can create new users via the API:

**Endpoint:** `POST /api/admin/create-user`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully. Login credentials sent to email.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Email Template

The email sent to new users includes:
- Welcome message
- Email address
- Password (plain text - one-time use)
- Login link
- Security notice

## Security Features

1. **Authentication Required:** All QC API endpoints require authentication
2. **User Isolation:** Regular users can only see/edit their own records
3. **Admin Access:** Admins can view all records
4. **No Self-Registration:** Only admins can create users
5. **Secure Sessions:** Supabase handles session management with secure cookies

## Troubleshooting

### "Unauthorized" errors
- Make sure you're logged in
- Check that your session cookie is being sent
- Verify Supabase environment variables are correct

### Email not sending
- Check Resend API key is correct
- Verify `EMAIL_FROM` domain is verified in Resend
- Check Resend dashboard for error logs
- For development, you can use Resend's test domain

### "Forbidden: Admin access required"
- Make sure your email is in the `ADMIN_EMAILS` environment variable
- Check for typos in the email address
- Restart your dev server after changing environment variables

### Users can't log in
- Verify user was created with `email_confirm: true`
- Check Supabase Auth settings
- Make sure password meets requirements (min 6 characters)

## Next Steps

- Consider adding password reset functionality
- Add user profile management
- Implement role-based permissions (beyond admin/user)
- Add audit logging for user actions



