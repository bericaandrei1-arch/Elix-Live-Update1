-- ============================================================
-- 002_production_ready.sql
-- Adds: room_participants, gift_transactions.status/ack_at/client_request_id,
--        joinRoom/leaveRoom RPCs, Realtime publication triggers
-- Run AFTER 001_release_gate_rls.sql
-- ============================================================

-- ─── 1. ROOM PARTICIPANTS (viewer tracking + heartbeat) ─────

CREATE TABLE IF NOT EXISTS room_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'viewer' CHECK (role IN ('creator','viewer','moderator','guest')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can see who's in a public room
CREATE POLICY room_participants_select ON room_participants FOR SELECT
  USING (true);

-- Server-side insert only (via join_room RPC)
-- No direct client INSERT/UPDATE/DELETE for room_participants

CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_room_participants_heartbeat ON room_participants(last_heartbeat) WHERE is_active = true;

-- ─── 2. GIFT TRANSACTIONS: add status + ack_at + client_request_id ──

-- Add client_request_id column (maps to user's spec: "client_request_id (string unic)")
ALTER TABLE gift_transactions ADD COLUMN IF NOT EXISTS client_request_id text;
ALTER TABLE gift_transactions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed'
  CHECK (status IN ('pending','confirmed','failed'));
ALTER TABLE gift_transactions ADD COLUMN IF NOT EXISTS ack_at timestamptz;

-- Unique index on client_request_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_tx_client_request_id
  ON gift_transactions(client_request_id) WHERE client_request_id IS NOT NULL;

-- Index for room-scoped gift subscriptions  
CREATE INDEX IF NOT EXISTS idx_gift_tx_stream ON gift_transactions(stream_id, created_at DESC);

-- Chat pagination index (created_at DESC for limit/offset)
CREATE INDEX IF NOT EXISTS idx_chat_stream_time ON live_chat(stream_id, created_at DESC);

-- ─── 3. RPC: join_room ──────────────────────────────────────

CREATE OR REPLACE FUNCTION join_room(p_stream_key text)
RETURNS TABLE(room_id uuid, role text, viewer_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_stream  record;
  v_role    text;
  v_count   int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Check user is not banned
  IF EXISTS (SELECT 1 FROM user_bans WHERE user_id = v_user_id AND (expires_at IS NULL OR expires_at > now())) THEN
    RAISE EXCEPTION 'user_banned';
  END IF;

  -- Find the stream
  SELECT id, user_id INTO v_stream FROM live_streams
    WHERE stream_key = p_stream_key AND is_live = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'stream_not_found'; END IF;

  -- Check not blocked by creator
  IF EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = v_stream.user_id AND blocked_id = v_user_id) THEN
    RAISE EXCEPTION 'blocked_by_creator';
  END IF;

  -- Determine role
  v_role := CASE WHEN v_user_id = v_stream.user_id THEN 'creator' ELSE 'viewer' END;

  -- Upsert participant
  INSERT INTO room_participants (room_id, user_id, role, joined_at, last_heartbeat, is_active)
  VALUES (v_stream.id, v_user_id, v_role, now(), now(), true)
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET is_active = true, last_heartbeat = now(), role = EXCLUDED.role;

  -- Update viewer count on stream
  SELECT COUNT(*) INTO v_count FROM room_participants
    WHERE room_id = v_stream.id AND is_active = true;
  UPDATE live_streams SET viewer_count = v_count WHERE id = v_stream.id;

  RETURN QUERY SELECT v_stream.id, v_role, v_count;
END;
$$;

-- ─── 4. RPC: leave_room ─────────────────────────────────────

CREATE OR REPLACE FUNCTION leave_room(p_stream_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_stream_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_stream_id FROM live_streams WHERE stream_key = p_stream_key;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE room_participants SET is_active = false
    WHERE room_id = v_stream_id AND user_id = v_user_id;

  -- Update viewer count
  UPDATE live_streams SET viewer_count = (
    SELECT COUNT(*) FROM room_participants WHERE room_id = v_stream_id AND is_active = true
  ) WHERE id = v_stream_id;
END;
$$;

-- ─── 5. RPC: heartbeat (keep viewer alive) ──────────────────

CREATE OR REPLACE FUNCTION room_heartbeat(p_stream_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stream_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT id INTO v_stream_id FROM live_streams WHERE stream_key = p_stream_key;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE room_participants SET last_heartbeat = now()
    WHERE room_id = v_stream_id AND user_id = auth.uid() AND is_active = true;

  -- Expire stale participants (no heartbeat for > 2 minutes)
  UPDATE room_participants SET is_active = false
    WHERE room_id = v_stream_id AND is_active = true
    AND last_heartbeat < now() - interval '2 minutes';

  -- Refresh viewer count
  UPDATE live_streams SET viewer_count = (
    SELECT COUNT(*) FROM room_participants WHERE room_id = v_stream_id AND is_active = true
  ) WHERE id = v_stream_id;
END;
$$;

-- ─── 6. UPDATE send_stream_gift to use client_request_id + status + ack_at ──

CREATE OR REPLACE FUNCTION send_stream_gift(
  p_stream_key        text,
  p_gift_id           text,
  p_idempotency_key   text DEFAULT NULL,       -- legacy
  p_client_request_id text DEFAULT NULL         -- new: user spec
)
RETURNS TABLE(new_balance bigint, new_level int, new_xp int, diamonds_earned int, transaction_id uuid, client_request_id text)
LANGUAGE plpgsql
SECURITY DEFINER
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
  v_tx_id        uuid;
  v_request_id   text;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  -- Use whichever key is provided
  v_request_id := COALESCE(p_client_request_id, p_idempotency_key);

  -- Idempotency check
  IF v_request_id IS NOT NULL THEN
    SELECT gt.id INTO v_tx_id FROM gift_transactions gt
      WHERE gt.idempotency_key = v_request_id
         OR gt.client_request_id = v_request_id;
    IF FOUND THEN
      -- Already processed — return current state (idempotent)
      SELECT p.coin_balance, p.level, p.xp INTO v_new_balance, v_new_level, v_new_xp
        FROM profiles p WHERE p.user_id = v_sender_id;
      RETURN QUERY SELECT v_new_balance, v_new_level, v_new_xp, 0, v_tx_id, v_request_id;
      RETURN;
    END IF;
  END IF;

  -- Look up gift cost
  SELECT coins INTO v_gift_coins FROM gifts_catalog WHERE id = p_gift_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_gift'; END IF;

  -- Look up stream + receiver
  SELECT id, user_id INTO v_stream FROM live_streams
    WHERE stream_key = p_stream_key AND is_live = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'stream_not_found'; END IF;

  -- Cannot gift yourself
  IF v_sender_id = v_stream.user_id THEN RAISE EXCEPTION 'cannot_gift_self'; END IF;

  -- Debit sender (row-level lock prevents race)
  SELECT coin_balance INTO v_balance FROM profiles WHERE user_id = v_sender_id FOR UPDATE;
  IF v_balance < v_gift_coins THEN RAISE EXCEPTION 'insufficient_funds'; END IF;

  v_new_balance := v_balance - v_gift_coins;
  UPDATE profiles SET coin_balance = v_new_balance, updated_at = now() WHERE user_id = v_sender_id;

  -- Credit receiver (diamonds = coins / 2)
  v_diamonds := v_gift_coins / 2;
  UPDATE profiles SET diamond_balance = diamond_balance + v_diamonds, updated_at = now()
    WHERE user_id = v_stream.user_id;

  -- XP + Level for sender
  v_new_xp := COALESCE((SELECT xp FROM profiles WHERE user_id = v_sender_id), 0) + v_gift_coins;
  v_new_level := GREATEST(1, FLOOR(v_new_xp / 100.0)::int);
  UPDATE profiles SET xp = v_new_xp, level = v_new_level, updated_at = now()
    WHERE user_id = v_sender_id;

  -- Write gift transaction with status + ack_at + client_request_id
  INSERT INTO gift_transactions (
    sender_id, receiver_id, stream_id, gift_id, coins, diamonds_earned,
    idempotency_key, client_request_id, status, ack_at
  )
  VALUES (
    v_sender_id, v_stream.user_id, v_stream.id, p_gift_id, v_gift_coins, v_diamonds,
    v_request_id, v_request_id, 'confirmed', now()
  )
  RETURNING id INTO v_tx_id;

  -- Write wallet ledger entries
  INSERT INTO wallet_ledger (user_id, amount, balance_after, tx_type, reference_id, description)
  VALUES (v_sender_id, -v_gift_coins, v_new_balance, 'gift_sent', v_tx_id,
    'Sent ' || p_gift_id || ' in stream ' || p_stream_key);

  INSERT INTO wallet_ledger (user_id, amount, balance_after, tx_type, reference_id, description)
  VALUES (v_stream.user_id, v_diamonds,
    (SELECT diamond_balance FROM profiles WHERE user_id = v_stream.user_id),
    'gift_received', v_tx_id,
    'Received ' || p_gift_id || ' from stream ' || p_stream_key);

  RETURN QUERY SELECT v_new_balance, v_new_level, v_new_xp, v_diamonds, v_tx_id, v_request_id;
END;
$$;

-- ─── 7. UPDATE create_live_room to auto-join creator as participant ──

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

  -- Auto-join creator as participant
  INSERT INTO room_participants (room_id, user_id, role, joined_at, last_heartbeat, is_active)
  VALUES (v_room_id, v_user_id, 'creator', now(), now(), true);

  -- Set initial viewer count to 1 (creator)
  UPDATE live_streams SET viewer_count = 1 WHERE id = v_room_id;

  RETURN QUERY SELECT v_room_id, v_key, v_key;
END;
$$;

-- ─── 8. UPDATE end_live_room to deactivate all participants ──

CREATE OR REPLACE FUNCTION end_live_room(p_stream_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stream_id uuid;
BEGIN
  SELECT id INTO v_stream_id FROM live_streams
    WHERE stream_key = p_stream_key AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE live_streams SET is_live = false, ended_at = now(), viewer_count = 0
    WHERE id = v_stream_id;

  -- Mark all participants as inactive
  UPDATE room_participants SET is_active = false
    WHERE room_id = v_stream_id;
END;
$$;

-- ─── 9. Realtime publication trigger for gift_transactions ──
-- When a gift is INSERT'd, Supabase Realtime auto-publishes if
-- the table is enabled for publication. Enable it:

ALTER PUBLICATION supabase_realtime ADD TABLE gift_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE battles;

-- ─── DONE ───────────────────────────────────────────────────
-- New tables: room_participants
-- New columns: gift_transactions.client_request_id, status, ack_at
-- New RPCs: join_room, leave_room, room_heartbeat
-- Updated RPCs: send_stream_gift (client_request_id + status + ack_at + transaction_id return)
--               create_live_room (auto-join creator)
--               end_live_room (deactivate all participants)
-- Realtime publication: gift_transactions, room_participants, live_chat, battles
