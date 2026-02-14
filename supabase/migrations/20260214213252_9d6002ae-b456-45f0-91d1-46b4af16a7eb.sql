-- Fix 4: Update anchor_source CHECK constraint to allow 'semantic' and 'semantic-reverse'
ALTER TABLE public.link_suggestions DROP CONSTRAINT link_suggestions_anchor_source_check;
ALTER TABLE public.link_suggestions ADD CONSTRAINT link_suggestions_anchor_source_check 
  CHECK (anchor_source IS NULL OR anchor_source = ANY(ARRAY[
    'primary_keyword', 'secondary_keyword', 'contextual', 'ai_suggested', 'mandatory',
    'semantic', 'semantic-reverse'
  ]));

-- Fix 5: Create recovery function for stale semantic scan jobs
CREATE OR REPLACE FUNCTION public.recover_stale_semantic_scan_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  stale_job RECORD;
  supabase_url TEXT := 'https://koulmtfnkuapzigcplov.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';
  service_key TEXT;
BEGIN
  service_key := current_setting('supabase.service_role_key', true);

  FOR stale_job IN
    SELECT id, category_filter
    FROM public.semantic_scan_jobs
    WHERE status = 'processing'
      AND updated_at < NOW() - INTERVAL '5 minutes'
  LOOP
    -- Bump updated_at to prevent re-triggering on next cron run
    UPDATE public.semantic_scan_jobs
    SET updated_at = NOW()
    WHERE id = stale_job.id;

    -- Re-invoke the edge function via pg_net
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/scan-for-semantic-links',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key,
        'apikey', anon_key
      ),
      body := jsonb_build_object(
        'jobId', stale_job.id,
        'categorySlug', stale_job.category_filter
      )
    );

    RAISE LOG '[SEMANTIC-SCAN-RECOVERY] Auto-resumed stale scan job %', stale_job.id;
  END LOOP;

  -- Mark very old jobs (30+ min) as failed
  UPDATE public.semantic_scan_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'processing'
    AND updated_at < NOW() - INTERVAL '30 minutes';
END;
$fn$;