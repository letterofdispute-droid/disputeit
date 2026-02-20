
-- Phase 1: Security Fixes

-- 1. Fix letter_purchases SELECT policy: add auth.uid() IS NOT NULL guard
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.letter_purchases;
CREATE POLICY "Users can view their own purchases"
ON public.letter_purchases FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (auth.uid() = user_id OR email = auth.email())
);

-- 2. Fix profiles UPDATE policy: add WITH CHECK to prevent privilege escalation
-- The profiles table has is_admin managed by admin only, so we restrict field changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_admin = (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid())
  AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE user_id = auth.uid())
  AND status IS NOT DISTINCT FROM (SELECT status FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Scope analytics_events INSERT: restrict to authenticated users or enforce allowlist via event_type
-- Strategy: allow authenticated users freely; for anonymous allow only a specific allowlist of event types
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated users can insert analytics events"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR user_id IS NULL
);

CREATE POLICY "Anonymous users can insert limited analytics events"
ON public.analytics_events FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND event_type IN (
    'page_view', 'template_view', 'category_view', 'article_view',
    'guide_view', 'search', 'cta_click', 'assistant_open',
    'browse_templates_click', 'login_complete', 'signup_started',
    'signup_complete', 'google_auth_click', 'dashboard_view'
  )
  AND (event_data IS NULL OR pg_column_size(event_data) < 4096)
);
