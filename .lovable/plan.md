

# Fix: Backfill Outbound/Inbound Counters + Ensure Future Counting Works

## Problem

Every link card shows "0/8 links" because the `article_embeddings.outbound_count` column is 0 for all 4,627 articles, despite 24,530 links already applied. This happened because the `.catch()` bug (now fixed) was crashing the `increment_link_counters` RPC call silently for every single application.

## Fix (Two Parts)

### 1. Backfill counters from existing applied data

Run a SQL migration that computes accurate outbound/inbound counts from the `link_suggestions` table (where `status = 'applied'`) and writes them to `article_embeddings`.

```sql
-- Backfill outbound counts
UPDATE article_embeddings ae
SET outbound_count = sub.cnt
FROM (
  SELECT source_post_id, COUNT(*) as cnt
  FROM link_suggestions
  WHERE status = 'applied'
  GROUP BY source_post_id
) sub
WHERE ae.content_id = sub.source_post_id;

-- Backfill inbound counts
UPDATE article_embeddings ae
SET inbound_count = sub.cnt
FROM (
  SELECT ls.target_slug, COUNT(*) as cnt
  FROM link_suggestions ls
  WHERE ls.status = 'applied'
  GROUP BY ls.target_slug
) sub
WHERE ae.slug = sub.target_slug;
```

### 2. Verify the try/catch fix in the edge function

The `.catch()` to `try/catch` fix from the last deployment should now correctly call `increment_link_counters` for the 5,775 approved suggestions being processed. The diagnostic logs will confirm this.

## No code changes needed

The edge function fix is already deployed. Only a database migration is needed to backfill the historical counter data.
