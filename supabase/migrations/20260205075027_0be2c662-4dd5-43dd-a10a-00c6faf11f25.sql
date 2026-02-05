-- Add alt text columns for SEO-optimized image descriptions
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS featured_image_alt text,
ADD COLUMN IF NOT EXISTS middle_image_1_alt text,
ADD COLUMN IF NOT EXISTS middle_image_2_alt text;