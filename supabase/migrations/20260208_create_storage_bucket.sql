-- Create storage bucket 'user-content'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-content', 'user-content', true, 524288000,  -- 500MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
  USING (bucket_id = 'user-content');

CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-content' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own objects" ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-content' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'user-content' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own objects" ON storage.objects FOR DELETE
  USING (bucket_id = 'user-content' AND auth.uid() = owner);
