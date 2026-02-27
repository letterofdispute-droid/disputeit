

## Root Cause: Duplicate GSC Data

The `gsc_performance_cache` table has **274 rows but only 98 unique query+page pairs** — nearly 3x duplication. The fetch function deletes by date range before inserting, but if it's been run multiple times with overlapping or identical date ranges that don't match exactly, old rows persist and accumulate.

The AI then sees the same page URL listed multiple times for the same query and incorrectly flags it as "cannibalization" (multiple pages competing). These are **false positives** — it's the same page appearing as duplicate rows.

## Fix (2 parts)

### 1. Deduplicate existing data + add unique constraint
SQL migration to:
- Delete duplicate rows, keeping only the one with the latest `fetched_at`
- Add a unique constraint on `(query, page, date_range_start, date_range_end)` to prevent future duplicates

### 2. Update `fetch-gsc-data` edge function
- Replace `.insert(batch)` with `.upsert(batch, { onConflict: 'query,page,date_range_start,date_range_end' })` so re-fetches update existing rows instead of creating duplicates

### 3. Also update `gsc-recommendations` edge function  
- Add a `GROUP BY query, page` aggregation (summing clicks/impressions, averaging position/ctr) when reading from `gsc_performance_cache` as a safety net, so even if duplicates somehow remain, the AI won't see them as separate entries

### Files changed
- New SQL migration: deduplicate + unique constraint
- `supabase/functions/fetch-gsc-data/index.ts`: use `upsert` instead of `insert`
- `supabase/functions/gsc-recommendations/index.ts`: aggregate query before sending to AI

