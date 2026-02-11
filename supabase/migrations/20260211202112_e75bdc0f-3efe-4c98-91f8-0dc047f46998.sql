
CREATE OR REPLACE FUNCTION public.recover_stale_image_optimization_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.image_optimization_jobs
  SET 
    status = 'failed',
    completed_at = NOW(),
    updated_at = NOW(),
    errors = COALESCE(errors, '[]'::jsonb) || '["Job timed out - no progress for 15+ minutes"]'::jsonb
  WHERE 
    status IN ('scanning', 'optimizing', 'cleaning')
    AND updated_at < NOW() - INTERVAL '15 minutes';
END;
$$;
