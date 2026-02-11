
CREATE TABLE public.image_optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  total_files INT DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  oversized_files INT DEFAULT 0,
  oversized_size_bytes BIGINT DEFAULT 0,
  processed INT DEFAULT 0,
  saved_bytes BIGINT DEFAULT 0,
  deleted INT DEFAULT 0,
  freed_bytes BIGINT DEFAULT 0,
  current_offset INT DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.image_optimization_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage optimization jobs"
  ON public.image_optimization_jobs FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access optimization jobs"
  ON public.image_optimization_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
