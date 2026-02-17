

# Show Targeted Keywords with Occurrence Counts

## Overview
Add a "Keywords" column to both the Blog Posts admin list and the Content Queue table, showing which keywords were targeted for each article. For published/generated articles, display how many times each keyword actually appears in the content.

## Changes

### 1. New Database Column: `keyword_counts` on `blog_posts`
Add a `jsonb` column to store pre-computed keyword occurrence counts (e.g., `{"defective product": 5, "product liability": 3}`). Computing this at generation time avoids fetching full article content in the list view.

### 2. Update `bulk-generate-articles` Edge Function
After generating article content, count occurrences of each targeted keyword (primary + secondary) in the generated HTML (case-insensitive) and save the result to the new `keyword_counts` column when inserting the blog post.

### 3. Update `generate-blog-content` Edge Function
Same logic for single-article generation -- count keyword occurrences and include in response so the blog editor can store them.

### 4. Update Blog Posts Admin List (`AdminBlog.tsx`)
- Add `primary_keyword`, `secondary_keywords`, `keyword_counts` to the SELECT query
- Add a "Keywords" column after "Category" showing small badges like: `defective product (5)`, `product liability (3)`
- Primary keyword highlighted with a distinct badge color

### 5. Update Queue Table (`QueueTable.tsx`)
- The `content_queue` table already has `primary_keyword` and `secondary_keywords`
- Add a "Keywords" column showing these as small tags
- No counts here since content hasn't been generated yet (or show counts if `status === 'generated'` by joining blog_posts)

### 6. Backfill Existing Posts (One-Time)
Create a small SQL function or edge function call to backfill `keyword_counts` for already-published posts that have `primary_keyword` set. This scans each post's content and counts occurrences.

## Technical Details

**Database migration:**
```sql
ALTER TABLE blog_posts ADD COLUMN keyword_counts jsonb DEFAULT NULL;
```

**Keyword counting logic (in edge functions):**
```typescript
function countKeywords(content: string, keywords: string[]): Record<string, number> {
  const text = content.toLowerCase().replace(/<[^>]+>/g, ' ');
  const counts: Record<string, number> = {};
  for (const kw of keywords) {
    if (!kw) continue;
    const regex = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    counts[kw] = matches ? matches.length : 0;
  }
  return counts;
}
```

**UI display in table (compact badges):**
- Primary keyword: accent-colored badge with count, e.g., `defective product (5)`
- Secondary keywords: muted outline badges with counts
- Truncate to show max 3 keywords inline, with a "+N more" tooltip for the rest

## Files Changed
- Database migration (new `keyword_counts` column)
- `supabase/functions/bulk-generate-articles/index.ts` -- compute and store counts
- `supabase/functions/generate-blog-content/index.ts` -- include counts in response
- `src/pages/admin/AdminBlog.tsx` -- add Keywords column with badges
- `src/components/admin/seo/queue/QueueTable.tsx` -- add Keywords column
- `src/hooks/useContentQueue.ts` -- include keyword fields in queue query

