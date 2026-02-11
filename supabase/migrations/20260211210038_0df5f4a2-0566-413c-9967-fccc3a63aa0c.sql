
-- 1. Template SEO overrides table
CREATE TABLE public.template_seo_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.template_seo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template SEO"
  ON public.template_seo_overrides FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read template SEO"
  ON public.template_seo_overrides FOR SELECT
  USING (true);

CREATE TRIGGER update_template_seo_overrides_updated_at
  BEFORE UPDATE ON public.template_seo_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Allow anonymous analytics event insertion (for full funnel tracking)
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;

-- Allow anonymous inserts (session_id required, user_id optional)
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- 3. Add session_id index for funnel queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
