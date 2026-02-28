
CREATE TABLE public.gsc_index_status (
  id text PRIMARY KEY DEFAULT 'singleton',
  submitted_count integer NOT NULL DEFAULT 0,
  indexed_count integer NOT NULL DEFAULT 0,
  sitemaps jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gsc_index_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GSC index status"
  ON public.gsc_index_status FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access GSC index status"
  ON public.gsc_index_status FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
