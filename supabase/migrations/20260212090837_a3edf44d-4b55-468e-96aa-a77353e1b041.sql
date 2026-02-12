
-- Update recovery function with direct URL (can't use app.settings in this environment)
CREATE OR REPLACE FUNCTION public.recover_stale_image_optimization_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stale_job RECORD;
  supabase_url TEXT := 'https://koulmtfnkuapzigcplov.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';
  service_key TEXT;
BEGIN
  -- Get service role key from vault or environment
  service_key := current_setting('supabase.service_role_key', true);
  
  -- Find stale optimizing jobs (no progress for 5+ minutes)
  FOR stale_job IN
    SELECT id
    FROM public.image_optimization_jobs
    WHERE status IN ('scanning', 'optimizing')
      AND updated_at < NOW() - INTERVAL '5 minutes'
  LOOP
    -- Bump updated_at to prevent re-triggering
    UPDATE public.image_optimization_jobs
    SET updated_at = NOW()
    WHERE id = stale_job.id;

    -- Use pg_net to invoke the edge function and resume
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/optimize-storage-images',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key,
        'apikey', anon_key
      ),
      body := jsonb_build_object('mode', 'optimize', 'jobId', stale_job.id)
    );

    RAISE LOG '[IMAGE-OPT-RECOVERY] Auto-resumed stale job %', stale_job.id;
  END LOOP;

  -- Mark very old jobs (30+ min) as failed
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
