-- Create RPC to atomically increment link counters when a link is applied
CREATE OR REPLACE FUNCTION public.increment_link_counters(
  p_source_post_id uuid,
  p_target_embedding_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Increment outbound count on source article's embedding
  UPDATE article_embeddings
  SET outbound_count = COALESCE(outbound_count, 0) + 1
  WHERE content_id = p_source_post_id;

  -- Increment inbound count on target article's embedding
  IF p_target_embedding_id IS NOT NULL THEN
    UPDATE article_embeddings
    SET inbound_count = COALESCE(inbound_count, 0) + 1
    WHERE id = p_target_embedding_id;
  END IF;
END;
$$;