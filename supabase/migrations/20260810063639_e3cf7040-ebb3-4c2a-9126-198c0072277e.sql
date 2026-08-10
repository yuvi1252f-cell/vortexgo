-- 1. Privacy fix: restrict anonymous reads to non-sensitive columns only
REVOKE SELECT ON public.app_settings FROM anon;
GRANT SELECT (id, app_version, apk_url, maintenance_mode, maintenance_message, update_notice, marquee, support_url, min_deposit, min_withdraw, coin_rate, payment_window_seconds, created_at, updated_at)
  ON public.app_settings TO anon;

-- 2. App content (editable player-facing strings)
CREATE TABLE public.app_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  group_name text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_content TO authenticated;
GRANT ALL ON public.app_content TO service_role;
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content public read" ON public.app_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content admin manage" ON public.app_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER app_content_updated_at BEFORE UPDATE ON public.app_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Banners
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text,
  button_text text NOT NULL DEFAULT '',
  action_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners public read" ON public.banners FOR SELECT TO anon, authenticated
  USING (
    (active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()))
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "banners admin manage" ON public.banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Rules sections
CREATE TABLE public.rules_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rules_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rules_sections TO authenticated;
GRANT ALL ON public.rules_sections TO service_role;
ALTER TABLE public.rules_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules public read" ON public.rules_sections FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "rules admin manage" ON public.rules_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER rules_sections_updated_at BEFORE UPDATE ON public.rules_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Admin activity log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  action text NOT NULL,
  entity text NOT NULL DEFAULT '',
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit admin insert" ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor = auth.uid());

-- 6. Tournament extras
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS results_published boolean NOT NULL DEFAULT false;

-- 7. Seed default editable content
INSERT INTO public.app_content (key, value, label, group_name, sort_order) VALUES
  ('home_title', 'BARMUDA CLASH', 'Home title', 'home', 1),
  ('hero_heading', 'ENTER THE ARENA', 'Hero heading', 'home', 2),
  ('hero_subtitle', 'Daily skill-based tournaments. Fair play. Instant payouts.', 'Hero subtitle', 'home', 3),
  ('welcome_message', 'Welcome back, champion.', 'Welcome message', 'home', 4),
  ('tournaments_title', 'Live & Upcoming Matches', 'Tournament section title', 'home', 5),
  ('cta_join_label', 'JOIN NOW', 'Join button label', 'buttons', 1),
  ('cta_download_label', 'DOWNLOAD APP', 'Download button label', 'buttons', 2),
  ('empty_tournaments', 'No matches right now. Check back soon.', 'Empty matches message', 'empty', 1),
  ('empty_history', 'You have not played any match yet.', 'Empty history message', 'empty', 2),
  ('about_text', 'BARMUDA CLASH is a skill-based esports tournament platform.', 'About text', 'info', 1),
  ('faq_text', 'Q: How do I join a match?\nA: Open a match and tap Join.', 'FAQ text', 'info', 2),
  ('support_text', 'Need help? Contact us on WhatsApp support.', 'Support text', 'info', 3),
  ('important_notice', '', 'Important notice', 'info', 4)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.rules_sections (category, title, body, sort_order) VALUES
  ('general', 'General Rules', 'Play fair. One account per player. Respect all participants.', 1),
  ('match', 'Match Rules', 'Join the room 10 minutes before start time. Late entries are not allowed.', 2),
  ('fairplay', 'Fair Play', 'Hacks, emulators on mobile lobbies, and teaming are strictly banned.', 3),
  ('disqualification', 'Disqualification', 'Rule breakers are disqualified without refund.', 4),
  ('room', 'Room Rules', 'Room ID and password are revealed 10 minutes before the match.', 5),
  ('faq', 'FAQ', 'Winnings are credited automatically after results are published.', 6);

-- 8. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rules_sections;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;