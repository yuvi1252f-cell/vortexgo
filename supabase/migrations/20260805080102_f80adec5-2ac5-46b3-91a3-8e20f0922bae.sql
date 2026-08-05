
CREATE TYPE public.app_role AS ENUM ('admin','player');
CREATE TYPE public.tournament_mode AS ENUM ('solo','duo','squad');
CREATE TYPE public.tournament_category AS ENUM ('survival','full_map','clash_squad','lone_wolf');
CREATE TYPE public.tournament_status AS ENUM ('upcoming','ongoing','completed','cancelled');
CREATE TYPE public.txn_type AS ENUM ('deposit','withdraw','entry_fee','prize','referral','bonus','refund');
CREATE TYPE public.txn_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'Player',
  ff_name text,
  phone text,
  avatar_url text,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deposit_coins integer NOT NULL DEFAULT 0,
  winning_coins integer NOT NULL DEFAULT 0,
  bonus_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  game text NOT NULL DEFAULT 'Free Fire',
  category public.tournament_category NOT NULL DEFAULT 'survival',
  mode public.tournament_mode NOT NULL DEFAULT 'solo',
  map text NOT NULL DEFAULT 'BERMUDA',
  version text NOT NULL DEFAULT 'TTP',
  banner_url text,
  entry_fee integer NOT NULL DEFAULT 0,
  prize_pool integer NOT NULL DEFAULT 0,
  per_kill integer NOT NULL DEFAULT 0,
  total_slots integer NOT NULL DEFAULT 48,
  filled_slots integer NOT NULL DEFAULT 0,
  match_time timestamptz NOT NULL,
  rules text,
  room_id text,
  room_password text,
  status public.tournament_status NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments public read" ON public.tournaments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage tournaments" ON public.tournaments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tournament_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ff_name text NOT NULL,
  team_no integer NOT NULL DEFAULT 1,
  position text NOT NULL DEFAULT 'A',
  kills integer NOT NULL DEFAULT 0,
  rank integer,
  prize integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);
GRANT SELECT, INSERT ON public.tournament_entries TO authenticated;
GRANT ALL ON public.tournament_entries TO service_role;
ALTER TABLE public.tournament_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries readable by players" ON public.tournament_entries FOR SELECT TO authenticated USING (true);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  amount integer NOT NULL,
  status public.txn_status NOT NULL DEFAULT 'approved',
  method text,
  upi_id text,
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions read" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own transactions insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND type = 'deposit' AND status = 'pending');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_ref uuid;
BEGIN
  v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  SELECT id INTO v_ref FROM public.profiles
   WHERE referral_code = upper(coalesce(NEW.raw_user_meta_data->>'referral_code',''));

  INSERT INTO public.profiles (id, username, ff_name, phone, referral_code, referred_by, bonus_coins)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'Player'),
    NEW.raw_user_meta_data->>'ff_name',
    NEW.raw_user_meta_data->>'phone',
    v_code,
    v_ref,
    CASE WHEN v_ref IS NULL THEN 0 ELSE 10 END
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'player') ON CONFLICT DO NOTHING;

  IF v_ref IS NOT NULL THEN
    UPDATE public.profiles SET bonus_coins = bonus_coins + 15 WHERE id = v_ref;
    INSERT INTO public.transactions (user_id, type, amount, note) VALUES (v_ref, 'referral', 15, 'Referral bonus');
    INSERT INTO public.transactions (user_id, type, amount, note) VALUES (NEW.id, 'bonus', 10, 'Welcome referral bonus');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament uuid, p_ff_name text)
