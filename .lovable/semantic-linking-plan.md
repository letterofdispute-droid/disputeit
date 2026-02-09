# Semantic Internal Linking Architecture - Final Implementation Plan

**Version:** 2.1 (Implementation Complete)  
**Status:** ✅ FULLY IMPLEMENTED  
**Created:** 2026-02-08  
**Completed:** 2026-02-09

---

## Implementation Summary

All phases have been implemented:

### ✅ Phase 1: Database Foundation
- `embedding_queue` table with automatic publish trigger
- `queue_embedding_on_publish()` function fires on status change to 'published'
- Content hash tracking for change detection

### ✅ Phase 2: Queue Processing
- `process-embedding-queue` edge function processes queued items
- Automatic embedding generation with bidirectional link discovery
- Creates both outbound AND inbound link suggestions

### ✅ Phase 3: Bidirectional Scanning  
- `scan-for-semantic-links` updated with reverse scanning
- New articles discover which existing articles should link TO them
- `cosineSimilarity()` helper for JavaScript-side vector comparison

### ✅ Phase 4: Maintenance System
- `semantic-maintenance` edge function for weekly cleanup
- Orphan article detection via `get_orphan_articles()` RPC
- Stale content rescan based on `next_scan_due_at`

### ✅ Phase 5: Admin UI Enhancements
- Orphan article alerts in SemanticScanPanel
- Embedding queue status display
- "Process Now" and "Maintenance" buttons
- Bidirectional scan with both outbound/inbound results

---

## Original Plan Below (Reference)

---

## Executive Summary

This plan implements a **semantic understanding-based internal linking system** capable of handling 5,000+ articles. It uses vector embeddings for true topical understanding, enforces pillar-cluster hierarchy, and optimizes anchor text using primary keywords.

### Key Improvements Over Original Plan

1. **Smart Content Extraction** - Uses H2 headings + key paragraphs + keywords (not just first 1000 chars)
2. **Keyword Transfer Pipeline** - Moves `suggested_keywords` from `content_queue` to `blog_posts`
3. **Guide Integration** - Seeds 13 Consumer Rights Guides into embedding index as super-pillars
4. **Template URL Fix** - Correct hierarchical routing for template links
5. **Canonical Anchor Detection** - Prevents multiple targets competing for same anchor
6. **Hybrid Matching** - Embeddings + keyword overlap fallback
7. **Content Change Detection** - `content_hash` triggers re-embedding
8. **Outbound Link Tracking** - Balanced link equity distribution
9. **Orphan Detection** - Pre-publish gate for zero-link articles
10. **Explicit Pillar Assignment** - Resolves conflicts when multiple pillars exist

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEMANTIC LINKING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   CONTENT       │    │   EMBEDDING     │    │   SIMILARITY    │         │
│  │   EXTRACTION    │ -> │   GENERATION    │ -> │   SEARCH        │         │
│  │                 │    │                 │    │                 │         │
│  │ - Title         │    │ - OpenAI API    │    │ - pgvector      │         │
│  │ - H2/H3 headings│    │ - 1536 dims     │    │ - Cosine dist   │         │
│  │ - Key paragraphs│    │ - Batch 50      │    │ - IVFFlat index │         │
│  │ - Keywords      │    │ - Self-invoke   │    │ - <100ms query  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                        │                    │
│                                                        ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   HIERARCHY     │ <- │   ANCHOR        │ <- │   LINK          │         │
│  │   VALIDATION    │    │   SELECTION     │    │   SUGGESTIONS   │         │
│  │                 │    │                 │    │                 │         │
│  │ - Tier rules    │    │ - Primary KW    │    │ - Score ≥0.75   │         │
│  │ - Mandatory up  │    │ - Secondary KW  │    │ - Max 10/article│         │
│  │ - Sibling ok    │    │ - AI contextual │    │ - Deduplication │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Content Hierarchy (4 Tiers)

| Tier | Type | Example URL | Role | Link Direction |
|------|------|-------------|------|----------------|
| 0 | **Super-Pillar** (Guides) | `/guides/insurance` | Ultimate authority | Receives from all below |
| 1 | **Template** (Conversion) | `/templates/insurance/auto/denied-claim-appeal` | Transaction page | Receives from clusters |
| 2 | **Pillar Article** | `/articles/how-to-appeal-car-insurance-denial` | Hub content | Up to guides, down to clusters |
| 3 | **Cluster Article** | `/articles/5-mistakes-when-filing-insurance-claim` | Supporting content | Up to pillars, across to siblings |

