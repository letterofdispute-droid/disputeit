
-- Fix overly permissive INSERT policy on letter_analyses
-- Rate limiting inserts should only allow the IP hash field to be set - tighten to service role only for inserts
DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.letter_analyses;
DROP POLICY IF EXISTS "Anyone can read own ip analyses" ON public.letter_analyses;

-- Service role does the actual insert from edge functions
-- We only need SELECT to be public (for rate limit checking)
CREATE POLICY "Anyone can view analyses for rate limiting" ON public.letter_analyses
  FOR SELECT USING (true);
