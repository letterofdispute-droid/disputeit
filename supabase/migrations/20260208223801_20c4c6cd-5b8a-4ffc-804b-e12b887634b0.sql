-- Create embedding jobs table for tracking bulk embedding generation
CREATE TABLE public.embedding_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'processing',
  content_type TEXT NOT NULL DEFAULT 'blog_post',
  category_filter TEXT,
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  skipped_items INTEGER NOT NULL DEFAULT 0,
  processed_ids UUID[] NOT NULL DEFAULT '{}',
  failed_ids UUID[] NOT NULL DEFAULT '{}',
  error_messages JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT embedding_jobs_status_check CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE public.embedding_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view embedding jobs"
  ON public.embedding_jobs
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create embedding jobs"
  ON public.embedding_jobs
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update embedding jobs"
  ON public.embedding_jobs
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete embedding jobs"
  ON public.embedding_jobs
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Service role access for edge functions
CREATE POLICY "Service role full access embedding jobs"
  ON public.embedding_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for efficient queries
CREATE INDEX idx_embedding_jobs_status ON public.embedding_jobs(status);

-- Add updated_at trigger
CREATE TRIGGER update_embedding_jobs_updated_at
  BEFORE UPDATE ON public.embedding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();