### Article Role Classification

| Article Type | Role | Rationale |
|--------------|------|-----------|
| `how-to` | Pillar | Comprehensive, actionable guides |
| `rights` | Pillar | Authoritative legal explanations |
| `sample` | Pillar | Template-adjacent, high value |
| `mistakes` | Cluster | Supporting, links to how-to |
| `faq` | Cluster | Answers questions, links up |
| `case-study` | Cluster | Examples, links to rights |
| `comparison` | Cluster | Decision support, links across |
| `checklist` | Cluster | Quick reference, links to how-to |

---

## Smart Content Extraction for Embeddings

Instead of just taking the first 1000 characters, we extract **semantic signals**:

```typescript
interface EmbeddingInput {
  title: string;           // Full title
  excerpt: string;         // Summary paragraph
  headings: string[];      // All H2 and H3 headings (structure)
  keyParagraphs: string[]; // First 3 paragraphs after each H2
  keywords: string[];      // From content_queue.suggested_keywords
  categoryContext: string; // Category name + description
}

function buildEmbeddingText(input: EmbeddingInput): string {
  return [
    `Title: ${input.title}`,
    `Summary: ${input.excerpt}`,
    `Structure: ${input.headings.join(', ')}`,
    `Content: ${input.keyParagraphs.join(' ')}`,
    `Keywords: ${input.keywords.join(', ')}`,
    `Category: ${input.categoryContext}`,
  ].join('\n').slice(0, 8000); // text-embedding-3-small limit
}

// Extraction helpers
function extractHeadings(html: string): string[] {
  const matches = html.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  return matches.map(m => m.replace(/<[^>]+>/g, '').trim());
}

function extractKeyParagraphs(html: string, count: number = 3): string[] {
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  return paragraphs
    .slice(0, count * 3) // Get more, filter short ones
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 100)
    .slice(0, count);
}
```

### Why This Is Better

| Old Approach | New Approach |
|--------------|--------------|
| First 1000 chars (often intro fluff) | Headings capture full article structure |
| Misses middle/end content | Key paragraphs from throughout |
| No keyword context | Keywords explicitly included |
| Category guessed | Category context injected |

---

## Database Schema

### Prerequisites: Enable pgvector

```sql
-- Step 1: Enable pgvector extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS vector;
```

### New Table: `article_embeddings`

**IMPORTANT NOTES:**
1. **pgvector Extension**: Must verify availability in Lovable Cloud. If unavailable, will use Edge Function-based cosine similarity with stored FLOAT[] arrays instead.
2. **IVFFlat Index**: Created AFTER initial data load (not on empty table).
3. **Rollback Strategy**: Uses `embedding_status` to track progress and enable resume.

