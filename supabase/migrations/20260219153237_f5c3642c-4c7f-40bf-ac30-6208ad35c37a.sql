
-- Drop both overloads first, then recreate with outbound_count

DROP FUNCTION IF EXISTS public.match_semantic_links(vector, text, text, double precision, integer);
DROP FUNCTION IF EXISTS public.match_semantic_links(vector, text, text, double precision, integer, uuid);

-- Overload 1: without exclude_content_id
CREATE FUNCTION public.match_semantic_links(query_embedding vector, source_category text, source_role text, similarity_threshold double precision DEFAULT 0.75, max_results integer DEFAULT 30)
 RETURNS TABLE(id uuid, content_type text, slug text, title text, category_id text, subcategory_slug text, article_role text, primary_keyword text, secondary_keywords text[], inbound_count integer, max_inbound integer, outbound_count integer, similarity double precision, hierarchy_valid boolean, hierarchy_note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ae.id, ae.content_type, ae.slug, ae.title, ae.category_id, ae.subcategory_slug,
    ae.article_role, ae.primary_keyword, ae.secondary_keywords,
    ae.inbound_count, ae.max_inbound, ae.outbound_count,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    CASE
      WHEN source_role = 'cluster' THEN ae.article_role IN ('pillar', 'super-pillar') OR (ae.article_role = 'cluster' AND ae.category_id = source_category)
      ELSE true
    END AS hierarchy_valid,
    CASE
      WHEN source_role = 'cluster' AND ae.article_role = 'cluster' AND ae.category_id != source_category THEN 'Cross-category cluster link not recommended'
      ELSE NULL
    END AS hierarchy_note
  FROM article_embeddings ae
  WHERE ae.embedding IS NOT NULL AND ae.embedding_status = 'completed'
    AND 1 - (ae.embedding <=> query_embedding) > similarity_threshold
    AND ae.inbound_count < ae.max_inbound
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$function$;

-- Overload 2: with exclude_content_id
CREATE FUNCTION public.match_semantic_links(query_embedding vector, source_category text, source_role text, similarity_threshold double precision DEFAULT 0.75, max_results integer DEFAULT 30, exclude_content_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, content_type text, slug text, title text, category_id text, subcategory_slug text, article_role text, primary_keyword text, secondary_keywords text[], inbound_count integer, max_inbound integer, outbound_count integer, similarity double precision, hierarchy_valid boolean, hierarchy_note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ae.id, ae.content_type, ae.slug, ae.title, ae.category_id, ae.subcategory_slug,
    ae.article_role, ae.primary_keyword, ae.secondary_keywords,
    ae.inbound_count, ae.max_inbound, ae.outbound_count,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    CASE
      WHEN source_role = 'cluster' THEN ae.article_role IN ('pillar', 'super-pillar') OR (ae.article_role = 'cluster' AND ae.category_id = source_category)
      ELSE true
    END AS hierarchy_valid,
    CASE
      WHEN source_role = 'cluster' AND ae.article_role = 'cluster' AND ae.category_id != source_category THEN 'Cross-category cluster link not recommended'
      ELSE NULL
    END AS hierarchy_note
  FROM article_embeddings ae
  WHERE ae.embedding IS NOT NULL AND ae.embedding_status = 'completed'
    AND 1 - (ae.embedding <=> query_embedding) > similarity_threshold
    AND ae.inbound_count < ae.max_inbound
    AND (exclude_content_id IS NULL OR ae.content_id IS DISTINCT FROM exclude_content_id)
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$function$;
