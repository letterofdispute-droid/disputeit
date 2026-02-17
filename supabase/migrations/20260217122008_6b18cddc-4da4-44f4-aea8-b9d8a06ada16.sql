
-- 1. Create keyword_targets table
CREATE TABLE public.keyword_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical text NOT NULL,
  keyword text NOT NULL,
  is_seed boolean DEFAULT false,
  column_group text,
  priority integer DEFAULT 50,
  used_in_queue_id uuid REFERENCES public.content_queue(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vertical, keyword)
);

ALTER TABLE public.keyword_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage keyword targets"
  ON public.keyword_targets FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access keyword targets"
  ON public.keyword_targets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Create daily_publish_jobs table
CREATE TABLE public.daily_publish_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_count integer NOT NULL DEFAULT 5,
  published_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.daily_publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage publish jobs"
  ON public.daily_publish_jobs FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access publish jobs"
  ON public.daily_publish_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Add keyword columns to content_queue
ALTER TABLE public.content_queue
  ADD COLUMN IF NOT EXISTS primary_keyword text,
  ADD COLUMN IF NOT EXISTS secondary_keywords text[],
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text;
