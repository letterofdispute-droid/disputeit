
-- Table for tracking keyword planning job progress
CREATE TABLE public.keyword_planning_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status text NOT NULL DEFAULT 'processing',
  verticals text[] NOT NULL DEFAULT '{}',
  current_vertical_index integer NOT NULL DEFAULT 0,
  completed_verticals text[] NOT NULL DEFAULT '{}',
  failed_verticals text[] NOT NULL DEFAULT '{}',
  total_planned integer NOT NULL DEFAULT 0,
  vertical_results jsonb NOT NULL DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.keyword_planning_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage keyword planning jobs"
  ON public.keyword_planning_jobs FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access keyword planning jobs"
  ON public.keyword_planning_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
