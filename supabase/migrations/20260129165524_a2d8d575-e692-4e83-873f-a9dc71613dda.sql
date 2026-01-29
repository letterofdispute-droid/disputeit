-- Drop the duplicate permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;

-- Create a secure INSERT policy requiring authentication
CREATE POLICY "Authenticated users can insert analytics"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (true);