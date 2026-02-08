ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_level_min CHECK (level >= 1);

CREATE OR REPLACE FUNCTION public.send_stream_gift(p_stream_key TEXT, p_gift_id TEXT)
RETURNS TABLE (new_balance BIGINT, new_level INTEGER, new_xp BIGINT, stream_gift_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender UUID;
  v_stream_id UUID;
  v_receiver UUID;
  v_cost BIGINT;
  v_new_balance BIGINT;
  v_gift_row_id UUID;
  v_level INTEGER;
  v_xp BIGINT;
  v_xp_needed BIGINT;
BEGIN
  v_sender := auth.uid();
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT ls.id, ls.user_id
  INTO v_stream_id, v_receiver
  FROM public.live_streams ls
  WHERE ls.stream_key = p_stream_key
  LIMIT 1;

  IF v_stream_id IS NULL THEN
    RAISE EXCEPTION 'stream_not_found';
  END IF;

  SELECT gc.coin_cost
  INTO v_cost
  FROM public.gifts_catalog gc
  WHERE gc.gift_id = p_gift_id
    AND gc.is_active = true
  LIMIT 1;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'gift_not_found';
  END IF;

  INSERT INTO public.profiles (user_id, coin_balance, xp, level)
  VALUES (v_sender, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
  SET coin_balance = coin_balance - v_cost,
      xp = xp + v_cost,
      updated_at = NOW()
  WHERE user_id = v_sender
    AND coin_balance >= v_cost
  RETURNING coin_balance, level, xp INTO v_new_balance, v_level, v_xp;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  LOOP
    v_xp_needed := (v_level::bigint) * 1000;
    EXIT WHEN v_xp < v_xp_needed;
    v_xp := v_xp - v_xp_needed;
    v_level := v_level + 1;
  END LOOP;

  UPDATE public.profiles
  SET level = v_level,
      xp = v_xp,
      updated_at = NOW()
  WHERE user_id = v_sender;

  INSERT INTO public.stream_gifts (stream_id, sender_id, receiver_id, gift_id, coin_cost)
  VALUES (v_stream_id, v_sender, v_receiver, p_gift_id, v_cost)
  RETURNING id INTO v_gift_row_id;

  INSERT INTO public.coin_transactions (user_id, delta, reason, stream_id, gift_id)
  VALUES (v_sender, -v_cost, 'gift_sent', v_stream_id, p_gift_id);

  new_balance := v_new_balance;
  new_level := v_level;
  new_xp := v_xp;
  stream_gift_id := v_gift_row_id;
  RETURN NEXT;
END;
$$;

