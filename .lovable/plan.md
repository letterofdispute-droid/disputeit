

# Fix Missing Links in Articles + Mobile Layout

## Problem 1: 28,917 "Applied" Links Are Not in Article HTML

Database audit results:
- 1,225 articles have suggestions marked "applied" but contain **zero** `<a>` tags
- Articles that DO have links show only 1 link despite 7-8 "applied" suggestions
- 3 apply jobs are stuck in "processing" with overflow (processed > total), indicating they ran simultaneously and overwrote each other

### Root Cause

The `apply-links-bulk` function has a **race condition**. Multiple apply jobs run in parallel because old jobs never get marked as "completed" (they overflow and stay "processing"). When a new apply job starts, it:
1. Fetches an article's content (which may already have links from a previous batch)
2. Processes suggestions and modifies the content
3. Saves the content back

But a concurrent stuck job can fetch the SAME article's original content and save it without the links from the other job, effectively erasing them.

Additionally, the content save at line 516-520 has **no error handling** -- if the update fails, the suggestion is already marked "applied" and the link is lost forever.

### Fix (in `supabase/functions/apply-links-bulk/index.ts`)

**A. Prevent concurrent apply jobs:**
Before creating a new apply job, check for and cancel any stuck "processing" apply jobs (those older than 10 minutes with overflow).

```typescript
// At the start of the main handler, before creating a new job:
const { data: stuckJobs } = await supabaseAdmin
  .from('semantic_scan_jobs')
  .select('id')
  .eq('category_filter', '__apply_links__')
  .eq('status', 'processing');

for (const stuckJob of (stuckJobs || [])) {
  await supabaseAdmin
    .from('semantic_scan_jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', stuckJob.id);
}
```

**B. Add error handling to content save:**
```typescript
if (updatedContent !== post.content) {
  const { error: updateError } = await supabaseAdmin
    .from('blog_posts')
    .update({ content: updatedContent })
    .eq('id', postId);
  
  if (updateError) {
    console.error(`Failed to save content for ${postId}:`, updateError);
    // Revert applied statuses for this post's suggestions
    for (const s of cappedSuggestions) {
      await supabaseAdmin
        .from('link_suggestions')
        .update({ status: 'approved' }) // back to approved for retry
        .eq('id', s.id)
        .eq('status', 'applied');
    }
  }
}
```

**C. Reset the 28,917 ghost "applied" suggestions:**
A one-time migration to reset suggestions that were marked "applied" but whose source article has no actual links:

```sql
UPDATE link_suggestions 
SET status = 'approved', applied_at = NULL
WHERE status = 'applied'
AND source_post_id IN (
  SELECT ls.source_post_id 
  FROM link_suggestions ls
  JOIN blog_posts bp ON bp.id = ls.source_post_id
  WHERE ls.status = 'applied'
  AND bp.content NOT LIKE '%<a href=%'
);
```

This puts them back into the "approved" queue so the next apply run will actually insert them.

---

## Problem 2: 1,000 Orphan Articles

This is a direct consequence of Problem 1. Once the links are actually applied to article HTML, these orphan articles will receive inbound links and drop off the orphan list. No separate fix needed.

---

## Problem 3: Mobile Layout -- Content Pushed Right

The article content section (line 590-648) uses:
```html
<div class="flex gap-12">
  <article class="flex-1 max-w-3xl mx-auto lg:mx-0">...</article>
  <aside class="hidden lg:block w-72 shrink-0">...</aside>
</div>
```

On mobile, the sidebar is hidden (`hidden lg:block`), but `flex gap-12` still applies a 3rem gap context and `mx-auto` centers within the flex container. The `flex` layout without wrapping can cause the content to overflow or push right on narrow screens.

### Fix (in `src/pages/ArticlePage.tsx`)

Change the flex container to only apply on `lg` and use block layout on mobile:

```tsx
<div className="lg:flex lg:gap-12">
  <article className="flex-1 max-w-3xl mx-auto lg:mx-0">
```

This ensures on mobile the article takes full width with proper centering, and only switches to side-by-side flex layout on large screens where the sidebar is visible.

---

## Files to Edit

1. **`supabase/functions/apply-links-bulk/index.ts`** -- Cancel stuck jobs before starting, add error handling to content save, revert statuses on save failure
2. **`src/pages/ArticlePage.tsx`** -- Change `flex gap-12` to `lg:flex lg:gap-12` on the content wrapper
3. **Database migration** -- Reset ghost "applied" suggestions back to "approved" for re-processing

## After Implementation

1. Run "Apply to Articles" once more -- it will process the ~28,917 suggestions that are now back in "approved" status and actually save the links into article HTML
2. Orphan count should drop significantly
3. Mobile layout will display correctly
