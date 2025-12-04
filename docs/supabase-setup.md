# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Project name: `su-wh` (or your preferred name)
   - Database password: (save this securely!)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Create Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Never commit `.env.local` to git (it should be in `.gitignore`)
- The `NEXT_PUBLIC_` prefix makes these available to client-side code

## Step 4: Create the Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `docs/supabase-migration.sql`
4. Click **Run** to execute

Alternatively, you can use the Table Editor:
1. Go to **Table Editor** → **New Table**
2. Name it `qc_records`
3. Add columns manually (see migration file for reference)

## Step 5: Set Up Row Level Security (RLS)

For security, you should set up RLS policies. In SQL Editor, run:

```sql
-- Enable RLS
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own records
CREATE POLICY "Users can view own records" ON qc_records
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own records
CREATE POLICY "Users can insert own records" ON qc_records
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own records
CREATE POLICY "Users can update own records" ON qc_records
  FOR UPDATE USING (auth.uid()::text = user_id);

-- If you want admins to see all records:
CREATE POLICY "Admins can view all records" ON qc_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@example.com'
    )
  );
```

**Note:** If you're not using Supabase Auth, you can disable RLS or create custom policies based on your authentication system.

## Step 6: Test the API

1. Restart your Next.js dev server: `npm run dev`
2. Test in Postman:
   - POST to `http://localhost:3000/api/qc/save`
   - GET to `http://localhost:3000/api/qc/records?user_id=test_user`

## Troubleshooting

### Error: "relation 'qc_records' does not exist"
- Make sure you ran the migration SQL in Supabase SQL Editor
- Check that the table name matches exactly

### Error: "new row violates row-level security policy"
- Check your RLS policies
- If testing without auth, you may need to temporarily disable RLS:
  ```sql
  ALTER TABLE qc_records DISABLE ROW LEVEL SECURITY;
  ```

### Error: "Invalid API key"
- Double-check your `.env.local` file
- Make sure you copied the **anon/public** key, not the service role key
- Restart your dev server after changing `.env.local`

