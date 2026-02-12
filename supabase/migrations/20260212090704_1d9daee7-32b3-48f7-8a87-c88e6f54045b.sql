
-- Layer 4: RPC to fetch only a slice of file_list without loading the full JSONB
CREATE OR REPLACE FUNCTION public.get_optimization_batch(
  p_job_id uuid,
  p_offset int,
  p_limit int
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
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
$$;

-- Layer 5: Update recovery function to auto-resume via pg_net instead of marking failed
CREATE OR REPLACE FUNCTION public.recover_stale_image_optimization_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stale_job RECORD;
BEGIN
  -- Find stale optimizing/scanning jobs (no progress for 5+ minutes)
  FOR stale_job IN
    SELECT id
    FROM public.image_optimization_jobs
    WHERE status IN ('scanning', 'optimizing')
      AND updated_at < NOW() - INTERVAL '5 minutes'
  LOOP
    -- Bump updated_at to prevent re-triggering before the function responds
    UPDATE public.image_optimization_jobs
    SET updated_at = NOW()
    WHERE id = stale_job.id;

    -- Use pg_net to invoke the edge function and resume the job
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/optimize-storage-images',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'apikey', current_setting('app.settings.anon_key', true)
      ),
      body := jsonb_build_object('mode', 'optimize', 'jobId', stale_job.id)
    );

    RAISE LOG '[IMAGE-OPT-RECOVERY] Auto-resumed stale job %', stale_job.id;
  END LOOP;

  -- Still mark very old jobs (30+ min) as failed to prevent infinite loops
  UPDATE public.image_optimization_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    updated_at = NOW(),
    errors = COALESCE(errors, '[]'::jsonb) || '["Job timed out after 30+ minutes with no progress"]'::jsonb
  WHERE 
    status IN ('scanning', 'optimizing')
    AND updated_at < NOW() - INTERVAL '30 minutes';
END;
$$;
