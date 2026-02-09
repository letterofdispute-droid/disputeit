
# Automatic Embedding & Long-Term Semantic Linking Strategy

## Executive Summary

This plan implements automatic embedding generation upon content publication and establishes a **continuous link discovery system** that connects new content with both existing and future articles, ensuring your SEO internal linking strategy remains effective indefinitely.

---

## Part 1: Automatic Embedding on Publish

### Current Content Publishing Pathways

The system has three main content publishing flows that need embedding hooks:

1. **Manual Admin Editor** (`AdminBlogEditor.tsx`)
   - Direct save/publish from the editor UI
   
2. **Bulk Publish** (`AdminBlog.tsx`)
   - Publishing multiple drafts at once from the blog list
   
3. **AI Article Generation** (`bulk-generate-articles`)
   - Articles created as drafts, then published later

### Implementation Approach

**Option A: Database Trigger (Recommended)**
- Create a Postgres trigger that fires when `blog_posts.status` changes to `'published'`
- Trigger calls a lightweight database function that queues the post for embedding
- Edge function processes the queue asynchronously

**Option B: Edge Function Webhook**
- Modify publish paths to call embedding function directly
- Less reliable (network failures) but simpler to implement

I recommend **Option A** for reliability.

---

## Part 2: Long-Term Linking Strategy Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTINUOUS LINKING LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   NEW ARTICLE PUBLISHED                                                 │
│          │                                                              │
│          ▼                                                              │
│   ┌──────────────────┐                                                  │
│   │ Generate         │ ◄── OpenAI text-embedding-3-small               │
│   │ Embedding        │     (automatic on publish)                       │
│   └────────┬─────────┘                                                  │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐     ┌──────────────────────────┐                │
│   │ Scan for Links   │────►│ Find Similar EXISTING    │                │
│   │ (Outbound)       │     │ Articles to Link TO      │                │
│   └────────┬─────────┘     └──────────────────────────┘                │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────┐     ┌──────────────────────────┐                │
│   │ Reverse Scan     │────►│ Find EXISTING Articles   │                │
│   │ (Inbound)        │     │ That Should Link TO ME   │                │
│   └────────┬─────────┘     └──────────────────────────┘                │
│            │                                                            │
│            ▼                                                            │
│   ┌──────────────────────────────────────────────────┐                 │
│   │        LINK SUGGESTIONS TABLE                    │                 │
│   │   (pending → approved → applied → verified)      │                 │
│   └──────────────────────────────────────────────────┘                 │
│                                                                         │
│   WEEKLY MAINTENANCE                                                    │
│   ├── Re-scan articles with stale embeddings                           │
│   ├── Discover NEW cross-links between old articles                    │
│   └── Detect orphan pages needing inbound links                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Insight: Bidirectional Discovery

When a **new article is published today**, the system will:

1. **Find existing articles it should link TO** (outbound)
2. **Find existing articles that should link TO IT** (inbound - the missing piece)

This ensures that an article published a year ago can receive a link suggestion to a new article published today.

---

## Part 3: Technical Implementation

### Phase 1: Embedding Queue Table
```sql
-- Queue for pending embedding generation
CREATE TABLE embedding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,           -- 'blog_post', 'template'
  content_id UUID NOT NULL,             -- blog_posts.id
  trigger_source TEXT NOT NULL,         -- 'publish', 'update', 'manual'
  priority INTEGER DEFAULT 50,          -- Higher = process first
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient polling
CREATE INDEX idx_embedding_queue_pending ON embedding_queue(created_at) 
WHERE processed_at IS NULL;
```

### Phase 2: Database Trigger on Publish
```sql
CREATE OR REPLACE FUNCTION queue_embedding_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  -- Fire when status changes TO 'published'
  IF NEW.status = 'published' AND 
     (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'publish', 100)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Fire when published content is updated (content_hash changes)
  IF NEW.status = 'published' AND OLD.status = 'published' AND 
     NEW.content_hash IS DISTINCT FROM OLD.content_hash THEN
    INSERT INTO embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'update', 50)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_embedding_on_publish
AFTER INSERT OR UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION queue_embedding_on_publish();
```

### Phase 3: Enhanced Edge Function with Bidirectional Scanning

Update `scan-for-semantic-links` to also perform **reverse scanning**:

```typescript
// After generating embedding for NEW article
// Step 1: Find articles the new article should link TO (existing flow)
const outboundMatches = await findSimilarArticles(newEmbedding);

// Step 2: NEW - Find articles that should link TO the new article
const inboundCandidates = await supabase
  .from('article_embeddings')
  .select('id, content_id, embedding, category_id')
  .eq('embedding_status', 'completed')
  .neq('content_id', newArticle.id);

for (const candidate of inboundCandidates) {
  const similarity = cosineSimilarity(candidate.embedding, newEmbedding);
  if (similarity > threshold) {
    // Create suggestion: candidate → new article
    await createLinkSuggestion({
      source_post_id: candidate.content_id,
      target_slug: newArticle.slug,
      // ...
    });
  }
}
```

### Phase 4: Scheduled Maintenance Cron Job

Create a cron job that runs weekly to:
1. Process the embedding queue
2. Re-scan articles with expired `next_scan_due_at`
3. Identify orphan articles needing inbound links

```sql
-- Scheduled weekly via pg_cron
SELECT cron.schedule(
  'weekly-semantic-maintenance',
  '0 3 * * 0',  -- Sunday at 3 AM
  $$
  SELECT net.http_post(
    url:='https://[project].supabase.co/functions/v1/semantic-maintenance',
    headers:='{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);
```

---

## Part 4: Admin Dashboard Enhancements

### New Features to Add

1. **Orphan Article Alert**
   - Show articles with 0 inbound links
   - Priority indicator for high-value orphans

2. **Link Network Visualization**
   - Graph view showing connections between articles
   - Identify isolated content clusters

3. **Auto-Apply High-Confidence Links**
   - Toggle to automatically apply suggestions with >90% relevance score
   - Reduces manual approval overhead for obvious matches

4. **Content Age Indicator**
   - Flag articles older than 6 months that haven't received new links
   - Prevents content stagnation

---

## Part 5: Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/..._embedding_queue.sql` | Create | Queue table + publish trigger |
| `supabase/functions/process-embedding-queue/index.ts` | Create | Processes queue + bidirectional scan |
| `supabase/functions/semantic-maintenance/index.ts` | Create | Weekly maintenance job |
| `supabase/functions/scan-for-semantic-links/index.ts` | Modify | Add reverse scan logic |
| `src/hooks/useSemanticLinkScan.ts` | Modify | Add orphan detection + stats |
| `src/components/admin/seo/links/SemanticScanPanel.tsx` | Modify | Add orphan alerts + auto-apply toggle |

---

## Part 6: Long-Term Strategy Benefits

1. **Zero Manual Intervention**: New articles automatically enter the linking network
2. **Temporal Bridging**: Old articles get links to new relevant content
3. **Orphan Prevention**: Alerts for isolated content before it hurts SEO
4. **Link Equity Distribution**: Pillar pages naturally accumulate authority
5. **Content Clustering**: Related articles strengthen topical authority

---

## Implementation Order

1. **Create embedding queue table and trigger** - Foundation for automation
2. **Create queue processor function** - Handles async embedding
3. **Add bidirectional scan logic** - The key to connecting past and future content
4. **Create maintenance cron job** - Ongoing health of the link network
5. **Enhance admin UI** - Visibility into the automated system
6. **Test end-to-end** - Verify new published articles trigger full pipeline
