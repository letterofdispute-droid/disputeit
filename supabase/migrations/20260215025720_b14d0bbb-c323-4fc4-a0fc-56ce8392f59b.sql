
-- Step 1: Cancel the runaway scan job
UPDATE public.semantic_scan_jobs
SET status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE status = 'processing';

-- Step 2: Delete duplicate pending link suggestions, keeping only the oldest per (source_post_id, target_slug)
DELETE FROM public.link_suggestions
WHERE id NOT IN (
  SELECT DISTINCT ON (source_post_id, target_slug) id
  FROM public.link_suggestions
  WHERE status = 'pending'
  ORDER BY source_post_id, target_slug, created_at ASC
)
AND status = 'pending';

-- Step 3: Add unique partial index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_suggestions_unique_pending
ON public.link_suggestions (source_post_id, target_slug)
WHERE status = 'pending';
