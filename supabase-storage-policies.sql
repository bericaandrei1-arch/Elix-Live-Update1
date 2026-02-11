-- Run in Supabase Dashboard → SQL Editor
-- Allows uploads to and reads from the 'user-content' bucket (videos + thumbnails).

-- Allow authenticated users to upload to user-content (their own folder: videos/{user_id}/ and thumbnails/{user_id}/)
DROP POLICY IF EXISTS "Allow authenticated uploads to user-content" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to user-content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-content');

-- Allow public read so video/thumbnail URLs work (or use 'authenticated' if you want private bucket)
DROP POLICY IF EXISTS "Allow public read user-content" ON storage.objects;
CREATE POLICY "Allow public read user-content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-content');

-- Allow users to update/delete their own files (optional, for future edit/delete)
DROP POLICY IF EXISTS "Allow authenticated update user-content" ON storage.objects;
CREATE POLICY "Allow authenticated update user-content"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-content');

DROP POLICY IF EXISTS "Allow authenticated delete user-content" ON storage.objects;
CREATE POLICY "Allow authenticated delete user-content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-content');
