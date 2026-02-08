-- ============================================================
-- RELEASE GATE: Complete RLS + Policies for App Store Readiness
-- Stack: Supabase (Postgres) + Agora RTC
-- Run: supabase db push  OR paste into SQL Editor
-- ============================================================

-- ─── 1. ENSURE ALL TABLES EXIST ─────────────────────────────
-- (only creates if missing — safe to re-run)

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text NOT NULL,
  display_name  text,
  avatar_url    text,
  bio           text,
  level         int NOT NULL DEFAULT 1,
  xp            int NOT NULL DEFAULT 0,
  coin_balance  bigint NOT NULL DEFAULT 0,
  diamond_balance bigint NOT NULL DEFAULT 0,
  followers     int NOT NULL DEFAULT 0,
  following     int NOT NULL DEFAULT 0,
  is_verified   boolean NOT NULL DEFAULT false,
  is_banned     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_streams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_key    text UNIQUE,
  title         text NOT NULL DEFAULT 'Live',
  description   text,
  is_live       boolean NOT NULL DEFAULT false,
  viewer_count  int NOT NULL DEFAULT 0,
  started_at    timestamptz,
  ended_at      timestamptz,
  category      text DEFAULT 'General',
  tags          text[] DEFAULT '{}',
  is_private    boolean NOT NULL DEFAULT false,
  agora_channel text,                          -- Agora channel name = stream_key
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id     uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  challenger_id uuid NOT NULL REFERENCES auth.users(id),
  opponent_id   uuid REFERENCES auth.users(id),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled')),
  challenger_score int NOT NULL DEFAULT 0,
  opponent_score   int NOT NULL DEFAULT 0,
  winner_id     uuid REFERENCES auth.users(id),
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gifts_catalog (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  icon          text,
  coins         int NOT NULL DEFAULT 1,
  category      text DEFAULT 'standard',
  animation_url text,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gift_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid NOT NULL REFERENCES auth.users(id),
  receiver_id   uuid NOT NULL REFERENCES auth.users(id),
  stream_id     uuid REFERENCES live_streams(id),
  gift_id       text NOT NULL REFERENCES gifts_catalog(id),
  coins         int NOT NULL,
  diamonds_earned int NOT NULL DEFAULT 0,
  idempotency_key text UNIQUE,                 -- Prevent duplicate gifts
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  amount        bigint NOT NULL,               -- positive = credit, negative = debit
  balance_after bigint NOT NULL,
  tx_type       text NOT NULL CHECK (tx_type IN ('gift_sent','gift_received','purchase','withdrawal','refund','admin')),
  reference_id  uuid,                          -- links to gift_transactions.id or purchase
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_chat (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id     uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  message       text NOT NULL,
  is_gift       boolean NOT NULL DEFAULT false,
  gift_id       text REFERENCES gifts_catalog(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   uuid NOT NULL REFERENCES auth.users(id),
  reported_id   uuid NOT NULL REFERENCES auth.users(id),
  stream_id     uuid REFERENCES live_streams(id),
  reason        text NOT NULL,
  details       text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by   uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id    uuid NOT NULL REFERENCES auth.users(id),
  blocked_id    uuid NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_bans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id),
  reason        text,
  banned_by     uuid REFERENCES auth.users(id),
  expires_at    timestamptz,                   -- null = permanent
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coin_packages (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  coins           int NOT NULL,
  price_usd       numeric(10,2) NOT NULL,
  bonus_coins     int NOT NULL DEFAULT 0,
  is_popular      boolean NOT NULL DEFAULT false,
  apple_product_id  text,
  google_product_id text,
  sort_order      int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url           text NOT NULL,
  thumbnail     text,
  caption       text,
  likes         int NOT NULL DEFAULT 0,
  comments_count int NOT NULL DEFAULT 0,
  shares        int NOT NULL DEFAULT 0,
  views         int NOT NULL DEFAULT 0,
  is_public     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  data          jsonb,
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. ENABLE RLS ON ALL TABLES ────────────────────────────

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts_catalog      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ─── 3. DROP OLD POLICIES (safe re-run) ─────────────────────

DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── 4. PROFILES POLICIES ──────────────────────────────────

-- Anyone can read profiles (public data)
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
-- CRITICAL: Cannot update coin_balance, diamond_balance, level, xp, is_verified, is_banned
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND coin_balance  = (SELECT coin_balance  FROM profiles WHERE user_id = auth.uid())
    AND diamond_balance = (SELECT diamond_balance FROM profiles WHERE user_id = auth.uid())
    AND level         = (SELECT level         FROM profiles WHERE user_id = auth.uid())
    AND xp            = (SELECT xp            FROM profiles WHERE user_id = auth.uid())
    AND is_verified   = (SELECT is_verified   FROM profiles WHERE user_id = auth.uid())
    AND is_banned     = (SELECT is_banned     FROM profiles WHERE user_id = auth.uid())
  );

-- Users can insert their own profile (on signup)
CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 5. LIVE STREAMS POLICIES ───────────────────────────────

-- Public streams visible to everyone; private only to owner
CREATE POLICY streams_select ON live_streams FOR SELECT
  USING (NOT is_private OR auth.uid() = user_id);

-- Only the creator can insert their own stream
CREATE POLICY streams_insert ON live_streams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the creator can update their own stream
CREATE POLICY streams_update ON live_streams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only the creator can delete their own stream
CREATE POLICY streams_delete ON live_streams FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 6. BATTLES POLICIES ───────────────────────────────────

-- Battles visible to participants
CREATE POLICY battles_select ON battles FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Only the challenger (stream owner) can create a battle
CREATE POLICY battles_insert ON battles FOR INSERT
  WITH CHECK (
    auth.uid() = challenger_id
    AND EXISTS (
      SELECT 1 FROM live_streams 
      WHERE id = stream_id AND user_id = auth.uid() AND is_live = true
    )
  );

-- Participants can update (accept, score)
CREATE POLICY battles_update ON battles FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- ─── 7. GIFTS CATALOG (read-only for users) ────────────────

CREATE POLICY gifts_catalog_select ON gifts_catalog FOR SELECT
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE for regular users — admin only via service_role

-- ─── 8. GIFT TRANSACTIONS (server-side write only) ─────────

-- Users can see their own sent/received gifts
CREATE POLICY gift_tx_select ON gift_transactions FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- NO client-side INSERT — only service_role (edge functions) can write
-- This prevents client from forging gift transactions

-- ─── 9. WALLET LEDGER (server-side write only) ─────────────

-- Users can see their own ledger entries
CREATE POLICY wallet_select ON wallet_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- NO client-side INSERT — only service_role can write

-- ─── 10. LIVE CHAT POLICIES ────────────────────────────────

-- Anyone in the room can see chat
CREATE POLICY chat_select ON live_chat FOR SELECT
  USING (true);

-- Authenticated users can send chat (rate limited at application level)
CREATE POLICY chat_insert ON live_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 11. REPORTS POLICIES ──────────────────────────────────

-- Users can see their own reports
CREATE POLICY reports_select ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND reporter_id != reported_id);

-- ─── 12. USER BLOCKS POLICIES ──────────────────────────────

-- Users can see their own blocks
CREATE POLICY blocks_select ON user_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block others (not themselves)
CREATE POLICY blocks_insert ON user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

-- Users can unblock
CREATE POLICY blocks_delete ON user_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- ─── 13. USER BANS (admin only via service_role) ────────────

-- Users can check if they are banned
CREATE POLICY bans_select ON user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE — admin only

-- ─── 14. COIN PACKAGES (read-only) ─────────────────────────

CREATE POLICY packages_select ON coin_packages FOR SELECT
  USING (true);

-- No client INSERT/UPDATE/DELETE — admin only

-- ─── 15. VIDEOS POLICIES ───────────────────────────────────

-- Public videos visible to everyone
CREATE POLICY videos_select ON videos FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can upload their own videos
CREATE POLICY videos_insert ON videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own videos (caption, visibility)
CREATE POLICY videos_update ON videos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY videos_delete ON videos FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 16. NOTIFICATIONS ─────────────────────────────────────

-- Users see their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark as read
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Server-side INSERT only (service_role)

-- ─── 17. STORAGE BUCKET POLICIES ───────────────────────────

-- Ensure the 'media' bucket exists with limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 524288000,  -- 500MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm'];

-- ─── 18. RPC: send_stream_gift (atomic, server-validated) ───

CREATE OR REPLACE FUNCTION send_stream_gift(
  p_stream_key text,
  p_gift_id    text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE(new_balance bigint, new_level int, diamonds_earned int)
LANGUAGE plpgsql
SECURITY DEFINER       -- Runs as DB owner, not caller — bypasses RLS for writes
SET search_path = public
AS $$
DECLARE
  v_sender_id    uuid;
  v_gift_coins   int;
  v_stream       record;
  v_balance      bigint;
  v_new_balance  bigint;
  v_diamonds     int;
  v_new_xp       int;
  v_new_level    int;
BEGIN
  -- 1. Get sender from auth context
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- 2. Check idempotency (prevent double-send)
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM gift_transactions WHERE idempotency_key = p_idempotency_key) THEN
      -- Return current balance — already processed
      SELECT coin_balance, level INTO v_new_balance, v_new_level
        FROM profiles WHERE user_id = v_sender_id;
      RETURN QUERY SELECT v_new_balance, v_new_level, 0;
      RETURN;
    END IF;
  END IF;

  -- 3. Look up gift cost
  SELECT coins INTO v_gift_coins FROM gifts_catalog WHERE id = p_gift_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_gift';
  END IF;

  -- 4. Look up stream + receiver
  SELECT id, user_id INTO v_stream 
    FROM live_streams 
    WHERE stream_key = p_stream_key AND is_live = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'stream_not_found';
  END IF;

  -- 5. Cannot gift yourself
  IF v_sender_id = v_stream.user_id THEN
    RAISE EXCEPTION 'cannot_gift_self';
  END IF;

  -- 6. Debit sender (row-level lock)
  SELECT coin_balance INTO v_balance FROM profiles WHERE user_id = v_sender_id FOR UPDATE;
  IF v_balance < v_gift_coins THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  v_new_balance := v_balance - v_gift_coins;
  UPDATE profiles SET coin_balance = v_new_balance, updated_at = now() WHERE user_id = v_sender_id;

  -- 7. Credit receiver (diamonds = coins / 2)
  v_diamonds := v_gift_coins / 2;
  UPDATE profiles 
    SET diamond_balance = diamond_balance + v_diamonds, updated_at = now()
    WHERE user_id = v_stream.user_id;

  -- 8. XP + Level for sender
  v_new_xp := COALESCE((SELECT xp FROM profiles WHERE user_id = v_sender_id), 0) + v_gift_coins;
  v_new_level := GREATEST(1, FLOOR(v_new_xp / 100.0)::int);
  UPDATE profiles SET xp = v_new_xp, level = v_new_level, updated_at = now() WHERE user_id = v_sender_id;

  -- 9. Write gift transaction
  INSERT INTO gift_transactions (sender_id, receiver_id, stream_id, gift_id, coins, diamonds_earned, idempotency_key)
  VALUES (v_sender_id, v_stream.user_id, v_stream.id, p_gift_id, v_gift_coins, v_diamonds, p_idempotency_key);

  -- 10. Write wallet ledger entries
  INSERT INTO wallet_ledger (user_id, amount, balance_after, tx_type, description)
  VALUES (v_sender_id, -v_gift_coins, v_new_balance, 'gift_sent', 'Sent ' || p_gift_id || ' in stream ' || p_stream_key);

  INSERT INTO wallet_ledger (user_id, amount, balance_after, tx_type, description)
  VALUES (v_stream.user_id, v_diamonds, 
    (SELECT diamond_balance FROM profiles WHERE user_id = v_stream.user_id),
    'gift_received', 'Received ' || p_gift_id || ' from stream ' || p_stream_key);

  RETURN QUERY SELECT v_new_balance, v_new_level, v_diamonds;
END;
$$;

-- ─── 19. RPC: create_live_room (server-validated) ───────────

CREATE OR REPLACE FUNCTION create_live_room(
  p_title       text DEFAULT 'Live',
  p_description text DEFAULT NULL,
  p_category    text DEFAULT 'General',
  p_is_private  boolean DEFAULT false,
  p_tags        text[] DEFAULT '{}'
)
RETURNS TABLE(room_id uuid, stream_key text, agora_channel text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_key       text;
  v_room_id   uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Check user is not banned
  IF EXISTS (SELECT 1 FROM user_bans WHERE user_id = v_user_id AND (expires_at IS NULL OR expires_at > now())) THEN
    RAISE EXCEPTION 'user_banned';
  END IF;

  -- End any existing live streams for this user
  UPDATE live_streams SET is_live = false, ended_at = now() 
    WHERE user_id = v_user_id AND is_live = true;

  -- Generate unique stream key
  v_key := encode(gen_random_bytes(12), 'hex');

  -- Create the room
  INSERT INTO live_streams (user_id, stream_key, title, description, category, is_private, tags, is_live, started_at, agora_channel)
  VALUES (v_user_id, v_key, p_title, p_description, p_category, p_is_private, p_tags, true, now(), v_key)
  RETURNING id INTO v_room_id;

  RETURN QUERY SELECT v_room_id, v_key, v_key;
END;
$$;

-- ─── 20. RPC: end_live_room ─────────────────────────────────

CREATE OR REPLACE FUNCTION end_live_room(p_stream_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE live_streams 
    SET is_live = false, ended_at = now()
    WHERE stream_key = p_stream_key AND user_id = auth.uid();
END;
$$;

-- ─── 21. RPC: start_battle ──────────────────────────────────

CREATE OR REPLACE FUNCTION start_battle(
  p_stream_id   uuid,
  p_opponent_id  uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle_id uuid;
  v_user_id   uuid := auth.uid();
BEGIN
  -- Verify caller owns the stream and it's live
  IF NOT EXISTS (
    SELECT 1 FROM live_streams WHERE id = p_stream_id AND user_id = v_user_id AND is_live = true
  ) THEN
    RAISE EXCEPTION 'not_stream_owner_or_not_live';
  END IF;

  -- Create battle
  INSERT INTO battles (stream_id, challenger_id, opponent_id, status, started_at)
  VALUES (p_stream_id, v_user_id, p_opponent_id, 'active', now())
  RETURNING id INTO v_battle_id;

  RETURN v_battle_id;
END;
$$;

-- ─── 22. RPC: end_battle ────────────────────────────────────

CREATE OR REPLACE FUNCTION end_battle(p_battle_id uuid)
RETURNS TABLE(winner_id uuid, challenger_score int, opponent_score int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle record;
BEGIN
  SELECT * INTO v_battle FROM battles WHERE id = p_battle_id AND status = 'active'
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'battle_not_found'; END IF;

  -- Must be a participant
  IF auth.uid() != v_battle.challenger_id AND auth.uid() != v_battle.opponent_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  -- Determine winner
  UPDATE battles SET 
    status = 'completed',
    ended_at = now(),
    winner_id = CASE 
      WHEN v_battle.challenger_score > v_battle.opponent_score THEN v_battle.challenger_id
      WHEN v_battle.opponent_score > v_battle.challenger_score THEN v_battle.opponent_id
      ELSE NULL  -- draw
    END
  WHERE id = p_battle_id;

  RETURN QUERY SELECT 
    CASE 
      WHEN v_battle.challenger_score > v_battle.opponent_score THEN v_battle.challenger_id
      WHEN v_battle.opponent_score > v_battle.challenger_score THEN v_battle.opponent_id
      ELSE NULL::uuid
    END,
    v_battle.challenger_score,
    v_battle.opponent_score;
END;
$$;

-- ─── 23. INDEXES ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON live_streams(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_streams_key ON live_streams(stream_key);
CREATE INDEX IF NOT EXISTS idx_battles_stream ON battles(stream_id);
CREATE INDEX IF NOT EXISTS idx_gift_tx_sender ON gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_tx_receiver ON gift_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_gift_tx_idempotency ON gift_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_stream ON live_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ─── DONE ───────────────────────────────────────────────────
-- RLS is ON for all tables.
-- Client CANNOT modify coin_balance, level, xp, is_verified, is_banned.
-- Gift transactions + wallet writes are ONLY via send_stream_gift RPC (SECURITY DEFINER).
-- Battle creation validated against stream ownership.
-- Live room creation checks for bans + ends existing streams.
