
CREATE OR REPLACE FUNCTION public.reconcile_link_counts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inbound_updated INT := 0;
  outbound_updated INT := 0;
  ghosts_reset INT := 0;
BEGIN
  -- Step 1: Extract all internal article links from published posts
  CREATE TEMP TABLE _extracted_links ON COMMIT DROP AS
  SELECT 
    bp.id AS source_id,
    m[1] AS target_slug
  FROM blog_posts bp,
    LATERAL regexp_matches(bp.content, '/articles/[^/"'']+/([^/"''#?]+)', 'g') AS m
  WHERE bp.status = 'published';

  -- Step 2: Calculate inbound counts
  CREATE TEMP TABLE _inbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.source_id) AS real_inbound
  FROM article_embeddings ae
  LEFT JOIN _extracted_links el ON el.target_slug = ae.slug
  WHERE ae.embedding_status = 'completed'
  GROUP BY ae.id;

  -- Step 3: Calculate outbound counts
  CREATE TEMP TABLE _outbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.target_slug) AS real_outbound
  FROM article_embeddings ae
  LEFT JOIN _extracted_links el ON el.source_id = ae.content_id
  WHERE ae.embedding_status = 'completed'
  GROUP BY ae.id;

  -- Step 4: Update inbound_count
  UPDATE article_embeddings ae
  SET inbound_count = COALESCE(ib.real_inbound, 0)
  FROM _inbound ib
  WHERE ae.id = ib.embedding_id
    AND ae.inbound_count IS DISTINCT FROM COALESCE(ib.real_inbound, 0);
  GET DIAGNOSTICS inbound_updated = ROW_COUNT;

  -- Step 5: Update outbound_count
  UPDATE article_embeddings ae
  SET outbound_count = COALESCE(ob.real_outbound, 0)
  FROM _outbound ob
  WHERE ae.id = ob.embedding_id
    AND ae.outbound_count IS DISTINCT FROM COALESCE(ob.real_outbound, 0);
  GET DIAGNOSTICS outbound_updated = ROW_COUNT;

  -- Step 6: Detect ghost suggestions (marked applied but link not in HTML)
  -- Reset them to 'approved' so they can be re-applied
  UPDATE link_suggestions ls
  SET status = 'approved', applied_at = NULL
  WHERE ls.status = 'applied'
    AND NOT EXISTS (
      SELECT 1 FROM _extracted_links el
      WHERE el.source_id = ls.source_post_id
        AND el.target_slug = ls.target_slug
    );
  GET DIAGNOSTICS ghosts_reset = ROW_COUNT;

  RETURN jsonb_build_object(
    'inbound_updated', inbound_updated,
    'outbound_updated', outbound_updated,
    'ghosts_reset', ghosts_reset
  );
END;
$function$;
