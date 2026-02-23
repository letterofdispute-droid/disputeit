-- Add batch tracking columns to keyword_targets
ALTER TABLE public.keyword_targets
  ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS imported_at timestamptz DEFAULT now();

-- Create unified SEO metrics RPC
CREATE OR REPLACE FUNCTION public.get_seo_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  published_count bigint;
  total_articles bigint;
  queued_count bigint;
  generating_count bigint;
  generated_count bigint;
  queue_published_count bigint;
  failed_count bigint;
  links_applied bigint;
  links_pending bigint;
  links_approved bigint;
  total_keywords bigint;
  unused_keywords bigint;
  gsc_last_sync timestamptz;
  gsc_total_queries bigint;
BEGIN
  SELECT count(*) FILTER (WHERE status = 'published'), count(*)
  INTO published_count, total_articles
  FROM blog_posts;

  SELECT 
    count(*) FILTER (WHERE status = 'queued'),
    count(*) FILTER (WHERE status = 'generating'),
    count(*) FILTER (WHERE status = 'generated'),
    count(*) FILTER (WHERE status = 'published'),
    count(*) FILTER (WHERE status = 'failed')
  INTO queued_count, generating_count, generated_count, queue_published_count, failed_count
  FROM content_queue;

  SELECT 
    count(*) FILTER (WHERE status = 'applied'),
    count(*) FILTER (WHERE status = 'pending'),
    count(*) FILTER (WHERE status = 'approved')
  INTO links_applied, links_pending, links_approved
  FROM link_suggestions;

  SELECT count(*), count(*) FILTER (WHERE used_in_queue_id IS NULL)
  INTO total_keywords, unused_keywords
  FROM keyword_targets;

  SELECT max(fetched_at), count(DISTINCT query)
  INTO gsc_last_sync, gsc_total_queries
  FROM gsc_performance_cache;

  result := jsonb_build_object(
    'publishedArticles', published_count,
    'totalArticles', total_articles,
    'queued', queued_count,
    'generating', generating_count,
    'generated', generated_count,
    'queuePublished', queue_published_count,
    'failed', failed_count,
    'linksApplied', links_applied,
    'linksPending', links_pending,
    'linksApproved', links_approved,
    'totalKeywords', total_keywords,
    'unusedKeywords', unused_keywords,
    'gscLastSync', gsc_last_sync,
    'gscTotalQueries', gsc_total_queries
  );

  RETURN result;
END;
$$;

-- Drop old get_keyword_stats and recreate with batch info
DROP FUNCTION IF EXISTS public.get_keyword_stats();

CREATE FUNCTION public.get_keyword_stats()
RETURNS TABLE(vertical text, total bigint, seeds bigint, used bigint, unused bigint, latest_batch_id uuid, latest_imported_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    kt.vertical,
    count(*)::bigint AS total,
    count(*) FILTER (WHERE kt.is_seed = true)::bigint AS seeds,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NOT NULL)::bigint AS used,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NULL)::bigint AS unused,
    (SELECT k2.batch_id FROM keyword_targets k2 WHERE k2.vertical = kt.vertical ORDER BY k2.imported_at DESC NULLS LAST LIMIT 1) AS latest_batch_id,
    max(kt.imported_at) AS latest_imported_at
  FROM keyword_targets kt
  GROUP BY kt.vertical
  ORDER BY kt.vertical;
$$;