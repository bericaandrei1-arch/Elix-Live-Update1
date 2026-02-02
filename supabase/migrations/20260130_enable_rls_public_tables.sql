DO $$
DECLARE
  has_table boolean;
  has_id boolean;
  has_user_id boolean;
  has_follower_id boolean;
  has_sender_id boolean;
  has_is_private boolean;
  has_is_live boolean;
  select_condition text;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gifts_catalog') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.gifts_catalog ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.gifts_catalog FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS gifts_catalog_select_public ON public.gifts_catalog';
    EXECUTE 'CREATE POLICY gifts_catalog_select_public ON public.gifts_catalog FOR SELECT USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS gifts_catalog_write_service_role ON public.gifts_catalog';
    EXECUTE 'CREATE POLICY gifts_catalog_write_service_role ON public.gifts_catalog FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'followers') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.followers FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS followers_select_public ON public.followers';
    EXECUTE 'CREATE POLICY followers_select_public ON public.followers FOR SELECT USING (true)';

    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.followers'::regclass
        AND attname = 'follower_id'
        AND NOT attisdropped
    ) INTO has_follower_id;

    IF has_follower_id THEN
      EXECUTE 'DROP POLICY IF EXISTS followers_insert_self ON public.followers';
      EXECUTE 'CREATE POLICY followers_insert_self ON public.followers FOR INSERT WITH CHECK (follower_id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS followers_delete_self ON public.followers';
      EXECUTE 'CREATE POLICY followers_delete_self ON public.followers FOR DELETE USING (follower_id = auth.uid())';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gifts') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.gifts FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS gifts_select_public ON public.gifts';
    EXECUTE 'CREATE POLICY gifts_select_public ON public.gifts FOR SELECT USING (true)';

    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.gifts'::regclass
        AND attname = 'sender_id'
        AND NOT attisdropped
    ) INTO has_sender_id;
    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.gifts'::regclass
        AND attname = 'user_id'
        AND NOT attisdropped
    ) INTO has_user_id;

    IF has_sender_id THEN
      EXECUTE 'DROP POLICY IF EXISTS gifts_insert_sender ON public.gifts';
      EXECUTE 'CREATE POLICY gifts_insert_sender ON public.gifts FOR INSERT WITH CHECK (sender_id = auth.uid())';
    ELSIF has_user_id THEN
      EXECUTE 'DROP POLICY IF EXISTS gifts_insert_user ON public.gifts';
      EXECUTE 'CREATE POLICY gifts_insert_user ON public.gifts FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'live_streams') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.live_streams FORCE ROW LEVEL SECURITY';

    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.live_streams'::regclass
        AND attname = 'user_id'
        AND NOT attisdropped
    ) INTO has_user_id;
    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.live_streams'::regclass
        AND attname = 'is_private'
        AND NOT attisdropped
    ) INTO has_is_private;
    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.live_streams'::regclass
        AND attname = 'is_live'
        AND NOT attisdropped
    ) INTO has_is_live;

    IF has_is_private AND has_user_id THEN
      select_condition := '(is_private = false OR user_id = auth.uid())';
    ELSIF has_is_live AND has_user_id THEN
      select_condition := '(is_live = true OR user_id = auth.uid())';
    ELSE
      select_condition := 'true';
    END IF;

    EXECUTE 'DROP POLICY IF EXISTS live_streams_select_public ON public.live_streams';
    EXECUTE format('CREATE POLICY live_streams_select_public ON public.live_streams FOR SELECT USING (%s)', select_condition);

    IF has_user_id THEN
      EXECUTE 'DROP POLICY IF EXISTS live_streams_insert_own ON public.live_streams';
      EXECUTE 'CREATE POLICY live_streams_insert_own ON public.live_streams FOR INSERT WITH CHECK (user_id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS live_streams_update_own ON public.live_streams';
      EXECUTE 'CREATE POLICY live_streams_update_own ON public.live_streams FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS live_streams_delete_own ON public.live_streams';
      EXECUTE 'CREATE POLICY live_streams_delete_own ON public.live_streams FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.users FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS users_select_public ON public.users';
    EXECUTE 'CREATE POLICY users_select_public ON public.users FOR SELECT USING (true)';

    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.users'::regclass
        AND attname = 'id'
        AND NOT attisdropped
    ) INTO has_id;

    IF has_id THEN
      EXECUTE 'DROP POLICY IF EXISTS users_insert_self ON public.users';
      EXECUTE 'CREATE POLICY users_insert_self ON public.users FOR INSERT WITH CHECK (id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS users_update_self ON public.users';
      EXECUTE 'CREATE POLICY users_update_self ON public.users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS users_delete_self ON public.users';
      EXECUTE 'CREATE POLICY users_delete_self ON public.users FOR DELETE USING (id = auth.uid())';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos') INTO has_table;
  IF has_table THEN
    EXECUTE 'ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.videos FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS videos_select_public ON public.videos';
    EXECUTE 'CREATE POLICY videos_select_public ON public.videos FOR SELECT USING (true)';

    SELECT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = 'public.videos'::regclass
        AND attname = 'user_id'
        AND NOT attisdropped
    ) INTO has_user_id;

    IF has_user_id THEN
      EXECUTE 'DROP POLICY IF EXISTS videos_insert_own ON public.videos';
      EXECUTE 'CREATE POLICY videos_insert_own ON public.videos FOR INSERT WITH CHECK (user_id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS videos_update_own ON public.videos';
      EXECUTE 'CREATE POLICY videos_update_own ON public.videos FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      EXECUTE 'DROP POLICY IF EXISTS videos_delete_own ON public.videos';
      EXECUTE 'CREATE POLICY videos_delete_own ON public.videos FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;
