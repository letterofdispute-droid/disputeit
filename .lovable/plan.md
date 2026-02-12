

# Fix: Sync 434 Stale "Generated" Queue Items and Clarify Stats

## The Real Problem

The 434 "generated" items in the content queue ALL have corresponding blog posts that are already **published**. The queue status was never updated to "published" when those posts were published — it's a sync issue, not actual drafts waiting.

There are **zero draft blog posts** in the database. All 2,572 blog posts are published.

## Solution

### Step 1: Database Migration — Sync stale queue items

Run a SQL migration to update all `content_queue` items from "generated" to "published" where the linked blog post is already published:

```sql
UPDATE content_queue 
SET status = 'published', 
    published_at = bp.published_at
FROM blog_posts bp
WHERE content_queue.blog_post_id = bp.id
  AND content_queue.status = 'generated'
  AND bp.status = 'published';
```

This will fix the 434 items immediately.

### Step 2: Add a "Generated" filter to the Blog Posts page

Even though there are currently no drafts, adding a "Generated (not published)" filter ensures that in the future, if the generation pipeline creates blog posts as drafts, you can easily find and publish them. This filter will query `blog_posts` where `status = 'draft'` — same as the existing Drafts filter.

No code change needed here since the Drafts filter already covers this.

### Step 3: Prevent future sync drift

Update `src/hooks/useCreateDraftFromGenerated.ts` — when the bulk generation creates a blog post and marks it as published, also update the corresponding `content_queue` row. This is already done in the bulk publish handler in AdminBlog, but may not happen during auto-publish flows.

### Result After Fix

| Metric | Before | After |
|--------|--------|-------|
| Queue: generated | 434 | 0 |
| Queue: published | 2,122 | 2,556 |
| Articles Generated (dashboard) | 2,556 | 2,556 |
| Blog Posts published | 2,572 | 2,572 |

The remaining 16-post gap (2,572 - 2,556) represents blog posts created outside the content queue pipeline (manual posts, AI Generate, etc.) — which is expected and correct.

