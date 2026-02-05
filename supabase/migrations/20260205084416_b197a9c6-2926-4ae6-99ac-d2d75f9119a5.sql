-- Function to detect and recover stale generating items
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
    AND created_at < NOW() - INTERVAL '10 minutes'
    AND (generated_at IS NULL);
END;
$function$;