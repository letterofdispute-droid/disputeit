
-- Create dispute_outcomes table for tracking user disputes
CREATE TABLE public.dispute_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'in_progress',
  amount_disputed numeric,
  amount_recovered numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disputes" ON public.dispute_outcomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disputes" ON public.dispute_outcomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disputes" ON public.dispute_outcomes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own disputes" ON public.dispute_outcomes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all disputes" ON public.dispute_outcomes
  FOR SELECT USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_dispute_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dispute_outcomes_updated_at
  BEFORE UPDATE ON public.dispute_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_dispute_outcomes_updated_at();

-- Create consumer_news_cache table for caching government RSS feeds
CREATE TABLE public.consumer_news_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text NOT NULL,
  excerpt text,
  url text NOT NULL,
  published_at timestamptz,
  category_tags text[],
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consumer_news_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news cache" ON public.consumer_news_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage news cache" ON public.consumer_news_cache
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create letter_analyses table for rate limiting free AI analyses
CREATE TABLE public.letter_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  score integer,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.letter_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage analyses" ON public.letter_analyses
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Allow anon inserts for rate limiting
CREATE POLICY "Anyone can insert analyses" ON public.letter_analyses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read own ip analyses" ON public.letter_analyses
  FOR SELECT USING (true);
