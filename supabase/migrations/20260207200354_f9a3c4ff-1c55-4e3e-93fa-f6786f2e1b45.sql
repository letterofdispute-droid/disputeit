-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;

-- Create tightened policy requiring user_id matches auth.uid()
CREATE POLICY "Users can insert own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);