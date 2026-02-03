CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  context_video_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_insert_self ON public.reports;
CREATE POLICY reports_insert_self
ON public.reports
FOR INSERT
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS reports_write_service_role ON public.reports;
CREATE POLICY reports_write_service_role
ON public.reports
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks (blocker_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_blocks_select_self ON public.user_blocks;
CREATE POLICY user_blocks_select_self
ON public.user_blocks
FOR SELECT
USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS user_blocks_insert_self ON public.user_blocks;
CREATE POLICY user_blocks_insert_self
ON public.user_blocks
FOR INSERT
WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS user_blocks_delete_self ON public.user_blocks;
CREATE POLICY user_blocks_delete_self
ON public.user_blocks
FOR DELETE
USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS user_blocks_write_service_role ON public.user_blocks;
CREATE POLICY user_blocks_write_service_role
ON public.user_blocks
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

