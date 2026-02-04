-- Add middle image columns to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN middle_image_1_url text,
ADD COLUMN middle_image_2_url text;