-- Fix RLS Policies for qc_records table
-- Run this in Supabase SQL Editor to fix permission issues

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own records" ON qc_records;
DROP POLICY IF EXISTS "Users can insert own records" ON qc_records;
DROP POLICY IF EXISTS "Users can update own records" ON qc_records;
DROP POLICY IF EXISTS "Users can delete own records" ON qc_records;
DROP POLICY IF EXISTS "Authenticated users can insert own records" ON qc_records;
DROP POLICY IF EXISTS "Admins can view all records" ON qc_records;
DROP POLICY IF EXISTS "Admins can insert all records" ON qc_records;
DROP POLICY IF EXISTS "Admins can update all records" ON qc_records;
DROP POLICY IF EXISTS "Admins can delete all records" ON qc_records;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Helper function to check if user is admin
-- Replace the email addresses with your actual admin emails
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users 
    WHERE id = auth.uid()
  ) = ANY(ARRAY[
    'admin@example.com',  -- Replace with your admin email(s)
    'another-admin@example.com'  -- Add more admin emails here
  ]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Admins can view all records, users can view their own
CREATE POLICY "Admins can view all records" ON qc_records
  FOR SELECT 
  TO authenticated
  USING (
    is_admin() OR auth.uid()::text = user_id
  );

-- Policy: Admins can insert records for any user, users can insert their own
CREATE POLICY "Admins can insert all records" ON qc_records
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    is_admin() OR auth.uid()::text = user_id
  );

-- Policy: Admins can update all records, users can update their own
CREATE POLICY "Admins can update all records" ON qc_records
  FOR UPDATE 
  TO authenticated
  USING (
    is_admin() OR auth.uid()::text = user_id
  )
  WITH CHECK (
    is_admin() OR auth.uid()::text = user_id
  );

-- Policy: Admins can delete all records, users can delete their own
CREATE POLICY "Admins can delete all records" ON qc_records
  FOR DELETE 
  TO authenticated
  USING (
    is_admin() OR auth.uid()::text = user_id
  );

