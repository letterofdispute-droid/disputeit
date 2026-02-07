-- Add stale job recovery function for bulk planning jobs
CREATE OR REPLACE FUNCTION public.recover_stale_planning_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.bulk_planning_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    error_messages = error_messages || '{"_timeout": "Job timed out - no progress for 10+ minutes"}'::jsonb
  WHERE 
    status = 'processing'
    AND updated_at < NOW() - INTERVAL '10 minutes';
END;
$$;