

# Emergency Fix: Stop Destroying Valid Links

## Root Cause

The `fix-broken-links` edge function has a critical bug on **line 106-109**:

```javascript
const { data: allArticles } = await supabase
  .from('blog_posts')
  .select('slug, category_slug')
  .eq('status', 'published');
```

This query hits the **1,000-row default limit**. The function only loads 1,000 of 5,780 published article slugs into its lookup map. Pattern 10 then validates every internal link against this incomplete map and **strips links to the missing 4,780 articles as "orphans."**

### Real numbers
- Actual orphan links (pointing to non-existent articles): **228 across 50 posts**
- Links the scanner is destroying (valid articles missing from lookup): **~16,000**
- That means **98.6% of "stripped" links were perfectly valid**

## Plan

### 1. Fix the query limit bug (critical)

Paginate the slug lookup query to load ALL 5,780 articles:

```javascript
// Load ALL published slugs in batches of 1000
let allArticles: Array<{slug: string, category_slug: string}> = [];
let from = 0;
const PAGE = 1000;
while (true) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, category_slug')
    .eq('status', 'published')
    .range(from, from + PAGE - 1);
  if (error) throw error;
  if (!data || data.length === 0) break;
  allArticles = allArticles.concat(data);
  if (data.length < PAGE) break;
  from += PAGE;
}
```

### 2. Replace stripping with smart replacement

Instead of stripping orphan links, use the existing semantic embeddings (all 5,780 articles are embedded) to find a **replacement article** in the same category:

- For each orphan slug, look up the source article's category
- Query `article_embeddings` for the closest match in that category  
- Replace the orphan link with the best real match (keeping the original anchor text)
- Only strip if no semantic match exists (very rare edge case)

### 3. Add a "scan-only" dry run mode  

Before fixing, show users what WILL happen:
- How many links will be **rewritten** (pattern fixes)
- How many will be **replaced** (orphan to real article via semantic match)  
- How many will be **stripped** (truly unfixable, should be near zero)

### 4. Reverse the damage already done

The scan was at 17% (1000 of 5780 posts). We need to check if any posts were already updated with stripped content. If so, we cannot undo that damage from code alone -- but since the scanner only processed 1000 posts in "fix" mode and the screenshot shows 0 rewritten + 4826 stripped, it appears the scan may still be running. We should:

- Immediately stop the current scan (it's batched, so it will stop between batches)
- Check how many posts were actually modified

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/fix-broken-links/index.ts` | Fix 1000-row limit bug with paginated loading; add semantic replacement for orphans instead of stripping; add dry-run scan mode |
| `src/components/admin/seo/BrokenLinkScanner.tsx` | Add scan-only preview before fixing; show replaced vs stripped counts; add confirmation step |

## Technical Details

### Semantic replacement logic (new)

For each orphan link (`/articles/cat/slug` where slug doesn't exist):

1. Extract the category from the link
2. Query `article_embeddings` for articles in that category
3. Use word overlap between the orphan slug and real article slugs to find the best match (e.g., `loan-holiday-dispute-letter` should match an article about loan holidays)
4. If a match scores above 60% word overlap, replace the href with the real article's path
5. Keep the original anchor text (it's still topically relevant)
6. If no match, strip the tag (expected to affect fewer than 50 links total)

### UI changes

The BrokenLinkScanner will get a two-step flow:
1. **Step 1 -- Scan**: Shows preview of what will happen (rewrite/replace/strip counts)
2. **Step 2 -- Fix**: User confirms, then the fix runs

Stats will show 4 columns: Scanned | Rewritten | Replaced | Stripped

