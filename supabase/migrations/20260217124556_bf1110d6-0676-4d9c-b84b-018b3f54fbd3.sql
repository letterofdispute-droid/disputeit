
CREATE OR REPLACE FUNCTION public.get_keyword_stats()
RETURNS TABLE(vertical text, total bigint, seeds bigint, used bigint, unused bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    kt.vertical,
    count(*)::bigint AS total,
    count(*) FILTER (WHERE kt.is_seed = true)::bigint AS seeds,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NOT NULL)::bigint AS used,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NULL)::bigint AS unused
  FROM keyword_targets kt
  GROUP BY kt.vertical
  ORDER BY kt.vertical;
$$;
