
-- Create generation_jobs table for backend-driven batch processing
CREATE TABLE public.generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'processing',
  total_items INTEGER NOT NULL DEFAULT 0,
  succeeded_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  queue_item_ids UUID[] NOT NULL DEFAULT '{}',
  bail_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view generation jobs"
  ON public.generation_jobs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create generation jobs"
  ON public.generation_jobs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update generation jobs"
  ON public.generation_jobs FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete generation jobs"
  ON public.generation_jobs FOR DELETE
  USING (is_admin(auth.uid()));

-- Service role full access (for edge function)
CREATE POLICY "Service role full access generation jobs"
  ON public.generation_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
