

# Fix: Remove Broken RPC Call Causing False "Failed" Statuses

## The Problem

After an article is successfully generated and saved, lines 1305-1316 execute a broken RPC call:

```text
Line 1309: succeeded_items: supabaseAdmin.rpc ? undefined : undefined  (no-op)
Line 1314: await supabaseAdmin.rpc('increment_job_succeeded', ...).catch(...)
```

This fails because:
1. The function `increment_job_succeeded` does not exist in the database
2. `.catch()` is not available on the Supabase client's RPC return type (it returns a PostgrestFilterBuilder, not a native Promise)

Because this code is inside the `try` block, the thrown error lands in the `catch` block at line 1320, which marks the article as **failed** -- even though it was successfully generated and saved.

## The Fix

**Delete lines 1305-1316 entirely.** Job progress is already correctly handled at lines 1362-1434 (the post-batch block), which reads the current job state, adds batch counts, and writes them back. The per-item increment was redundant and broken.

## What Changes

| File | Change |
|------|--------|
| `supabase/functions/bulk-generate-articles/index.ts` | Remove lines 1305-1316 (the broken no-op update and non-existent RPC call) |

## What Does NOT Change
- JSON parsing -- untouched
- Self-chaining logic -- untouched
- Job progress tracking (post-batch block at lines 1362+) -- already correct
- Retry logic, bail-out logic -- untouched

