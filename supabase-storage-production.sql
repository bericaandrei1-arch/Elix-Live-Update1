-- Fix Storage Policies for Production
-- This script ensures the 'user-content' bucket exists and has the correct permissions.
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Create the bucket if it doesn't exist (this is idempotent in Supabase SQL usually, 
-- but pure SQL doesn't support "CREATE BUCKET IF NOT EXISTS" directly in all versions. 
-- However, inserting into storage.buckets works.)

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-content', 'user-content', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts or stale rules
DROP POLICY IF EXISTS "Allow authenticated uploads to user-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read user-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own content" ON storage.objects; -- legacy name

-- 3. Create permissive policies for production usage

-- ALLOW INSERT: Authenticated users can upload to 'user-content'
CREATE POLICY "Allow authenticated uploads to user-content"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'user-content');

-- ALLOW SELECT: Everyone (public) can view files in 'user-content'
CREATE POLICY "Allow public read user-content"
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'user-content');

-- ALLOW UPDATE: Users can update their own files (owner matches auth.uid())
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-content' AND auth.uid() = owner);

-- ALLOW DELETE: Users can delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-content' AND auth.uid() = owner);

-- 4. Verify policies (Optional output)
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
