
-- Add started_at column to content_queue
ALTER TABLE public.content_queue
ADD COLUMN started_at TIMESTAMPTZ DEFAULT NULL;

-- Update recover_stale_generating_items to use started_at
CREATE OR REPLACE FUNCTION public.recover_stale_generating_items()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.content_queue
  SET 
    status = 'failed',
    error_message = 'Generation timed out after 10 minutes'
  WHERE 
    status = 'generating'
    AND started_at < NOW() - INTERVAL '10 minutes'
    AND (generated_at IS NULL);
END;
$function$;
