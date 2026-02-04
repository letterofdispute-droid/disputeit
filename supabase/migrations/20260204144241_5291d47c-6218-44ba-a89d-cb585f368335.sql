-- Add alt_text column to category_images table for SEO and accessibility
ALTER TABLE category_images 
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Clear existing cached images to force refresh with new permanent URLs
DELETE FROM category_images;