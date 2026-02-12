
-- 1) Create atomic claim RPC
CREATE OR REPLACE FUNCTION public.claim_optimization_batch(p_job_id uuid, p_batch_size int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset int;
  v_total int;
  v_status text;
BEGIN
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
$$;

-- 2) Replace increment_optimization_progress to remove p_new_offset
CREATE OR REPLACE FUNCTION public.increment_optimization_progress(
  p_job_id uuid,
  p_processed int,
  p_saved_bytes bigint,
  p_deleted int,
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
    errors = COALESCE(errors, '[]'::jsonb) || p_errors,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;
