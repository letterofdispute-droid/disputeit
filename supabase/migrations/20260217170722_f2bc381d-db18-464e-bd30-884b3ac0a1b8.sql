
-- Add keyword_counts column to blog_posts
ALTER TABLE blog_posts ADD COLUMN keyword_counts jsonb DEFAULT NULL;

-- Create a backfill function to compute keyword counts for existing posts
CREATE OR REPLACE FUNCTION public.backfill_keyword_counts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post RECORD;
  plain_text TEXT;
  kw TEXT;
  all_keywords TEXT[];
  counts JSONB;
  regex_pattern TEXT;
  match_count INTEGER;
  updated_count INTEGER := 0;
BEGIN
  FOR post IN
    SELECT id, content, primary_keyword, secondary_keywords
    FROM blog_posts
    WHERE primary_keyword IS NOT NULL
      AND keyword_counts IS NULL
  LOOP
    -- Strip HTML tags to get plain text
    plain_text := lower(regexp_replace(post.content, '<[^>]+>', ' ', 'g'));
    
    -- Build keyword list
    all_keywords := ARRAY[]::TEXT[];
    IF post.primary_keyword IS NOT NULL AND post.primary_keyword != '' THEN
      all_keywords := array_append(all_keywords, post.primary_keyword);
    END IF;
    IF post.secondary_keywords IS NOT NULL THEN
      all_keywords := all_keywords || post.secondary_keywords;
    END IF;
    
    counts := '{}'::jsonb;
    
    FOREACH kw IN ARRAY all_keywords LOOP
      IF kw IS NOT NULL AND kw != '' THEN
        regex_pattern := regexp_replace(lower(kw), '([.*+?^${}()|[\]\\])', '\\\1', 'g');
        SELECT count(*) INTO match_count
        FROM regexp_matches(plain_text, regex_pattern, 'g');
        counts := counts || jsonb_build_object(kw, match_count);
      END IF;
    END LOOP;
    
    UPDATE blog_posts SET keyword_counts = counts WHERE id = post.id;
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;
