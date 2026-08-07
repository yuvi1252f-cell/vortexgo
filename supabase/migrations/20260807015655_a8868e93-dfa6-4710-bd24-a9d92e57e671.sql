-- 1. App settings additions
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message text NOT NULL DEFAULT 'YUVIX is under maintenance. We will be back shortly.',
  ADD COLUMN IF NOT EXISTS update_notice text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bonus_max_percent integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS referral_reward integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS referee_reward integer NOT NULL DEFAULT 10;

UPDATE public.app_settings SET payee_name = 'YUVIX', apk_url = '/download',
  marquee = 'Welcome to YUVIX — daily Free Fire tournaments with instant UPI payouts.'
WHERE id = 1;

-- 2. Tournament publishing + room reveal window
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS room_reveal_minutes integer NOT NULL DEFAULT 10;

DROP POLICY IF EXISTS "tournaments public read" ON public.tournaments;
CREATE POLICY "tournaments public read" ON public.tournaments
  FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));

-- 3. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements public read" ON public.announcements
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "announcements admin manage" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Notifications (user_id NULL = broadcast)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'general',
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications read own or broadcast" ON public.notifications
  FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notifications admin manage" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Bonus-capped join
CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament uuid, p_ff_name text)
 RETURNS tournament_entries
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t public.tournaments;
  p public.profiles;
  e public.tournament_entries;
  fee integer;
  bonus_cap integer;
  pct integer;
  use_bonus integer := 0;
  use_dep integer := 0;
  use_win integer := 0;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(p_ff_name),'') = '' THEN RAISE EXCEPTION 'In-game name is required'; END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF NOT t.published THEN RAISE EXCEPTION 'Match is not open'; END IF;
  IF t.status <> 'upcoming' THEN RAISE EXCEPTION 'Registration closed'; END IF;
  IF t.filled_slots >= t.total_slots THEN RAISE EXCEPTION 'Match is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_entries WHERE tournament_id = p_tournament AND user_id = uid)
    THEN RAISE EXCEPTION 'Already joined'; END IF;

  SELECT * INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  fee := t.entry_fee;
  SELECT coalesce(bonus_max_percent, 20) INTO pct FROM public.app_settings WHERE id = 1;
  bonus_cap := floor(fee * coalesce(pct, 20) / 100.0);

  use_bonus := least(p.bonus_coins, bonus_cap);
  IF p.deposit_coins + p.winning_coins < fee - use_bonus THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  use_dep := least(p.deposit_coins, fee - use_bonus);
  use_win := fee - use_bonus - use_dep;

  UPDATE public.profiles SET
    bonus_coins = bonus_coins - use_bonus,
    deposit_coins = deposit_coins - use_dep,
    winning_coins = winning_coins - use_win,
    updated_at = now()
  WHERE id = uid;

  INSERT INTO public.tournament_entries (tournament_id, user_id, ff_name, team_no, position)
  VALUES (p_tournament, uid, trim(p_ff_name), t.filled_slots + 1, 'A')
  RETURNING * INTO e;

  UPDATE public.tournaments SET filled_slots = filled_slots + 1 WHERE id = p_tournament;

  IF fee > 0 THEN
    INSERT INTO public.transactions (user_id, type, amount, note)
    VALUES (uid, 'entry_fee', -fee, 'Entry fee - ' || t.title);
  END IF;

  RETURN e;
END;
$function$;

-- 6. Room details only inside the reveal window
CREATE OR REPLACE FUNCTION public.get_room_credentials(p_tournament uuid)
 RETURNS TABLE(room_id text, room_password text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.room_id, t.room_password FROM public.tournaments t
  WHERE t.id = p_tournament
    AND now() >= t.match_time - make_interval(mins => coalesce(t.room_reveal_minutes, 10))
    AND EXISTS (SELECT 1 FROM public.tournament_entries e
                WHERE e.tournament_id = t.id AND e.user_id = auth.uid());
$function$;

-- 7. Referral rewards use settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code text;
  v_ref uuid;
  v_ref_reward integer := 10;
  v_new_reward integer := 10;
BEGIN
  v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  SELECT id INTO v_ref FROM public.profiles
   WHERE referral_code = upper(coalesce(NEW.raw_user_meta_data->>'referral_code',''));
  SELECT coalesce(referral_reward,10), coalesce(referee_reward,10)
    INTO v_ref_reward, v_new_reward FROM public.app_settings WHERE id = 1;

  INSERT INTO public.profiles (id, username, ff_name, phone, referral_code, referred_by, bonus_coins)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'Player'),
    NEW.raw_user_meta_data->>'ff_name',
    NEW.raw_user_meta_data->>'phone',
    v_code,
    v_ref,
    CASE WHEN v_ref IS NULL THEN 0 ELSE coalesce(v_new_reward,10) END
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player') ON CONFLICT DO NOTHING;

  IF v_ref IS NOT NULL THEN
    UPDATE public.profiles SET bonus_coins = bonus_coins + coalesce(v_ref_reward,10) WHERE id = v_ref;
    INSERT INTO public.transactions (user_id, type, amount, note) VALUES (v_ref, 'referral', coalesce(v_ref_reward,10), 'Referral bonus');
    INSERT INTO public.transactions (user_id, type, amount, note) VALUES (NEW.id, 'bonus', coalesce(v_new_reward,10), 'Welcome referral bonus');
    INSERT INTO public.notifications (user_id, title, body, kind)
    VALUES (v_ref, 'Referral reward', 'You earned ' || coalesce(v_ref_reward,10) || ' bonus coins.', 'referral');
  END IF;
  RETURN NEW;
END;
$function$;

-- 8. Realtime
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_entries REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_entries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;