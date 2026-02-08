ALTER TABLE IF EXISTS public.coin_transactions
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_money NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS coin_package_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS coin_transactions_stripe_session_id_uq
  ON public.coin_transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS coin_transactions_stripe_payment_intent_id_uq
  ON public.coin_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
