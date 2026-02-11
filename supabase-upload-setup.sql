-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard → SQL Editor
-- Then in Storage create a bucket named: user-content (public)
-- ============================================================

-- 1) VIDEOS TABLE (if you don't have one yet)
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  thumbnail_url text,
  caption text,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  views bigint DEFAULT 0,
  likes integer DEFAULT 0
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public videos" ON public.videos;
CREATE POLICY "Anyone can view public videos" ON public.videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.videos;
CREATE POLICY "Authenticated users can insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 2) STORAGE: allow uploads to bucket 'user-content'
-- (Create the bucket in Dashboard → Storage → New bucket → name: user-content)
DROP POLICY IF EXISTS "Allow authenticated uploads to user-content" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to user-content"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-content');

DROP POLICY IF EXISTS "Allow public read user-content" ON storage.objects;
CREATE POLICY "Allow public read user-content"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'user-content');
