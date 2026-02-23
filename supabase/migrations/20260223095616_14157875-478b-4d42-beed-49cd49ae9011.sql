
-- RPC: get_article_health_data
-- Returns published articles with health-relevant fields joined with article_embeddings
CREATE OR REPLACE FUNCTION public.get_article_health_data()
RETURNS TABLE(
  id uuid,
  title text,
  slug text,
  category_slug text,
  featured_image_url text,
  meta_title text,
  meta_description text,
  primary_keyword text,
  secondary_keywords text[],
  related_templates text[],
  middle_image_1_url text,
  middle_image_2_url text,
  content_length integer,
  published_at timestamptz,
  inbound_count integer,
  outbound_count integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.title,
    bp.slug,
    bp.category_slug,
    bp.featured_image_url,
    bp.meta_title,
    bp.meta_description,
    bp.primary_keyword,
    bp.secondary_keywords,
    bp.related_templates,
    bp.middle_image_1_url,
    bp.middle_image_2_url,
    length(bp.content)::integer AS content_length,
    bp.published_at,
    COALESCE(ae.inbound_count, 0)::integer AS inbound_count,
    COALESCE(ae.outbound_count, 0)::integer AS outbound_count
  FROM blog_posts bp
  LEFT JOIN article_embeddings ae ON ae.content_id = bp.id
  WHERE bp.status = 'published'
  ORDER BY bp.published_at DESC;
END;
$$;

-- RPC: get_declining_queries
-- Compares latest GSC data vs earlier data to find position regressions
CREATE OR REPLACE FUNCTION public.get_declining_queries(min_regression double precision DEFAULT 3.0)
RETURNS TABLE(
  query text,
  page text,
  previous_position double precision,
  current_position double precision,
  position_delta double precision,
  current_impressions integer,
  current_clicks integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      g.query,
      g.page,
      g.position,
      g.impressions,
      g.clicks,
      g.fetched_at,
      ROW_NUMBER() OVER (PARTITION BY g.query ORDER BY g.fetched_at DESC) AS rn
    FROM gsc_performance_cache g
  ),
  latest AS (
    SELECT * FROM ranked WHERE rn = 1
  ),
  previous AS (
    SELECT * FROM ranked WHERE rn = 2
  )
  SELECT
    l.query,
    l.page,
    p.position AS previous_position,
    l.position AS current_position,
    (l.position - p.position) AS position_delta,
    l.impressions::integer AS current_impressions,
    l.clicks::integer AS current_clicks
  FROM latest l
  INNER JOIN previous p ON l.query = p.query
  WHERE (l.position - p.position) >= min_regression
  ORDER BY (l.position - p.position) DESC;
END;
$$;
