

# Fix Orphan Article Count and Discover Missing Links

## Problem

The panel shows 312 orphan articles, but the count is inflated:
- **124 articles** already have applied inbound links -- their `inbound_count` is stuck at 0 due to the counter bug
- **188 articles** genuinely have no inbound links and need scanning

## Fix (Two Parts)

### Part 1: Fix the false orphans (database migration)

Run a SQL migration to re-backfill `inbound_count` for ALL articles based on actual applied link suggestions. The previous backfill ran but missed these 124 because the suggestions were in `rejected` status at the time.

```sql
-- Reset all inbound counts to accurate values
UPDATE article_embeddings ae
SET inbound_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT ls.target_slug, COUNT(*) as cnt
  FROM link_suggestions ls
  WHERE ls.status = 'applied'
  GROUP BY ls.target_slug
) sub
WHERE ae.slug = sub.target_slug
  AND ae.inbound_count != COALESCE(sub.cnt, 0);
```

This will immediately reduce the orphan count from 312 to ~188.

### Part 2: Scan the remaining 188 orphans

The 188 genuinely orphaned articles need a link discovery scan (Smart Scan or Vector Scan) to generate inbound link suggestions for them. No code change needed -- the user just needs to run a scan from the UI. However, the current scan logic scans SOURCE articles looking for outbound targets. Orphans need the REVERSE: scanning other articles to find places to link TO these orphans.

The existing Vector Scan already handles this via "reverse discovery" (pgvector similarity matching finds articles similar to the orphan). So running a full scan (All Categories) should generate suggestions targeting these orphans.

**No code changes needed** -- just the database migration and then running a scan.

## Steps

1. Run database migration to fix the 124 false orphans
2. Verify orphan count drops to ~188
3. User runs a Smart Scan or Vector Scan (All Categories, Force Re-scan) to discover inbound links for the remaining orphans

