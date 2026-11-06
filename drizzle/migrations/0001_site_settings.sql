CREATE TABLE public.site_settings (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), is_open boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site status" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update site status" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.site_settings (id, is_open) VALUES (1, true);