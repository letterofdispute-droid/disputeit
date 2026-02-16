

# Backfill Inbound/Outbound Counts from Actual HTML

## Problem
130 of 153 "orphan" articles actually have inbound links in the HTML content, but the `inbound_count` column in `article_embeddings` is stuck at 0 because it was never incremented (manual links, links inserted before the counter system, etc.).

## Solution
Create a database RPC function that scans all published blog post HTML for internal article links, counts how many point at each article, and writes the accurate counts back to `article_embeddings`. Then add a "Reconcile Counts" button to the Link Suggestions UI to trigger it.

## Approach: Pure SQL (Database RPC)

A single SQL function `reconcile_link_counts()` will:

1. Parse all published `blog_posts.content` for internal links matching the pattern `/articles/{category}/{slug}`
2. For each target slug found, count how many distinct source articles link to it
3. For each source article, count how many distinct targets it links to
4. Batch-update `article_embeddings` with the real `inbound_count` and `outbound_count`

This is fast (runs server-side in Postgres), accurate (reads actual HTML), and idempotent (can be re-run safely).

## Database Migration

Create a new RPC function:

```sql
CREATE OR REPLACE FUNCTION public.reconcile_link_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inbound_updated INT := 0;
  outbound_updated INT := 0;
BEGIN
  -- Step 1: Extract all internal article links from published posts
  -- Pattern: /articles/{category}/{slug} in href attributes
  CREATE TEMP TABLE _extracted_links ON COMMIT DROP AS
  SELECT 
    bp.id AS source_id,
    m[1] AS target_slug
  FROM blog_posts bp,
    LATERAL regexp_matches(bp.content, '/articles/[^/"'']+/([^/"''#?]+)', 'g') AS m
  WHERE bp.status = 'published';

  -- Step 2: Calculate inbound counts (how many distinct sources link TO each slug)
  CREATE TEMP TABLE _inbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.source_id) AS real_inbound
  FROM article_embeddings ae
  LEFT JOIN _extracted_links el ON el.target_slug = ae.slug
  WHERE ae.embedding_status = 'completed'
  GROUP BY ae.id;

  -- Step 3: Calculate outbound counts (how many distinct targets each source links TO)
  CREATE TEMP TABLE _outbound ON COMMIT DROP AS
  SELECT 
    ae.id AS embedding_id,
    COUNT(DISTINCT el.target_slug) AS real_outbound
  FROM article_embeddings ae
  LEFT JOIN _extracted_links el ON el.source_id = ae.content_id
  WHERE ae.embedding_status = 'completed'
  GROUP BY ae.id;

  -- Step 4: Update inbound_count
  UPDATE article_embeddings ae
  SET inbound_count = COALESCE(ib.real_inbound, 0)
  FROM _inbound ib
  WHERE ae.id = ib.embedding_id
    AND ae.inbound_count IS DISTINCT FROM COALESCE(ib.real_inbound, 0);
  GET DIAGNOSTICS inbound_updated = ROW_COUNT;

  -- Step 5: Update outbound_count
  UPDATE article_embeddings ae
  SET outbound_count = COALESCE(ob.real_outbound, 0)
  FROM _outbound ob
  WHERE ae.id = ob.embedding_id
    AND ae.outbound_count IS DISTINCT FROM COALESCE(ob.real_outbound, 0);
  GET DIAGNOSTICS outbound_updated = ROW_COUNT;

  RETURN jsonb_build_object(
    'inbound_updated', inbound_updated,
    'outbound_updated', outbound_updated
  );
END;
$$;
```

## Frontend Changes

### `src/components/admin/seo/links/LinkActions.tsx`
- Add a "Reconcile Counts" button (with a RefreshCw icon)
- On click, calls `supabase.rpc('reconcile_link_counts')`
- Shows a toast with the number of updated rows
- Invalidates relevant queries so the orphan count refreshes

## Files to Modify

1. **New migration** -- Creates the `reconcile_link_counts()` RPC function
2. **`src/components/admin/seo/links/LinkActions.tsx`** -- Add "Reconcile Counts" button

## Why This Works
- The regex `/articles/[^/"']+/([^/"'#?]+)` reliably extracts slugs from `<a href="/articles/category/slug">` patterns in the stored HTML
- Counts distinct sources/targets to avoid double-counting multiple links between the same pair
- Uses `IS DISTINCT FROM` to only touch rows that actually changed
- Temp tables with `ON COMMIT DROP` keep it clean
- Fully idempotent -- safe to run repeatedly
