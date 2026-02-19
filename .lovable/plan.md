
# Fix Orphan Article Count: Complete Solution

## Root Causes Identified

### Problem 1: `apply-links-bulk` doesn't fetch target category
**File**: `supabase/functions/apply-links-bulk/index.ts`, line 431

The join `article_embeddings:target_embedding_id(primary_keyword, secondary_keywords)` does NOT select `category_id`. So line 510 (`targetEmbed?.category_id`) is always `undefined`, and it falls back to the source post's category -- which is wrong for cross-category links.

**Fix**: Add `category_id` to the join select list.

### Problem 2: AI content generator creates short-format links
**File**: `supabase/functions/bulk-generate-articles/index.ts`, line 877

When generating pillar articles, the AI is given cluster article slugs like `[slug: my-article-slug]` but not the full URL path. The AI then creates links as `<a href="/my-article-slug">Title</a>` instead of `/articles/category/slug`. There are **2,832** such short-format links in the database.

**Fix**: Provide the full URL path to the AI instead of bare slugs, and add a post-processing step to fix any remaining bare slug links.

### Problem 3: `reconcile_link_counts` regex only matches `/articles/category/slug`
The reconciliation function misses the 2,832 short-format links when counting inbound links, causing those target articles to show zero inbound and appear as orphans.

**Fix**: Expand the regex to also match short-format links and validate them against known article slugs.

## Implementation Plan

### Step 1: Fix `apply-links-bulk` join (prevents future wrong URLs)

In `supabase/functions/apply-links-bulk/index.ts`, change line 431:
```
article_embeddings:target_embedding_id(primary_keyword, secondary_keywords)
```
to:
```
article_embeddings:target_embedding_id(primary_keyword, secondary_keywords, category_id)
```

### Step 2: Fix pillar article generation (prevents future short links)

In `supabase/functions/bulk-generate-articles/index.ts`, change line 877 to provide full URLs:
```
return `${i + 1}. "${s.suggested_title}" (${s.article_type})${published ? ` [URL: /articles/${plan.category_id}/${published.slug}]` : ''}`;
```

Also add a post-generation content sanitizer that rewrites any bare `<a href="/slug">` links to `/articles/category/slug` format by looking up the slug in `article_embeddings`.

### Step 3: Update `reconcile_link_counts` RPC to handle ALL link formats

New migration to update the database function. The updated function will:

1. Extract links in `/articles/category/slug` format (existing)
2. Extract short-format links (`href="/slug-name"`) and validate them against `article_embeddings.slug` to confirm they are real articles (new)
3. UNION both sets for complete inbound/outbound counting
4. Continue detecting and resetting ghost suggestions

### Step 4: One-time cleanup of existing short-format links

Create a one-off database query (not a permanent feature) that rewrites the 2,832 short-format article links in `blog_posts.content` to the correct `/articles/category/slug` format using data from `article_embeddings`. This will be run via the backend SQL tool.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/apply-links-bulk/index.ts` | Add `category_id` to the embeddings join (line 431) |
| `supabase/functions/bulk-generate-articles/index.ts` | Provide full URLs to AI, add post-generation link sanitizer |
| New migration SQL | Update `reconcile_link_counts()` RPC to match short-format links |
| One-time data fix | Rewrite existing short links to correct format |

### Expected Outcome

After deploying these changes:
- Running "Reconcile Counts" will correctly detect ALL inbound links (both formats), immediately reducing the orphan count
- The one-time cleanup rewrites the 2,832 short links to correct format, so future reconciliation uses one consistent pattern
- Future article generation and link application will always produce `/articles/category/slug` format
- No more ghost links or phantom orphans
