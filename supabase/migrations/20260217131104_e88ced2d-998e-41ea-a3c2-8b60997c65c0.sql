CREATE OR REPLACE FUNCTION get_unused_keyword_verticals()
RETURNS TABLE(vertical text) AS $$
  SELECT DISTINCT vertical FROM keyword_targets WHERE used_in_queue_id IS NULL ORDER BY vertical;
$$ LANGUAGE sql STABLE;