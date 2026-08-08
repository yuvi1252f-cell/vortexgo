DROP POLICY IF EXISTS "settings public read" ON public.app_settings;
CREATE POLICY "settings authenticated read" ON public.app_settings FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.app_settings FROM anon;

CREATE OR REPLACE VIEW public.public_app_settings
WITH (security_invoker = off) AS
SELECT id, app_version, apk_url, maintenance_mode, maintenance_message, update_notice
FROM public.app_settings WHERE id = 1;

GRANT SELECT ON public.public_app_settings TO anon, authenticated;