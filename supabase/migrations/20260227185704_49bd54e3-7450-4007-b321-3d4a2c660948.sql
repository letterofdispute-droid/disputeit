
-- Step 1: Delete duplicate rows, keeping only the one with the latest fetched_at
DELETE FROM public.gsc_performance_cache
WHERE id NOT IN (
  SELECT DISTINCT ON (query, COALESCE(page, ''), date_range_start, date_range_end) id
  FROM public.gsc_performance_cache
  ORDER BY query, COALESCE(page, ''), date_range_start, date_range_end, fetched_at DESC
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE public.gsc_performance_cache
ADD CONSTRAINT gsc_performance_cache_query_page_dates_unique
UNIQUE (query, page, date_range_start, date_range_end);
