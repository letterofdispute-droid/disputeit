
-- Create GSC performance cache table
CREATE TABLE public.gsc_performance_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text NOT NULL,
  page text,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr double precision NOT NULL DEFAULT 0,
  position double precision NOT NULL DEFAULT 0,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  country text DEFAULT 'US'
);

-- Create indexes for performance
CREATE INDEX idx_gsc_cache_query ON public.gsc_performance_cache (query);
CREATE INDEX idx_gsc_cache_fetched_at ON public.gsc_performance_cache (fetched_at DESC);
CREATE INDEX idx_gsc_cache_impressions ON public.gsc_performance_cache (impressions DESC);
CREATE INDEX idx_gsc_cache_position ON public.gsc_performance_cache (position);

-- Enable RLS
ALTER TABLE public.gsc_performance_cache ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage GSC cache"
ON public.gsc_performance_cache
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access GSC cache"
ON public.gsc_performance_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