```sql
-- STEP 1: Enable pgvector (run separately, may need Supabase dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 2: Create table (without vector index initially)
CREATE TABLE public.article_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'template', 'guide')),
  content_id UUID,                    -- FK to blog_posts.id (NULL for templates/guides)
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  subcategory_slug TEXT,              -- Required for template URL generation
  
  -- Semantic vector (OpenAI text-embedding-3-small = 1536 dimensions)
  -- If pgvector unavailable, use: embedding_array FLOAT[] with 1536 elements
  embedding vector(1536),
  
  -- Extracted metadata
  topic_summary TEXT,                 -- AI-generated 50-word summary
  headings_text TEXT,                 -- Concatenated H2/H3s for fallback
  
  -- Keywords (transferred from content_queue or defined)
  primary_keyword TEXT,               -- Main anchor text target
  secondary_keywords TEXT[],          -- Fallback anchors
  anchor_variants TEXT[],             -- Rotated anchor text options (SEO)
  
  -- Hierarchy
  article_type TEXT,                  -- Original type: how-to, faq, etc.
  article_role TEXT NOT NULL DEFAULT 'cluster' 
    CHECK (article_role IN ('super-pillar', 'pillar', 'cluster')),
  parent_pillar_id UUID,              -- FK added after table exists (avoid circular ref)
  related_categories TEXT[],          -- Allow controlled cross-category linking
  
  -- Link equity tracking
  inbound_count INTEGER DEFAULT 0,
  outbound_count INTEGER DEFAULT 0,
  max_inbound INTEGER DEFAULT 20,     -- Configurable per tier
  
  -- Processing status (for resume capability)
  embedding_status TEXT DEFAULT 'pending' 
    CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Change detection & scheduling
  content_hash TEXT,                  -- MD5 of content for change detection
  last_embedded_at TIMESTAMPTZ,
  next_scan_due_at TIMESTAMPTZ,       -- For periodic re-scan (link decay prevention)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(content_type, slug)
);

-- Supporting indexes (created immediately)
CREATE INDEX idx_embeddings_category ON article_embeddings(category_id);
CREATE INDEX idx_embeddings_role ON article_embeddings(article_role);
CREATE INDEX idx_embeddings_status ON article_embeddings(embedding_status);
CREATE INDEX idx_embeddings_inbound ON article_embeddings(inbound_count);
CREATE INDEX idx_embeddings_hash ON article_embeddings(content_hash);
CREATE INDEX idx_embeddings_scan_due ON article_embeddings(next_scan_due_at) 
  WHERE next_scan_due_at IS NOT NULL;

-- Enable RLS
ALTER TABLE article_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage embeddings" ON article_embeddings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access" ON article_embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- STEP 3: Add FK after table exists (avoids circular reference issue)
ALTER TABLE article_embeddings 
  ADD CONSTRAINT fk_parent_pillar 
  FOREIGN KEY (parent_pillar_id) REFERENCES article_embeddings(id);

-- STEP 4: Create vector index AFTER data is loaded (separate migration)
-- Run this AFTER embedding bootstrap completes:
-- CREATE INDEX idx_embeddings_vector ON article_embeddings 
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### New Table: `canonical_anchors`

Prevents anchor collision (multiple targets competing for same phrase):

```sql
CREATE TABLE public.canonical_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  anchor_phrase TEXT NOT NULL,                    -- The keyword/phrase
  anchor_normalized TEXT NOT NULL,                -- Lowercase, trimmed
  canonical_target_id UUID NOT NULL REFERENCES article_embeddings(id),
  category_id TEXT NOT NULL,                      -- Scope to category
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only one target per phrase per category
  UNIQUE(anchor_normalized, category_id)
);

CREATE INDEX idx_canonical_lookup ON canonical_anchors(anchor_normalized, category_id);

ALTER TABLE canonical_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage anchors" ON canonical_anchors
  FOR ALL USING (is_admin(auth.uid()));
```

### Extend `blog_posts` Table

```sql
-- Add keyword storage (transferred from content_queue)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
  primary_keyword TEXT,
  secondary_keywords TEXT[],
  content_hash TEXT,
  last_link_scan_at TIMESTAMPTZ;

-- Index for orphan detection
CREATE INDEX idx_posts_no_links ON blog_posts(id) 
  WHERE status = 'published' AND last_link_scan_at IS NULL;
```

### Extend `link_suggestions` Table

```sql
ALTER TABLE link_suggestions ADD COLUMN IF NOT EXISTS
  semantic_score FLOAT,                          -- Cosine similarity (0-1)
  keyword_overlap_score FLOAT,                   -- Jaccard similarity of keywords
  combined_score FLOAT GENERATED ALWAYS AS 
    (COALESCE(semantic_score, 0) * 0.7 + COALESCE(keyword_overlap_score, 0) * 0.3) STORED,
  hierarchy_valid BOOLEAN DEFAULT true,
  hierarchy_violation TEXT,                      -- Reason if invalid
  anchor_source TEXT CHECK (anchor_source IN ('primary_keyword', 'secondary_keyword', 'contextual', 'ai_suggested', 'mandatory')),
  target_embedding_id UUID REFERENCES article_embeddings(id);

CREATE INDEX idx_suggestions_combined ON link_suggestions(combined_score DESC);
```

---

## Database Functions

### Similarity Search with Hierarchy

```sql
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
    ae.article_role,
    ae.primary_keyword,
    ae.secondary_keywords,
    ae.inbound_count,
    ae.max_inbound,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    -- Hierarchy validation
    CASE
      -- Clusters MUST link up (to pillars/guides) or across (to siblings in same category)
      WHEN source_role = 'cluster' THEN
        ae.article_role IN ('pillar', 'super-pillar') 
        OR (ae.article_role = 'cluster' AND ae.category_id = source_category)
      -- Pillars can link anywhere
      WHEN source_role = 'pillar' THEN true
      -- Super-pillars link down
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
    AND 1 - (ae.embedding <=> query_embedding) > similarity_threshold
    AND ae.inbound_count < ae.max_inbound  -- Don't over-link
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;
```

### Keyword Overlap Score

```sql
CREATE OR REPLACE FUNCTION calculate_keyword_overlap(
  keywords_a TEXT[],
  keywords_b TEXT[]
)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  intersection_size INT;
  union_size INT;
