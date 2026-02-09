
# Fix: Add `started_at` Timestamp for Accurate Timeout Detection

## Problem
Stale-item detection uses `created_at`, which can be hours/days before processing starts. This causes false-positive timeouts on old queued items that just began generating.

## Changes

### 1. Database Migration
- Add `started_at TIMESTAMPTZ DEFAULT NULL` column to `content_queue`
- Update the `recover_stale_generating_items()` function to use `started_at` instead of `created_at`

### 2. Edge Function (`supabase/functions/bulk-generate-articles/index.ts`)
- Line ~841: Change stale pre-clean query from `.lt('created_at', tenMinutesAgo)` to `.lt('started_at', tenMinutesAgo)`
- Line ~947-950: When marking item as `generating`, also set `started_at: new Date().toISOString()`

### 3. Frontend (`src/hooks/useContentQueue.ts`)
- Add `started_at: string | null` to the `ContentQueueItem` interface
- In `getStaleGeneratingItems()`, change the threshold check from `new Date(item.created_at)` to `new Date(item.started_at || item.created_at)` (fallback to `created_at` for items without `started_at`)

## Files Modified
| File | Change |
|------|--------|
| Database migration | Add `started_at` column, update recovery function |
| `supabase/functions/bulk-generate-articles/index.ts` | Set `started_at` on generating, use it for stale detection |
| `src/hooks/useContentQueue.ts` | Add to interface, use for stale detection |
