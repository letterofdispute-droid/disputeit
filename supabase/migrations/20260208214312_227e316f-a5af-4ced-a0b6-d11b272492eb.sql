-- Phase 1: Semantic Linking Infrastructure
-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create article_embeddings table
CREATE TABLE public.article_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'template', 'guide')),
  content_id UUID,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  subcategory_slug TEXT,
  
  -- Semantic vector (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding vector(1536),
  
  -- Extracted metadata
  topic_summary TEXT,
  headings_text TEXT,
  
  -- Keywords
  primary_keyword TEXT,
  secondary_keywords TEXT[],
  anchor_variants TEXT[],
  
  -- Hierarchy
  article_type TEXT,
  article_role TEXT NOT NULL DEFAULT 'cluster' 
    CHECK (article_role IN ('super-pillar', 'pillar', 'cluster')),
  parent_pillar_id UUID,
  related_categories TEXT[],
  
  -- Link equity tracking
  inbound_count INTEGER DEFAULT 0,
  outbound_count INTEGER DEFAULT 0,
  max_inbound INTEGER DEFAULT 20,
  
  -- Processing status
  embedding_status TEXT DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Change detection & scheduling
  content_hash TEXT,
  last_embedded_at TIMESTAMPTZ,
  next_scan_due_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(content_type, slug)
);

-- Supporting indexes
CREATE INDEX idx_embeddings_category ON article_embeddings(category_id);
CREATE INDEX idx_embeddings_role ON article_embeddings(article_role);
CREATE INDEX idx_embeddings_status ON article_embeddings(embedding_status);
CREATE INDEX idx_embeddings_inbound ON article_embeddings(inbound_count);
CREATE INDEX idx_embeddings_hash ON article_embeddings(content_hash);
CREATE INDEX idx_embeddings_scan_due ON article_embeddings(next_scan_due_at) 
  WHERE next_scan_due_at IS NOT NULL;
CREATE INDEX idx_embeddings_content_id ON article_embeddings(content_id) 
  WHERE content_id IS NOT NULL;

-- Enable RLS
ALTER TABLE article_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage embeddings" ON article_embeddings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access embeddings" ON article_embeddings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add self-referential FK after table exists
ALTER TABLE article_embeddings 
  ADD CONSTRAINT fk_parent_pillar 
  FOREIGN KEY (parent_pillar_id) REFERENCES article_embeddings(id);

-- Step 3: Create canonical_anchors table
CREATE TABLE public.canonical_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  anchor_phrase TEXT NOT NULL,
  anchor_normalized TEXT NOT NULL,
  canonical_target_id UUID NOT NULL REFERENCES article_embeddings(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(anchor_normalized, category_id)
);

CREATE INDEX idx_canonical_lookup ON canonical_anchors(anchor_normalized, category_id);

ALTER TABLE canonical_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage anchors" ON canonical_anchors
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access anchors" ON canonical_anchors
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 4: Extend blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS primary_keyword TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[];
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS last_link_scan_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_no_links ON blog_posts(id) 
  WHERE status = 'published' AND last_link_scan_at IS NULL;

-- Step 5: Extend link_suggestions table
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS semantic_score FLOAT;
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS keyword_overlap_score FLOAT;
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS hierarchy_valid BOOLEAN DEFAULT true;
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS hierarchy_violation TEXT;
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS anchor_source TEXT 
  CHECK (anchor_source IS NULL OR anchor_source IN ('primary_keyword', 'secondary_keyword', 'contextual', 'ai_suggested', 'mandatory'));
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS target_embedding_id UUID REFERENCES article_embeddings(id);

CREATE INDEX IF NOT EXISTS idx_suggestions_semantic ON link_suggestions(semantic_score DESC NULLS LAST);

-- Step 6: Create database functions

-- Keyword overlap score (Jaccard similarity)
CREATE OR REPLACE FUNCTION calculate_keyword_overlap(
  keywords_a TEXT[],
  keywords_b TEXT[]
)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  intersection_size INT;
  union_size INT;
BEGIN
  IF keywords_a IS NULL OR keywords_b IS NULL OR 
     array_length(keywords_a, 1) IS NULL OR array_length(keywords_b, 1) IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO intersection_size
  FROM unnest(keywords_a) a
  WHERE a = ANY(keywords_b);
  
  union_size := array_length(keywords_a, 1) + array_length(keywords_b, 1) - intersection_size;
  
  IF union_size = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN intersection_size::FLOAT / union_size::FLOAT;
END;
$$;

-- Semantic similarity search with hierarchy validation
CREATE OR REPLACE FUNCTION match_semantic_links(
  query_embedding vector(1536),
  source_category TEXT,
  source_role TEXT,
  similarity_threshold FLOAT DEFAULT 0.75,
  max_results INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  slug TEXT,
  title TEXT,
  category_id TEXT,
  subcategory_slug TEXT,
  article_role TEXT,
  primary_keyword TEXT,
  secondary_keywords TEXT[],
  inbound_count INTEGER,
  max_inbound INTEGER,
  similarity FLOAT,
  hierarchy_valid BOOLEAN,
  hierarchy_note TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.content_type,
    ae.slug,
    ae.title,
    ae.category_id,
    ae.subcategory_slug,
    ae.article_role,
    ae.primary_keyword,
    ae.secondary_keywords,
    ae.inbound_count,
    ae.max_inbound,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    CASE
      WHEN source_role = 'cluster' THEN
        ae.article_role IN ('pillar', 'super-pillar') 
        OR (ae.article_role = 'cluster' AND ae.category_id = source_category)
      WHEN source_role = 'pillar' THEN true
      WHEN source_role = 'super-pillar' THEN true
      ELSE true
    END AS hierarchy_valid,
    CASE
      WHEN source_role = 'cluster' AND ae.article_role = 'cluster' AND ae.category_id != source_category 
        THEN 'Cross-category cluster link not recommended'
      ELSE NULL
    END AS hierarchy_note
  FROM article_embeddings ae
  WHERE 
    ae.embedding IS NOT NULL
    AND ae.embedding_status = 'completed'
    AND 1 - (ae.embedding <=> query_embedding) > similarity_threshold
    AND ae.inbound_count < ae.max_inbound
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- Orphan detection function
CREATE OR REPLACE FUNCTION get_orphan_articles(category_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  category_slug TEXT,
  published_at TIMESTAMPTZ,
  inbound_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.category_slug,
    bp.published_at,
    COALESCE(ae.inbound_count, 0)::BIGINT AS inbound_count
  FROM blog_posts bp
  LEFT JOIN article_embeddings ae ON ae.content_id = bp.id
  WHERE 
    bp.status = 'published'
    AND (category_filter IS NULL OR bp.category_slug = category_filter)
    AND COALESCE(ae.inbound_count, 0) = 0
  ORDER BY bp.published_at DESC;
END;
$$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_article_embeddings_updated_at
  BEFORE UPDATE ON article_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_embeddings_updated_at();