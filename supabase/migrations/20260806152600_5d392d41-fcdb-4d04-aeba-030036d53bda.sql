-- 1. APP SETTINGS
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  upi_id text NOT NULL DEFAULT 'gurjaryuvi735-1@okicici',
  payee_name text NOT NULL DEFAULT 'VortexGo',
  qr_url text,
  apk_url text NOT NULL DEFAULT '/vortexgo.apk',
  app_version text NOT NULL DEFAULT '1.0.0',
  support_url text NOT NULL DEFAULT 'https://chat.whatsapp.com/J8yJnG0vAgu0nmfSCVDXpf?s=cl&p=a&ilr=1',
  coin_rate numeric NOT NULL DEFAULT 1,
  min_deposit integer NOT NULL DEFAULT 10,
  min_withdraw integer NOT NULL DEFAULT 50,
  payment_window_seconds integer NOT NULL DEFAULT 300,
  marquee text NOT NULL DEFAULT 'Welcome to VortexGo — daily Free Fire tournaments with instant UPI payouts.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "settings admin insert" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. TRANSACTIONS: proof + payment window + review trail
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS screenshot_url text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

CREATE POLICY "admins read all transactions" ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. PROFILES admin access
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. ENTRIES admin access
CREATE POLICY "admins manage entries" ON public.tournament_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.tournament_entries TO authenticated;

-- 5. ROLES admin management
CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 6. REVIEW FUNCTION
CREATE OR REPLACE FUNCTION public.admin_review_transaction(p_txn uuid, p_approve boolean, p_note text DEFAULT NULL)
RETURNS public.transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  tx public.transactions;
  uid uuid := auth.uid();
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO tx FROM public.transactions WHERE id = p_txn FOR UPDATE;
  IF tx.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF tx.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;

  IF p_approve THEN
    IF tx.type = 'deposit' THEN
      UPDATE public.profiles SET deposit_coins = deposit_coins + tx.amount, updated_at = now() WHERE id = tx.user_id;
    END IF;
    UPDATE public.transactions SET status = 'approved', reviewed_at = now(), reviewed_by = uid,
      note = coalesce(p_note, note) WHERE id = p_txn RETURNING * INTO tx;
  ELSE
    IF tx.type = 'withdraw' THEN
      UPDATE public.profiles SET winning_coins = winning_coins + abs(tx.amount), updated_at = now() WHERE id = tx.user_id;
    END IF;
    UPDATE public.transactions SET status = 'rejected', reviewed_at = now(), reviewed_by = uid,
      note = coalesce(p_note, note) WHERE id = p_txn RETURNING * INTO tx;
  END IF;
  RETURN tx;
END;
$$;

-- 7. ADMIN WALLET ADJUSTMENT
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user uuid, p_bucket text, p_amount integer, p_note text DEFAULT 'Admin adjustment')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF p_bucket = 'deposit' THEN
    UPDATE public.profiles SET deposit_coins = greatest(0, deposit_coins + p_amount), updated_at = now() WHERE id = p_user;
  ELSIF p_bucket = 'winning' THEN
    UPDATE public.profiles SET winning_coins = greatest(0, winning_coins + p_amount), updated_at = now() WHERE id = p_user;
  ELSE
    UPDATE public.profiles SET bonus_coins = greatest(0, bonus_coins + p_amount), updated_at = now() WHERE id = p_user;
  END IF;
  INSERT INTO public.transactions (user_id, type, amount, status, note)
  VALUES (p_user, CASE WHEN p_amount >= 0 THEN 'bonus' ELSE 'refund' END, p_amount, 'approved', p_note);
END;
$$;

-- 8. RESULTS
CREATE OR REPLACE FUNCTION public.admin_set_entry_result(p_entry uuid, p_kills integer, p_rank integer, p_prize integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  e public.tournament_entries;
  delta integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO e FROM public.tournament_entries WHERE id = p_entry FOR UPDATE;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Entry not found'; END IF;
  delta := coalesce(p_prize,0) - e.prize;
  UPDATE public.tournament_entries SET kills = coalesce(p_kills,0), rank = p_rank, prize = coalesce(p_prize,0) WHERE id = p_entry;
  IF delta <> 0 THEN
    UPDATE public.profiles SET winning_coins = greatest(0, winning_coins + delta), updated_at = now() WHERE id = e.user_id;
    INSERT INTO public.transactions (user_id, type, amount, status, note)
    VALUES (e.user_id, 'prize', delta, 'approved', 'Match winnings');
  END IF;
END;
$$;

-- 9. ADMIN LIST OF PAYMENTS WITH PLAYER INFO
CREATE OR REPLACE FUNCTION public.admin_transactions(p_status txn_status DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_id uuid, username text, phone text, type txn_type, amount integer,
  status txn_status, method text, upi_id text, reference text, screenshot_url text,
  note text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.user_id, p.username, p.phone, t.type, t.amount, t.status, t.method,
         t.upi_id, t.reference, t.screenshot_url, t.note, t.created_at
  FROM public.transactions t
  JOIN public.profiles p ON p.id = t.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND (p_status IS NULL OR t.status = p_status)
  ORDER BY t.created_at DESC
  LIMIT 300;
$$;

-- 10. STORAGE policies for payment proofs
CREATE POLICY "users upload own proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users read own proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- 11. Promote the existing account to admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin' FROM public.user_roles WHERE role = 'player'
ON CONFLICT DO NOTHING;
