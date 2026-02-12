
CREATE OR REPLACE FUNCTION public.get_next_backfill_post()
RETURNS SETOF blog_posts
LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM blog_posts
  WHERE status = 'published'
    AND (
      featured_image_url IS NULL
      OR (middle_image_1_url IS NULL AND content LIKE '%MIDDLE_IMAGE_1%')
      OR (middle_image_2_url IS NULL AND content LIKE '%MIDDLE_IMAGE_2%')
    )
  ORDER BY created_at DESC
  LIMIT 1;
$$;
