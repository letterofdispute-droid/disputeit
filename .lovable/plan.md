

# Fix: Backfill Stops After 15 Images

## Root Cause

The process query (line 205) fetches 10 posts where ANY image column is NULL:

```sql
WHERE featured_image_url IS NULL 
   OR middle_image_1_url IS NULL 
   OR middle_image_2_url IS NULL
```

But ~1,365 posts have `middle_image_2_url = NULL` without a `MIDDLE_IMAGE_2` placeholder in their content. These posts are fetched, fail the in-code filter, and block the query from reaching posts that actually need images. After the few valid ones in the first 10 results are processed, the same invalid posts keep being returned, and the function marks the job as "complete."

## Fix

### 1. Create a database function for smart post fetching

Create an RPC `get_next_backfill_post` that does the placeholder filtering in SQL:

```sql
CREATE OR REPLACE FUNCTION get_next_backfill_post()
RETURNS SETOF blog_posts
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM blog_posts
  WHERE status = 'published'
    AND (
      featured_image_url IS NULL
      OR (middle_image_1_url IS NULL AND content LIKE '%MIDDLE_IMAGE_1%')
      OR (middle_image_2_url IS NULL AND content LIKE '%MIDDLE_IMAGE_2%')
    )
  ORDER BY created_at DESC
  LIMIT 1;
$$;
```

This ensures every returned post genuinely needs at least one image.

### 2. Update edge function to use the RPC

Replace the current query + in-code filter (lines 201-218) with a single RPC call:

```typescript
const { data: posts } = await supabase.rpc('get_next_backfill_post');
const post = posts?.[0];
if (!post) { /* mark complete */ }
```

### 3. Fix duplicate job issue

The logs show TWO concurrent jobs running (IDs `84928f55` and `6ecaf1ee`). Add a check in the `start` mode to cancel any existing active jobs before creating a new one.

## Files to Modify

| File | Change |
|------|--------|
| Migration | Create `get_next_backfill_post` RPC function |
| `supabase/functions/backfill-blog-images/index.ts` | Use RPC instead of query+filter; cancel stale jobs on start |

