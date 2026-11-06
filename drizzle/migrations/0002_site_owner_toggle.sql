CREATE OR REPLACE FUNCTION public.is_site_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(coalesce(auth.jwt()->>'email','')) IN ('akashmanchalwar12@gmail.com','akashmanchalwar@12gmail.com')
    AND coalesce((auth.jwt()->'user_metadata'->>'email_verified')::boolean, true)
$$;
DROP POLICY IF EXISTS "Admins update site status" ON public.site_settings;
CREATE POLICY "Owner updates site status" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_site_owner()) WITH CHECK (public.is_site_owner());