
# Smart Pillar Publishing: Auto-Interleave with Clusters

## The Problem

Right now, when you select pillar drafts and click "Publish Selected", they all get `published_at = now()`. This means:
- All 500+ pillars appear with today's date
- They don't sit alongside their cluster articles in the timeline
- It looks unnatural -- a hub article appearing weeks after its supporting articles

## The Solution

Modify the bulk publish logic so that **pillar articles automatically get a backdated `published_at`** that places them just before their cluster articles. No manual work needed -- you just select drafts and click "Publish Selected" as usual.

### How it works

1. When you click "Publish Selected", the system checks if any of the selected posts are pillar articles (via `article_type = 'pillar'`)
2. For each pillar, it looks up the **earliest published cluster article** in the same content plan
3. It sets the pillar's `published_at` to **1 hour before** that earliest cluster article
4. Non-pillar articles publish normally with `now()`

### Example timeline result

```text
Before (current behavior):
  Feb 13 10:05  - Cluster: "Unpacking Cooling-Off Periods..."
  Feb 13 10:05  - Cluster: "Four Steps to Avoid..."
  Feb 13 10:05  - Cluster: "Common Blunders That Sink..."
  Feb 14 15:30  - Pillar: "Refund Cooling Off: Know Your Rights"  <-- appears days later

After (new behavior):
  Feb 13 09:05  - Pillar: "Refund Cooling Off: Know Your Rights"  <-- 1 hour before clusters
  Feb 13 10:05  - Cluster: "Unpacking Cooling-Off Periods..."
  Feb 13 10:05  - Cluster: "Four Steps to Avoid..."
  Feb 13 10:05  - Cluster: "Common Blunders That Sink..."
```

## What You Do

Nothing different. Same workflow:
1. Go to Admin Blog
2. Filter by Draft
3. Select pillar articles
4. Click "Publish Selected"

The system handles the date placement automatically.

## Technical Changes

**File: `src/pages/admin/AdminBlog.tsx`**

Modify `handleBulkPublish` to:
1. Fetch the selected posts to identify which are pillars (have `article_type = 'pillar'` and `content_plan_id`)
2. For pillar posts, query the earliest `published_at` from sibling blog posts in the same `content_plan_id`
3. Set each pillar's `published_at` to 1 hour before that earliest sibling
4. If no published siblings exist, fall back to `now()` (normal behavior)
5. Non-pillar posts continue to use `now()` as before

The content_queue sync logic remains the same -- it mirrors whatever `published_at` the blog post gets.

## Scope
- 1 file modified (`AdminBlog.tsx`)
- No database changes
- No edge function changes