BEGIN
  IF keywords_a IS NULL OR keywords_b IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Jaccard similarity
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
```

### Orphan Detection

```sql
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
```

---

## Edge Functions

### 1. `generate-embeddings` (NEW)

Generates vector embeddings with smart content extraction.

**File:** `supabase/functions/generate-embeddings/index.ts`

```typescript
// Key logic (pseudocode)
async function processArticle(article: BlogPost) {
  // 1. Smart content extraction
  const headings = extractHeadings(article.content);
  const keyParagraphs = extractKeyParagraphs(article.content, 3);
  const keywords = article.primary_keyword 
    ? [article.primary_keyword, ...(article.secondary_keywords || [])]
    : [];
  
  const embeddingText = buildEmbeddingText({
    title: article.title,
    excerpt: article.excerpt || '',
    headings,
    keyParagraphs,
    keywords,
    categoryContext: `${getCategoryName(article.category_slug)}: ${getCategoryDescription(article.category_slug)}`,
  });
  
  // 2. Generate embedding via OpenAI
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: embeddingText,
  });
  
  // 3. Classify role
  const role = classifyArticleRole(article.article_type);
  
  // 4. Calculate content hash for change detection
  const contentHash = await crypto.subtle.digest(
    'MD5', 
    new TextEncoder().encode(article.content)
  );
  
  // 5. Upsert embedding
  await supabaseAdmin.from('article_embeddings').upsert({
    content_type: 'article',
    content_id: article.id,
    slug: article.slug,
    title: article.title,
    category_id: article.category_slug,
    embedding: embedding.data[0].embedding,
    headings_text: headings.join(' | '),
    primary_keyword: article.primary_keyword,
    secondary_keywords: article.secondary_keywords,
    article_role: role,
    content_hash: contentHash,
    last_embedded_at: new Date().toISOString(),
  }, { onConflict: 'content_type,slug' });
}
```

**Processing Strategy:**
- Batch size: 50 articles
- Self-invocation for scale (same pattern as `bulk-plan-category`)
- Incremental: Only process where `content_hash` changed or `embedding IS NULL`
- Rate limit: 500ms delay between batches

### 2. `seed-static-embeddings` (NEW)

Seeds templates and guides into embedding index (one-time + on deploy).

```typescript
// Seeds 13 guides from consumerRightsContent.ts
// Seeds 500+ templates from allTemplates.ts
// These don't change often, so run on deploy or manually
```

### 3. `scan-for-links-semantic` (REPLACES `scan-for-links`)

Uses vector similarity + hierarchy rules + keyword-based anchors.

**Key Algorithm:**

```typescript
async function findSemanticLinks(sourceEmbedding: ArticleEmbedding) {
  const suggestions: LinkSuggestion[] = [];
  
  // 1. Query similar content via pgvector
  const similar = await supabase.rpc('match_semantic_links', {
    query_embedding: sourceEmbedding.embedding,
    source_category: sourceEmbedding.category_id,
    source_role: sourceEmbedding.article_role,
    similarity_threshold: 0.75,
    max_results: 30,
  });
  
  // 2. Calculate keyword overlap for hybrid scoring
  for (const match of similar) {
    const keywordScore = calculateKeywordOverlap(
      sourceEmbedding.secondary_keywords || [],
      match.secondary_keywords || []
    );
    
    // 3. Determine anchor text (priority order)
    let anchorText: string;
    let anchorSource: string;
    
    if (match.primary_keyword && contentContains(sourceEmbedding.content, match.primary_keyword)) {
      anchorText = match.primary_keyword;
      anchorSource = 'primary_keyword';
    } else if (match.secondary_keywords?.some(kw => contentContains(sourceEmbedding.content, kw))) {
      anchorText = match.secondary_keywords.find(kw => contentContains(sourceEmbedding.content, kw))!;
      anchorSource = 'secondary_keyword';
    } else {
      anchorText = await findContextualAnchor(sourceEmbedding.content, match);
      anchorSource = 'contextual';
    }
    
    // 4. Check canonical anchor (prevent collision)
    const isCanonical = await checkCanonicalAnchor(anchorText, match.id, sourceEmbedding.category_id);
    if (!isCanonical) continue;
    
    suggestions.push({
      source_post_id: sourceEmbedding.content_id,
      target_embedding_id: match.id,
      target_type: match.content_type,
      target_slug: match.slug,
      target_title: match.title,
      anchor_text: anchorText,
      semantic_score: match.similarity,
      keyword_overlap_score: keywordScore,
      hierarchy_valid: match.hierarchy_valid,
      hierarchy_violation: match.hierarchy_note,
      anchor_source: anchorSource,
    });
  }
  
  // 5. Add mandatory links (guide for every cluster)
  if (sourceEmbedding.article_role === 'cluster') {
    const guide = await getGuideForCategory(sourceEmbedding.category_id);
    if (guide && !suggestions.find(s => s.target_slug === guide.slug)) {
      suggestions.unshift({
        ...guide,
        semantic_score: 1.0,
        hierarchy_valid: true,
        anchor_source: 'mandatory',
      });
    }
  }
  
  return suggestions.slice(0, 10); // Max 10 per article
}
```

### 4. `transfer-keywords` (NEW - One-time migration)

Transfers `suggested_keywords` from `content_queue` to `blog_posts`.

```sql
-- Run as migration after schema update
UPDATE blog_posts bp
SET 
  primary_keyword = cq.suggested_keywords[1],
  secondary_keywords = cq.suggested_keywords[2:5]
