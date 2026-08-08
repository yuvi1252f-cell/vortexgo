DROP VIEW IF EXISTS public.public_app_settings;

CREATE POLICY "settings public limited read" ON public.app_settings FOR SELECT TO anon USING (true);

GRANT SELECT (id, app_version, apk_url, maintenance_mode, maintenance_message, update_notice)
ON public.app_settings TO anon;