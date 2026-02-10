
-- 1. Ensure the bucket exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-content', 
  'user-content', 
  true, 
  524288000, 
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm'];

-- 2. Drop absolutely all policies related to this bucket to start fresh
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own objects" on storage.objects;
drop policy if exists "Users can delete their own objects" on storage.objects;

drop policy if exists "Public Access user-content" on storage.objects;
drop policy if exists "Authenticated users can upload user-content" on storage.objects;
drop policy if exists "Users can update their own objects user-content" on storage.objects;
drop policy if exists "Users can delete their own objects user-content" on storage.objects;

drop policy if exists "Give users access to own folder 1" on storage.objects;
drop policy if exists "Give users access to own folder 2" on storage.objects;
drop policy if exists "Give users access to own folder 3" on storage.objects;
drop policy if exists "Give users access to own folder 4" on storage.objects;

-- 3. Create extremely permissive policies for MVP to ensure it works
-- We can tighten this later, but for now we just want the upload to SUCCEED.

-- Allow public read access to everything in the bucket
create policy "Public Read Access"
on storage.objects for select
using ( bucket_id = 'user-content' );

-- Allow authenticated users to upload to any path (simplifies logic)
create policy "Authenticated Upload Access"
on storage.objects for insert
with check ( 
  bucket_id = 'user-content' 
  and auth.role() = 'authenticated' 
);

-- Allow users to update their own files (based on owner field)
create policy "Owner Update Access"
on storage.objects for update
using ( 
  bucket_id = 'user-content' 
  and auth.uid() = owner 
);

-- Allow users to delete their own files
create policy "Owner Delete Access"
on storage.objects for delete
using ( 
  bucket_id = 'user-content' 
  and auth.uid() = owner 
);
