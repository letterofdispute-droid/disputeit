
CREATE OR REPLACE FUNCTION public.bulk_update_link_status(
  p_current_status text,
  p_new_status text,
  p_category_slug text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  IF p_category_slug IS NOT NULL THEN
    UPDATE link_suggestions ls
    SET status = p_new_status
    FROM blog_posts bp
    WHERE ls.source_post_id = bp.id
      AND bp.category_slug = p_category_slug
      AND ls.status = p_current_status;
  ELSE
    UPDATE link_suggestions
    SET status = p_new_status
    WHERE status = p_current_status;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
