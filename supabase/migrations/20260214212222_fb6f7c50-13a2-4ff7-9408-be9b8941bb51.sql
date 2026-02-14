
-- Create semantic_scan_jobs table for tracking scan progress
CREATE TABLE public.semantic_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'processing',
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  total_suggestions INTEGER NOT NULL DEFAULT 0,
  similarity_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.75,
  category_filter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.semantic_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Admin access
CREATE POLICY "Admins can manage scan jobs"
  ON public.semantic_scan_jobs
  FOR ALL
  USING (is_admin(auth.uid()));

-- Service role access (for edge function)
CREATE POLICY "Service role full access scan jobs"
  ON public.semantic_scan_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic increment function for scan progress
CREATE OR REPLACE FUNCTION public.increment_scan_progress(
  p_job_id UUID,
  p_processed INTEGER,
  p_suggestions INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE semantic_scan_jobs SET
    processed_items = processed_items + p_processed,
    total_suggestions = total_suggestions + p_suggestions,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;
