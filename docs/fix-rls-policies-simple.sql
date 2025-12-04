-- Simple RLS Policies Fix for qc_records table
-- Run this in Supabase SQL Editor

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own records" ON qc_records;
DROP POLICY IF EXISTS "Users can insert own records" ON qc_records;
DROP POLICY IF EXISTS "Users can update own records" ON qc_records;
DROP POLICY IF EXISTS "Users can delete own records" ON qc_records;
DROP POLICY IF EXISTS "Admins can view all records" ON qc_records;
DROP POLICY IF EXISTS "Authenticated users can insert own records" ON qc_records;

-- Policy 1: Authenticated users can insert records where user_id matches their auth.uid()
CREATE POLICY "authenticated_insert_own" ON qc_records
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 2: Users can view their own records
CREATE POLICY "authenticated_select_own" ON qc_records
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Policy 3: Users can update their own records
CREATE POLICY "authenticated_update_own" ON qc_records
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 4: Users can delete their own records (optional)
CREATE POLICY "authenticated_delete_own" ON qc_records
  FOR DELETE 
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Verify policies are created
SELECT * FROM pg_policies WHERE tablename = 'qc_records';