FROM content_queue cq
WHERE cq.blog_post_id = bp.id
  AND cq.suggested_keywords IS NOT NULL
  AND array_length(cq.suggested_keywords, 1) > 0;
```

---

## Link Equity Rules

### Inbound Limits by Tier

| Tier | Content Type | Max Inbound | Rationale |
|------|--------------|-------------|-----------|
| 0 | Guides (super-pillar) | Unlimited | Authority pages, welcome all links |
| 1 | Templates | 25 | Conversion pages, balanced |
| 2 | Pillar articles | 30 | Hub pages need many links |
| 3 | Cluster articles | 15 | Supporting, fewer needed |

### Mandatory Links (Always Suggest)

1. **Every cluster article** → its category guide (`/guides/:categoryId`)
2. **Every cluster article** → most relevant template (from `related_templates[]`)
3. **Every pillar article** → category guide

### Anchor Text Priority

1. **Primary Keyword** - Target's `primary_keyword` if found in source content
2. **Secondary Keyword** - First matching `secondary_keyword` found
3. **Contextual Match** - AI finds natural phrase that relates to target topic
4. **Title Fragment** - Last resort, use part of target title

---

## Hybrid Matching Strategy

Combines semantic similarity with keyword overlap for more robust matching:

```
combined_score = (semantic_score × 0.7) + (keyword_overlap × 0.3)
```

**Why Hybrid?**
- Embeddings catch topical similarity even with different words
- Keyword overlap ensures actual term relevance
- Fallback when embeddings miss edge cases

---

## Processing Pipeline

### Phase 1: Schema & Extensions (Day 1)
1. Enable pgvector extension
2. Create `article_embeddings` table
3. Create `canonical_anchors` table
4. Extend `blog_posts` with keyword columns
5. Extend `link_suggestions` with scoring columns
6. Create database functions

### Phase 2: Keyword Transfer (Day 1)
1. Run migration to transfer keywords from `content_queue` to `blog_posts`
2. Update article generation to save keywords to both tables

### Phase 3: Static Content Seeding (Day 2)
1. Create `seed-static-embeddings` function
2. Seed 13 guides as super-pillars
3. Seed 500+ templates with category/subcategory context

### Phase 4: Article Embedding Generation (Day 2-3)
1. Create `generate-embeddings` function
2. Implement smart content extraction
3. Process existing articles in batches of 50
4. ~100 batches for 5,000 articles (~50 min)

### Phase 5: Semantic Scanning (Day 4)
1. Create `scan-for-links-semantic` function
2. Implement hierarchy validation
3. Implement anchor selection logic
4. Implement canonical anchor checking

### Phase 6: UI Integration (Day 5)
1. Update `LinkSuggestions` component with new scores
2. Add hierarchy validation display
3. Add "Link Health" dashboard
4. Add orphan detection panel

### Phase 7: Testing & Bootstrap (Day 6-7)
1. Test on E-commerce category (smallest, fastest)
2. Validate hierarchy rules
3. Run full bootstrap
4. Monitor performance

---

## Cost Analysis

### OpenAI Embedding API

```
Model: text-embedding-3-small
Price: $0.02 per 1M tokens

