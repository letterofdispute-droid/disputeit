-- Create table to cache Pixabay image results
CREATE TABLE public.category_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  context_key TEXT NOT NULL DEFAULT 'default',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  large_url TEXT NOT NULL,
  pixabay_id TEXT NOT NULL,
  search_query TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, context_key, pixabay_id)
);

-- Create index for faster lookups
CREATE INDEX idx_category_images_category ON public.category_images(category_id, context_key);
CREATE INDEX idx_category_images_expires ON public.category_images(expires_at);

-- Enable RLS
ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached images (public data)
CREATE POLICY "Anyone can view cached images"
ON public.category_images
FOR SELECT
USING (true);

-- Only service role can insert/update/delete (via edge function)
CREATE POLICY "Service role can manage images"
ON public.category_images
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');