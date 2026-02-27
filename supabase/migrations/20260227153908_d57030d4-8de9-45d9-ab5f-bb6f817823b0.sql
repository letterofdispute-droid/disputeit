
CREATE TABLE public.gsc_recommendations_cache (
  id text PRIMARY KEY DEFAULT 'singleton',
  recommendations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gsc_recommendations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GSC recommendations cache"
  ON public.gsc_recommendations_cache
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access GSC recommendations cache"
  ON public.gsc_recommendations_cache
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
