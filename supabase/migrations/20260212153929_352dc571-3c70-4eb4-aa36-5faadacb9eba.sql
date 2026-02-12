
CREATE OR REPLACE FUNCTION public.increment_optimization_progress(
  p_job_id uuid,
  p_processed int,
  p_saved_bytes bigint,
  p_deleted int,
  p_new_offset int,
  p_errors jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE image_optimization_jobs SET
    processed = COALESCE(processed, 0) + p_processed,
    saved_bytes = COALESCE(saved_bytes, 0) + p_saved_bytes,
    deleted = COALESCE(deleted, 0) + p_deleted,
    current_offset = p_new_offset,
    errors = COALESCE(errors, '[]'::jsonb) || p_errors,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;
