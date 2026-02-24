
-- Create og_images table
CREATE TABLE public.og_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.og_images ENABLE ROW LEVEL SECURITY;

-- Anyone can read OG images (needed for SEOHead on all pages)
CREATE POLICY "Anyone can view OG images"
  ON public.og_images FOR SELECT
  USING (true);

-- Admins can manage OG images
CREATE POLICY "Admins can manage OG images"
  ON public.og_images FOR ALL
  USING (is_admin(auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access OG images"
  ON public.og_images FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_og_images_updated_at
  BEFORE UPDATE ON public.og_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create og-images storage bucket (public for social platform access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true);

-- Anyone can view OG images from storage
CREATE POLICY "Anyone can view OG images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'og-images');

-- Service role can upload OG images
CREATE POLICY "Service role can manage OG images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'og-images' AND auth.role() = 'service_role'::text)
  WITH CHECK (bucket_id = 'og-images' AND auth.role() = 'service_role'::text);
