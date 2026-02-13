
CREATE OR REPLACE FUNCTION public.reset_orphaned_generating_items()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reset_count integer;
BEGIN
  UPDATE content_queue
  SET status = 'queued', error_message = NULL, started_at = NULL
  WHERE status = 'generating'
    AND started_at < now() - interval '10 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM generation_jobs 
      WHERE status = 'processing'
    );
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$;
