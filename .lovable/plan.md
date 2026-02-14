

# Fix Self-Link Bug in Link Discovery

## Problem

The screenshot shows an article ("The Urgent Note That Prompted My Landlord to Replace Our Drafty Window") suggesting a link to **itself**. This is a self-link that should never be generated.

The anchor text is also the article's own title, which is bad for SEO and confirms the self-link went undetected.

## Root Cause

The `match_semantic_links` SQL function does not exclude the source article from results. It returns the source article as its own highest match (near-100% similarity). A JavaScript filter (`m.id !== source.id`) exists but is failing -- likely due to a type mismatch between the UUID returned by the RPC and the source object's `id` field.

## Fix (2 changes)

### 1. Exclude self at the database level (primary fix)

Add a `source_content_id` parameter to the `match_semantic_links` function. Add a WHERE clause: `AND ae.content_id != source_content_id`. This guarantees self-matches never leave Postgres regardless of any JS-level bugs.

### 2. Strengthen the JS-level self-link filter (safety net)

Update the filter in `processOneArticle()` to also compare by `content_id` and `slug`, not just `id`. Add explicit string casting to avoid type mismatches.

```text
BEFORE (line 202):
  filter(m => m.id !== source.id && m.slug !== source.slug)

AFTER:
  filter(m => String(m.id) !== String(source.id) 
           && m.slug !== source.slug)
```

Also filter the reverse matches the same way (line 282).

### 3. Clean up existing self-link suggestions

Run a one-time migration to delete any existing self-link suggestions already in the database.

```sql
DELETE FROM link_suggestions ls
USING blog_posts bp
WHERE ls.source_post_id = bp.id
  AND ls.target_slug = bp.slug;
```

## Technical Details

### Database migration

1. Replace `match_semantic_links` function with a new version that accepts an optional `exclude_content_id UUID DEFAULT NULL` parameter and adds `AND (exclude_content_id IS NULL OR ae.content_id != exclude_content_id)` to the WHERE clause
2. Delete existing self-link suggestions

### Edge function (`scan-for-semantic-links/index.ts`)

- Pass `source.content_id` as the new `exclude_content_id` parameter in both forward and reverse RPC calls
- Add `String()` casting to the JS-level self-link filters as a safety net

## Files changed

- `supabase/functions/scan-for-semantic-links/index.ts` -- pass exclude parameter, strengthen JS filter
- 1 database migration (update RPC function + clean up self-links)

