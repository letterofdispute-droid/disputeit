-- Create site_settings table for admin settings persistence
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can view settings"
ON public.site_settings FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings"
ON public.site_settings FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings"
ON public.site_settings FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete settings"
ON public.site_settings FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger for updating updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'DisputeLetters'),
  ('site_url', 'https://disputeletters.com'),
  ('site_description', 'Professional dispute letters, without the guesswork.'),
  ('from_email', 'noreply@disputeletters.com'),
  ('support_email', 'support@disputeletters.com'),
  ('welcome_email_enabled', 'true'),
  ('letter_delivery_email_enabled', 'true'),
  ('single_letter_price', '4.99'),
  ('letter_pack_price', '12.99'),
  ('unlimited_monthly_price', '29.99'),
  ('free_trial_enabled', 'true');

-- Clean up duplicate RLS policies that don't use is_admin() function
-- These may cause issues if they still reference profiles table directly

-- Drop old policies on analytics_events if they exist
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can insert analytics" ON public.analytics_events;

-- Drop old policies on blog_categories if they exist  
DROP POLICY IF EXISTS "Admins can manage blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can insert blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can update blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can delete blog categories" ON public.blog_categories;

-- Drop old policies on blog_tags if they exist
DROP POLICY IF EXISTS "Admins can manage blog tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admins can insert blog tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admins can update blog tags" ON public.blog_tags;
DROP POLICY IF EXISTS "Admins can delete blog tags" ON public.blog_tags;