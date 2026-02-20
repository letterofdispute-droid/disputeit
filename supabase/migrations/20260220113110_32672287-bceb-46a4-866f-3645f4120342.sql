
-- Add is_admin() checks to all admin-only RPC functions

-- 1. reset_orphaned_generating_items
CREATE OR REPLACE FUNCTION public.reset_orphaned_generating_items()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  reset_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE content_queue
  SET status = 'queued', error_message = NULL, started_at = NULL
  WHERE status = 'generating'
    AND started_at < now() - interval '10 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM generation_jobs 
      WHERE status = 'processing'
    );
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$function$;

-- 2. bulk_update_link_status
CREATE OR REPLACE FUNCTION public.bulk_update_link_status(p_current_status text, p_new_status text, p_category_slug text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_category_slug IS NOT NULL THEN
    UPDATE link_suggestions ls
    SET status = p_new_status
    FROM blog_posts bp
    WHERE ls.source_post_id = bp.id
      AND bp.category_slug = p_category_slug
      AND ls.status = p_current_status;
  ELSE
    UPDATE link_suggestions
    SET status = p_new_status
    WHERE status = p_current_status;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$;

-- 3. bulk_delete_link_suggestions
CREATE OR REPLACE FUNCTION public.bulk_delete_link_suggestions(p_status text DEFAULT NULL::text, p_category_slug text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_category_slug IS NOT NULL THEN
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status)
      AND source_post_id IN (
        SELECT id FROM blog_posts WHERE category_slug = p_category_slug
      );
  ELSE
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status);
  END IF;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- 4. reconcile_link_counts
CREATE OR REPLACE FUNCTION public.reconcile_link_counts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '120s'
AS $function$
DECLARE
  inbound_updated INT := 0;
  outbound_updated INT := 0;
  ghosts_reset INT := 0;
  short_links_found INT := 0;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Step 1a: Extract all /articles/category/slug links from published posts
  CREATE TEMP TABLE _extracted_links ON COMMIT DROP AS
  SELECT 
    bp.id AS source_id,
    m[1] AS target_slug
  FROM blog_posts bp,
    LATERAL regexp_matches(bp.content, '/articles/[^/"'']+/([^/"''#?]+)', 'g') AS m
  WHERE bp.status = 'published';

  -- Step 1b: Extract bare slug links (href="/some-slug") and validate against article_embeddings
  CREATE TEMP TABLE _bare_slug_links ON COMMIT DROP AS
  SELECT 
    bp.id AS source_id,
    ae.slug AS target_slug
  FROM blog_posts bp,
    LATERAL regexp_matches(bp.content, 'href="/([a-z0-9][a-z0-9-]{8,})"', 'g') AS m
  INNER JOIN article_embeddings ae ON ae.slug = m[1]
  WHERE bp.status = 'published'
    AND m[1] !~ '^(articles|templates|guides|admin|auth|dashboard|login|signup|pricing|about|contact|faq|privacy|terms|disclaimer|cookie-policy|how-it-works|settings)';

  SELECT COUNT(*) INTO short_links_found FROM _bare_slug_links;

  -- Step 1c: Combine both link sets (deduplicated)
  CREATE TEMP TABLE _all_links ON COMMIT DROP AS
  SELECT DISTINCT source_id, target_slug FROM _extracted_links
  UNION
  SELECT DISTINCT source_id, target_slug FROM _bare_slug_links;

  -- Step 2: Calculate inbound counts
  CREATE TEMP TABLE _inbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.source_id) AS real_inbound
  FROM article_embeddings ae
  LEFT JOIN _all_links el ON el.target_slug = ae.slug
  WHERE ae.embedding_status = 'completed'
  GROUP BY ae.id;

  -- Step 3: Calculate outbound counts
  CREATE TEMP TABLE _outbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.target_slug) AS real_outbound
  FROM article_embeddings ae
  LEFT JOIN _all_links el ON el.source_id = ae.content_id
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
  UPDATE link_suggestions ls
  SET status = 'approved', applied_at = NULL
  WHERE ls.status = 'applied'
    AND NOT EXISTS (
      SELECT 1 FROM _all_links el
      WHERE el.source_id = ls.source_post_id
        AND el.target_slug = ls.target_slug
    );
  GET DIAGNOSTICS ghosts_reset = ROW_COUNT;

  RETURN jsonb_build_object(
    'inbound_updated', inbound_updated,
    'outbound_updated', outbound_updated,
    'ghosts_reset', ghosts_reset,
    'short_links_found', short_links_found
  );
END;
$function$;

-- 5. claim_optimization_batch
CREATE OR REPLACE FUNCTION public.claim_optimization_batch(p_job_id uuid, p_batch_size integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offset int;
  v_total int;
  v_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Atomically read and advance the offset
  SELECT current_offset, oversized_files, status
  INTO v_offset, v_total, v_status
  FROM image_optimization_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  -- If job not found, cancelled, or already done
  IF v_offset IS NULL OR v_status = 'cancelled' THEN
    RETURN -1;
  END IF;

  IF v_offset >= COALESCE(v_total, 0) THEN
    RETURN -1;
  END IF;

  -- Advance the offset so no other instance can claim this range
  UPDATE image_optimization_jobs
  SET current_offset = v_offset + p_batch_size,
      updated_at = now()
  WHERE id = p_job_id;

  RETURN v_offset;
END;
$function$;

-- 6. increment_optimization_progress (both overloads)
CREATE OR REPLACE FUNCTION public.increment_optimization_progress(p_job_id uuid, p_processed integer, p_saved_bytes bigint, p_deleted integer, p_new_offset integer, p_errors jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE image_optimization_jobs SET
    processed = COALESCE(processed, 0) + p_processed,
    saved_bytes = COALESCE(saved_bytes, 0) + p_saved_bytes,
    deleted = COALESCE(deleted, 0) + p_deleted,
    current_offset = p_new_offset,
    errors = COALESCE(errors, '[]'::jsonb) || p_errors,
    updated_at = now()
  WHERE id = p_job_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_optimization_progress(p_job_id uuid, p_processed integer, p_saved_bytes bigint, p_deleted integer, p_errors jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE image_optimization_jobs SET
    processed = COALESCE(processed, 0) + p_processed,
    saved_bytes = COALESCE(saved_bytes, 0) + p_saved_bytes,
    deleted = COALESCE(deleted, 0) + p_deleted,
    errors = COALESCE(errors, '[]'::jsonb) || p_errors,
    updated_at = now()
  WHERE id = p_job_id;
END;
$function$;

-- 7. get_optimization_batch
CREATE OR REPLACE FUNCTION public.get_optimization_batch(p_job_id uuid, p_offset integer, p_limit integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(
          COALESCE((SELECT file_list FROM image_optimization_jobs WHERE id = p_job_id), '[]'::jsonb)
        ) WITH ORDINALITY AS t(elem, ord)
        WHERE t.ord > p_offset AND t.ord <= p_offset + p_limit
        ORDER BY t.ord
      ) sub
    ),
    '[]'::jsonb
  );
END;
$function$;
