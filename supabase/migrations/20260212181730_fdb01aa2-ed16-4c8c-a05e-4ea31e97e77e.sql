
-- Create the recover_stale_backfill_jobs function
CREATE OR REPLACE FUNCTION public.recover_stale_backfill_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  missing_count INT;
  active_job_count INT;
  supabase_url TEXT := 'https://koulmtfnkuapzigcplov.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';
  service_key TEXT;
BEGIN
  -- Get service role key
  service_key := current_setting('supabase.service_role_key', true);

  -- Check if there are published posts missing images
  SELECT COUNT(*) INTO missing_count
  FROM blog_posts
  WHERE status = 'published'
    AND (
      featured_image_url IS NULL
      OR (middle_image_1_url IS NULL AND content LIKE '%MIDDLE_IMAGE_1%')
      OR (middle_image_2_url IS NULL AND content LIKE '%MIDDLE_IMAGE_2%')
    );

  IF missing_count = 0 THEN
    RETURN;
  END IF;

  -- Check if there's already an active backfill job
  SELECT COUNT(*) INTO active_job_count
  FROM backfill_jobs
  WHERE status IN ('pending', 'processing')
    AND updated_at > NOW() - INTERVAL '10 minutes';

  IF active_job_count > 0 THEN
    RETURN;
  END IF;

  -- Cancel any stale backfill jobs
  UPDATE backfill_jobs
  SET status = 'cancelled', updated_at = NOW()
  WHERE status IN ('pending', 'processing')
    AND updated_at < NOW() - INTERVAL '10 minutes';

  -- Trigger the backfill edge function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/backfill-blog-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key,
      'apikey', anon_key
    ),
    body := jsonb_build_object('mode', 'start')
  );

  RAISE LOG '[BACKFILL-RECOVERY] Auto-triggered backfill for % posts with missing images', missing_count;
END;
$function$;
