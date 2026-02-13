
-- RPC function to count articles per template slug from blog_posts (bypasses 1000-row limit)
CREATE OR REPLACE FUNCTION public.get_template_article_counts()
RETURNS TABLE(template_slug text, article_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT unnest(related_templates) AS template_slug,
         count(*) AS article_count
  FROM blog_posts
  WHERE status = 'published'
    AND related_templates IS NOT NULL
  GROUP BY template_slug;
$$;
