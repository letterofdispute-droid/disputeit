
-- Atomic increment function for backfill progress
CREATE OR REPLACE FUNCTION public.increment_backfill_progress(
  p_job_id UUID,
  p_processed INTEGER,
  p_failed INTEGER,
  p_last_slug TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE backfill_jobs SET
    processed_images = COALESCE(processed_images, 0) + p_processed,
    failed_images = COALESCE(failed_images, 0) + p_failed,
    last_post_slug = p_last_slug,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;
