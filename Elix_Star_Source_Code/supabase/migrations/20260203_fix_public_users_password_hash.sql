ALTER TABLE IF EXISTS public.users
  ALTER COLUMN password_hash DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'users'
        AND c.conname = 'users_id_auth_users_fkey'
    ) THEN
      ALTER TABLE public.users
        ADD CONSTRAINT users_id_auth_users_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
    END IF;
  END IF;
END $$;
