
CREATE OR REPLACE FUNCTION public.get_template_progress()
RETURNS TABLE(template_slug text, total bigint, generated bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cp.template_slug,
         count(*) as total,
         count(*) FILTER (WHERE cq.status IN ('generated','published')) as generated
  FROM content_queue cq
  JOIN content_plans cp ON cp.id = cq.plan_id
  GROUP BY cp.template_slug;
$$;
