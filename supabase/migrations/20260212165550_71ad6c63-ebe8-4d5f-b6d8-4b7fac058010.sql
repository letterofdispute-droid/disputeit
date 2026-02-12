
-- Create backfill_jobs table for tracking image backfill progress
CREATE TABLE public.backfill_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  total_images INTEGER DEFAULT 0,
  processed_images INTEGER DEFAULT 0,
  failed_images INTEGER DEFAULT 0,
  last_post_slug TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backfill_jobs ENABLE ROW LEVEL SECURITY;

-- Admin access
CREATE POLICY "Admins can manage backfill jobs"
ON public.backfill_jobs
FOR ALL
USING (is_admin(auth.uid()));

-- Service role access
CREATE POLICY "Service role full access backfill jobs"
ON public.backfill_jobs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