RETURNS public.tournament_entries LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.tournaments;
  p public.profiles;
  e public.tournament_entries;
  fee integer;
  use_bonus integer := 0;
  use_dep integer := 0;
  use_win integer := 0;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(trim(p_ff_name),'') = '' THEN RAISE EXCEPTION 'In-game name is required'; END IF;

  SELECT * INTO t FROM public.tournaments WHERE id = p_tournament FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
  IF t.status <> 'upcoming' THEN RAISE EXCEPTION 'Registration closed'; END IF;
  IF t.filled_slots >= t.total_slots THEN RAISE EXCEPTION 'Match is full'; END IF;
  IF EXISTS (SELECT 1 FROM public.tournament_entries WHERE tournament_id = p_tournament AND user_id = uid)
    THEN RAISE EXCEPTION 'Already joined'; END IF;

  SELECT * INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  fee := t.entry_fee;
  IF p.deposit_coins + p.winning_coins + p.bonus_coins < fee THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  use_bonus := least(p.bonus_coins, fee);
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
$$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount integer, p_method text, p_upi_id text)
RETURNS public.transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.profiles;
  tx public.transactions;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount < 50 THEN RAISE EXCEPTION 'Minimum withdrawal is 50 coins'; END IF;
  IF coalesce(trim(p_upi_id),'') = '' THEN RAISE EXCEPTION 'UPI ID is required'; END IF;

  SELECT * INTO p FROM public.profiles WHERE id = uid FOR UPDATE;
  IF p.winning_coins < p_amount THEN RAISE EXCEPTION 'Not enough winning coins'; END IF;

  UPDATE public.profiles SET winning_coins = winning_coins - p_amount, updated_at = now() WHERE id = uid;

  INSERT INTO public.transactions (user_id, type, amount, status, method, upi_id, note)
  VALUES (uid, 'withdraw', -p_amount, 'pending', p_method, trim(p_upi_id), 'Withdrawal request')
  RETURNING * INTO tx;

  RETURN tx;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_room_credentials(p_tournament uuid)
RETURNS TABLE(room_id text, room_password text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.room_id, t.room_password FROM public.tournaments t
  WHERE t.id = p_tournament
    AND EXISTS (SELECT 1 FROM public.tournament_entries e WHERE e.tournament_id = t.id AND e.user_id = auth.uid());
$$;

INSERT INTO public.tournaments (title, category, mode, map, entry_fee, prize_pool, per_kill, total_slots, filled_slots, match_time, rules, status) VALUES
('SURVIVAL — TOP 10 PRIZE POOL SERIES • SKILL ON','survival','solo','BERMUDA',13,2000,0,48,20, now() + interval '3 hours','Ryden ban. Team-up ban. Hacks/glitches not allowed. Double Vector ban. Melee weapons ban. Vehicles ON. Screen recording ON.','upcoming'),
('SOLO FULL MAP — GUN ATTRIBUTES OFF • PLAY SMART','full_map','solo','BERMUDA',7,3500,5,48,7, now() + interval '5 hours','Ryden ban. Screen recording allowed. M79 launcher ban. Team-up not allowed. Double Vector ban.','upcoming'),
('CLASH SQUAD 4v4 — RANKED ROOM','clash_squad','squad','BERMUDA',20,800,0,8,4, now() + interval '2 hours','Best of 7 rounds. No character skills. Custom loadout only.','upcoming'),
('LONE WOLF 1v1 — HEADSHOT KING','lone_wolf','solo','KALAHARI',10,200,0,2,1, now() + interval '1 hour','1v1 only. AWM + M1887. No gloo walls.','upcoming'),
('DUO FULL MAP — FREE ENTRY BOOYAH BASH','full_map','duo','PURGATORY',0,500,3,48,31, now() + interval '8 hours','Free entry. Booyah prize only if 48 slots are full. No teaming with other duos.','upcoming'),
('SURVIVAL NIGHT CUP — HIGH KILL POINTS','survival','squad','BERMUDA',25,5000,10,48,12, now() + interval '10 hours','Squad of 4. Per-kill 10 coins. Full HUD POV must be saved for 24 hours.','upcoming'),
('CLASH SQUAD LEGEND LEAGUE','clash_squad','squad','BERMUDA',15,1200,0,8,8, now() - interval '30 minutes','Ongoing match. Room ID shared in app.','ongoing'),
('SOLO FULL MAP MEGA — SUNDAY FINALE','full_map','solo','BERMUDA',11,10000,7,48,48, now() - interval '1 day','Completed. Results announced.','completed');
