-- FYP + likes: run once in Supabase Dashboard → SQL Editor
-- 1) likes table for persisting who liked which video
-- 2) engagement_score / is_eligible_for_fyp so For You shows videos after threshold
--    Score = likes×10 + comments×8 + shares×15 + views×1
--    Threshold = 50

-- Likes table (skip if you already have it)
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS likes_video_id_idx ON public.likes(video_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own likes" ON public.likes;
CREATE POLICY "Users can read own likes" ON public.likes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- FYP columns on videos
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS engagement_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_eligible_for_fyp boolean NOT NULL DEFAULT false;

-- Ensure views column exists (needed for engagement scoring)
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Backfill existing rows with weighted score
-- Score = likes×10 + views×1  (comments & shares are tracked per-action in the app)
UPDATE public.videos
SET
  engagement_score = COALESCE(likes, 0) * 10 + COALESCE(views, 0),
  is_eligible_for_fyp = ((COALESCE(likes, 0) * 10 + COALESCE(views, 0)) >= 50);
