CREATE OR REPLACE FUNCTION public.credit_purchase_coins(
  p_user_id UUID,
  p_coins BIGINT,
  p_reason TEXT,
  p_stripe_session_id TEXT DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_amount_money NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_coin_package_id TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required';
  END IF;
  IF p_coins IS NULL OR p_coins <= 0 THEN
    RAISE EXCEPTION 'coins_must_be_positive';
  END IF;

  IF p_stripe_session_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.coin_transactions WHERE stripe_session_id = p_stripe_session_id) THEN
      SELECT coin_balance INTO v_new_balance FROM public.profiles WHERE user_id = p_user_id;
      RETURN COALESCE(v_new_balance, 0);
    END IF;
  END IF;

  IF p_stripe_payment_intent_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.coin_transactions WHERE stripe_payment_intent_id = p_stripe_payment_intent_id) THEN
      SELECT coin_balance INTO v_new_balance FROM public.profiles WHERE user_id = p_user_id;
      RETURN COALESCE(v_new_balance, 0);
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, coin_balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.profiles
  SET coin_balance = coin_balance + p_coins,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING coin_balance INTO v_new_balance;

  INSERT INTO public.coin_transactions (
    user_id,
    delta,
    reason,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_money,
    currency,
    status,
    coin_package_id
  )
  VALUES (
    p_user_id,
    p_coins,
    COALESCE(p_reason, 'purchase'),
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_amount_money,
    p_currency,
    p_status,
    p_coin_package_id
  );

  RETURN COALESCE(v_new_balance, 0);
END;
$$;