Per article: ~1,500 tokens (with smart extraction)
5,000 articles: 7.5M tokens
One-time cost: $0.15

Incremental (50 new articles/day): ~$0.002/day
```

### Database Storage

```
Vector: 1536 dims × 4 bytes = 6KB per row
5,000 articles + 500 templates + 13 guides ≈ 5,500 rows
Total: ~33MB vectors + ~12MB index ≈ 45MB

Well within Supabase limits.
```

### Query Performance

```
Similarity search with IVFFlat (100 lists):
- 5,000 vectors: <50ms
- 10,000 vectors: <100ms
- 50,000 vectors: <200ms

Much faster than current AI-per-article scanning.
```

---

## Potential Issues & Mitigations

| Issue | Risk | Mitigation |
|-------|------|------------|
| **pgvector not available** | High | Check extension first; if unavailable, store embeddings as FLOAT[] and compute cosine similarity in Edge Function |
| **IVFFlat on empty table** | High | Create vector index AFTER bootstrap completes, not during table creation |
| **OpenAI API rate limits** | Medium | Batch with 500ms delay; retry with exponential backoff; use `embedding_status` for resume |
| **Anchor collision** | Medium | Canonical anchors table prevents same phrase linking to multiple targets |
| **Anchor text repetition (SEO)** | Medium | Store `anchor_variants[]` and rotate through them |
| **Pillar conflicts** | Medium | Explicit `parent_pillar_id` assignment per category |
| **Content changes** | Low | `content_hash` triggers re-embedding automatically |
| **Orphan articles** | Low | Pre-publish check; Link Health dashboard |
| **Link decay** | Low | `next_scan_due_at` triggers periodic re-scans (30 days) |
| **Template URL generation** | Medium | Store `subcategory_slug` in embeddings; update apply-links-bulk to build hierarchical URLs |
| **Cross-category linking** | Low | `related_categories[]` allows controlled exceptions to hierarchy rules |

---

## Success Metrics

1. **Coverage**: 100% of published articles have embeddings
2. **Relevance**: Average semantic score of accepted links ≥ 0.80
3. **Hierarchy Compliance**: 0% hierarchy violations in applied links
4. **Link Equity**: No article with >30 inbound, no published article with 0 inbound
5. **Performance**: Scan completes in <2 hours for full site
6. **Anchor Quality**: >60% of anchors use primary/secondary keywords

---

## Files to Create/Modify

### New Files
- `supabase/functions/generate-embeddings/index.ts`
- `supabase/functions/seed-static-embeddings/index.ts`
- `supabase/functions/scan-for-links-semantic/index.ts`
- `src/hooks/useArticleEmbeddings.ts`
- `src/components/admin/seo/LinkHealthDashboard.tsx`

### Modified Files
- `supabase/functions/bulk-generate-articles/index.ts` - Save keywords to blog_posts
- `src/components/admin/seo/LinkSuggestions.tsx` - Show semantic scores
- `src/components/admin/seo/links/LinkCard.tsx` - Show hierarchy status
- `src/pages/admin/SEODashboard.tsx` - Add Link Health tab

---

## Approval Checklist

- [x] Smart content extraction (headings + paragraphs + keywords)
- [x] Keyword transfer pipeline (content_queue → blog_posts)
- [x] Guide integration as super-pillars
- [x] Template URL fix for hierarchical routing (`category_id/subcategory_slug/slug`)
- [x] Canonical anchor collision detection
- [x] Hybrid embedding/keyword matching
- [x] Content hash for change detection
- [x] Outbound link counting
- [x] Orphan detection pre-publish
- [x] Explicit pillar assignment
- [x] pgvector verification step (with FLOAT[] fallback)
- [x] Cost analysis included
- [x] Performance estimates included
- [x] Implementation phases defined

### Additional Fixes (v2.1)
- [x] IVFFlat index created AFTER data load (not on empty table)
- [x] `embedding_status` for resume capability
- [x] `article_type` column preserved for debugging
- [x] `anchor_variants[]` for SEO-safe anchor rotation
- [x] `next_scan_due_at` for link decay prevention
- [x] `related_categories[]` for controlled cross-category linking
- [x] Circular FK issue resolved (add constraint after table exists)
- [x] Template URL generation uses `category_id + subcategory_slug`

---

**Ready for Implementation**

Proceed with Phase 1 (Database Schema)?
