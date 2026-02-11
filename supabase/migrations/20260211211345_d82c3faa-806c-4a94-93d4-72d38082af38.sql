-- Allow anyone to read site_settings (prices need to be visible publicly)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);
