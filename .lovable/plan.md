

# Add Pillar Article Generation + Fix Interlinking Pipeline

## What This Plan Does

Adds pillar article generation to the content system and redesigns the semantic linking UI so you know exactly what to do and in what order.

## Part 1: Add Pillar Articles to Content Plans

Currently each template gets 5-10 cluster articles (how-to, mistakes, FAQ, etc.) but no pillar article. A pillar article is the "hub" that summarizes all clusters for a given template and links to each one.

### How it works:
- When a content plan is generated for a template, a **pillar article** is automatically added as the first item in the queue (priority 200, above all clusters)
- The pillar article's AI prompt will receive the titles and keywords of all cluster articles in the plan, so it knows what to reference and link to
- The pillar article type will be `pillar` (stored in `article_type` column), which the embedding system already recognizes
- The pillar will be a comprehensive 2,000-3,000 word article covering the full topic, with sections that naturally reference each cluster article

### "Create All Pillars" button:
- Add a button to the SEO Dashboard Coverage tab that scans all existing content plans, identifies which ones are missing a pillar article, and bulk-queues pillar generation for all of them
- This handles the ~200+ templates that already have cluster articles but no pillar

### Files to modify:
- `supabase/functions/generate-content-plan/index.ts` -- add pillar article to the queue items
- `supabase/functions/bulk-generate-articles/index.ts` -- when generating a pillar, fetch its sibling cluster articles and pass them as context to the AI prompt
- `src/config/articleTypes.ts` -- add `pillar` article type definition
- `src/components/admin/seo/TemplateCoverageMap.tsx` -- add "Create All Pillars" button

## Part 2: Redesign the Semantic Link Scanner UI

Replace the current confusing button layout with a clear numbered workflow:

```text
+-----------------------------------------------+
| Semantic Link Intelligence                     |
|                                                |
| Step 1: Generate Embeddings                    |
| [Create vector profiles for all articles]      |
| Progress: 1 / 1,843  [Generate All]           |
|                                                |
| Step 2: Discover Links                         |
| [Find linking opportunities between articles]  |
| 0 suggestions found  [Scan Now]               |
|                                                |
| Step 3: Review + Apply                         |
| [Approve suggestions, then insert links]       |
| 0 pending  [Go to Link Review]                |
|                                                |
| --- Advanced ---                               |
| [Process Queue] [Maintenance] [Reset]          |
+-----------------------------------------------+
```

Each step shows its current status and is disabled until the previous step has data. Tooltips explain what each action does.

### Files to modify:
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- complete UI redesign with numbered steps

## Part 3: Fix the Embedding Queue Backlog

The 1,138 items stuck in the embedding queue were added by the database trigger but never processed. Two fixes:

1. The "Process Now" button currently processes only 10 items at a time. Change it to use the self-chaining pattern (like bulk article generation) so it processes all pending items automatically
2. Add a note in the UI: "These are auto-queued from newly published articles. Click Generate Embeddings instead to process all articles directly."

### Files to modify:
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- clearer queue messaging
- `supabase/functions/process-embedding-queue/index.ts` -- increase batch size, add self-chaining

## Part 4: Pillar-Aware Link Application

When applying links from the semantic scan:
- Cluster articles automatically get a link to their pillar article (if one exists)
- Pillar articles automatically get links to their cluster articles
- Pillar articles get a link to the template page (the conversion point)
- This is handled by adding a post-processing step in `apply-links-bulk` that checks the content plan relationships

### Files to modify:
- `supabase/functions/apply-links-bulk/index.ts` -- add pillar-cluster relationship linking

## Technical Details

### Pillar Article Type Addition (`src/config/articleTypes.ts`)
```typescript
{
  id: 'pillar',
  name: 'Pillar Article',
  purpose: 'Hub page linking all cluster articles for a template',
  displayHint: 'Comprehensive overview that ties together all related articles',
  titleVariations: [
    'The Complete {topic} Guide',
    '{topic}: Everything You Need to Know',
    'Your {topic} Resource Hub',
  ],
  keywordSuffixes: ['complete guide', 'everything', 'comprehensive'],
  priority: 200,
}
```

### Pillar Generation Prompt Strategy
When the bulk article generator encounters a `pillar` type queue item, it will:
1. Query the `content_queue` for all sibling cluster articles under the same `plan_id`
2. Fetch any already-published cluster articles to get their actual titles and slugs
3. Pass these as context to the AI: "This pillar article should reference and link to the following cluster articles: [list]"
4. The AI generates a comprehensive article with natural inline links to each cluster

### Link Hierarchy (unchanged from current code, just now actually used)
- Cluster -> Pillar (always allowed)
- Cluster -> Cluster in same category (allowed)
- Cluster -> Cluster in different category (blocked)
- Pillar -> any article (allowed)
- Super-pillar -> any article (allowed)
- All articles -> Template page (new, added in Part 4)

### Order of Operations for You
1. Run "Generate Embeddings" (processes all 1,843 articles, takes ~20 minutes via OpenAI)
2. Run "Create All Pillars" to queue pillar articles for existing templates
3. Generate the pillar articles (uses bulk article generation)
4. Run "Generate Embeddings" again to embed the new pillars
5. Run "Discover Links" to find all linking opportunities
6. Review and approve suggestions in the Links tab
7. Click "Apply Approved" to insert the links into article HTML

