CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta BIGINT NOT NULL,
  reason TEXT NOT NULL,
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  gift_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coin_transactions_select_self ON public.coin_transactions;
CREATE POLICY coin_transactions_select_self ON public.coin_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS coin_transactions_insert_self ON public.coin_transactions;
CREATE POLICY coin_transactions_insert_self ON public.coin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.stream_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_id TEXT NOT NULL,
  coin_cost BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stream_gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stream_gifts_select_public_or_owner ON public.stream_gifts;
CREATE POLICY stream_gifts_select_public_or_owner ON public.stream_gifts
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.live_streams ls
      WHERE ls.id = public.stream_gifts.stream_id
        AND (
          (COALESCE(ls.is_private, false) = false)
          OR (ls.user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS stream_gifts_insert_sender ON public.stream_gifts;
CREATE POLICY stream_gifts_insert_sender ON public.stream_gifts
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_stream_id ON public.coin_transactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON public.stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_receiver_id ON public.stream_gifts(receiver_id);

CREATE OR REPLACE FUNCTION public.send_stream_gift(p_stream_key TEXT, p_gift_id TEXT)
RETURNS TABLE (new_balance BIGINT, stream_gift_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender UUID;
  v_stream_id UUID;
  v_receiver UUID;
  v_cost BIGINT;
  v_new_balance BIGINT;
  v_gift_id UUID;
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

  INSERT INTO public.profiles (user_id, coin_balance)
  VALUES (v_sender, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
  SET coin_balance = coin_balance - v_cost,
      updated_at = NOW()
  WHERE user_id = v_sender
    AND coin_balance >= v_cost
  RETURNING coin_balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  INSERT INTO public.stream_gifts (stream_id, sender_id, receiver_id, gift_id, coin_cost)
  VALUES (v_stream_id, v_sender, v_receiver, p_gift_id, v_cost)
  RETURNING id INTO v_gift_id;

  INSERT INTO public.coin_transactions (user_id, delta, reason, stream_id, gift_id)
  VALUES (v_sender, -v_cost, 'gift_sent', v_stream_id, p_gift_id);

  new_balance := v_new_balance;
  stream_gift_id := v_gift_id;
  RETURN NEXT;
END;
$$;
