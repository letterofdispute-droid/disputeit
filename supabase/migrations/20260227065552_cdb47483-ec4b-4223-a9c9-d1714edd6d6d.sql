
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
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT current_offset, oversized_files, status
  INTO v_offset, v_total, v_status
  FROM image_optimization_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF v_offset IS NULL OR v_status = 'cancelled' THEN
    RETURN -1;
  END IF;

  IF v_offset >= COALESCE(v_total, 0) THEN
    RETURN -1;
  END IF;

  UPDATE image_optimization_jobs
  SET current_offset = v_offset + p_batch_size,
      updated_at = now()
  WHERE id = p_job_id;

  RETURN v_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_optimization_batch(p_job_id uuid, p_offset integer, p_limit integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN
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

CREATE OR REPLACE FUNCTION public.increment_optimization_progress(p_job_id uuid, p_processed integer, p_saved_bytes bigint, p_deleted integer, p_new_offset integer, p_errors jsonb DEFAULT '[]'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN
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
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN
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
