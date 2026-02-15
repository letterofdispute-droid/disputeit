
CREATE OR REPLACE FUNCTION public.bulk_delete_link_suggestions(
  p_status text DEFAULT NULL,
  p_category_slug text DEFAULT NULL
) RETURNS bigint AS $$
DECLARE
  deleted_count bigint;
BEGIN
  IF p_category_slug IS NOT NULL THEN
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status)
      AND source_post_id IN (
        SELECT id FROM blog_posts WHERE category_slug = p_category_slug
      );
  ELSE
    DELETE FROM link_suggestions
    WHERE (p_status IS NULL OR status = p_status);
  END IF;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
