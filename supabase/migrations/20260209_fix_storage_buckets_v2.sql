
-- Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('user-content', 'user-content', true)
on conflict (id) do nothing;

-- Drop ALL related policies to ensure a clean slate
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own objects" on storage.objects;
drop policy if exists "Users can delete their own objects" on storage.objects;

drop policy if exists "Public Access user-content" on storage.objects;
drop policy if exists "Authenticated users can upload user-content" on storage.objects;
drop policy if exists "Users can update their own objects user-content" on storage.objects;
drop policy if exists "Users can delete their own objects user-content" on storage.objects;

-- Create specific policies for user-content
create policy "Public Access user-content"
  on storage.objects for select
  using ( bucket_id = 'user-content' );

create policy "Authenticated users can upload user-content"
  on storage.objects for insert
  with check ( bucket_id = 'user-content' and auth.role() = 'authenticated' );

create policy "Users can update their own objects user-content"
  on storage.objects for update
  using ( bucket_id = 'user-content' and auth.uid() = owner )
  with check ( bucket_id = 'user-content' and auth.uid() = owner );

create policy "Users can delete their own objects user-content"
  on storage.objects for delete
  using ( bucket_id = 'user-content' and auth.uid() = owner );
