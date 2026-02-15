

# Fix: Smart Scan Insert Failure

## Root Cause

Every article IS being analyzed by AI and suggestions ARE being found, but the database insert fails on **every single one**. The error:

> "there is no unique or exclusion constraint matching the ON CONFLICT specification"

The `.upsert(rows, { onConflict: 'source_post_id,target_slug' })` call requires a full unique constraint, but we only have a **partial unique index** (filtered to `WHERE status = 'pending'`). PostgREST does not support partial indexes for upsert.

## The Fix

Since the code already deletes existing pending AI suggestions for the source article before inserting (lines 469-474), duplicates are already handled. We just need to switch from `.upsert()` to `.insert()`.

## Technical Details

### File: `supabase/functions/scan-for-smart-links/index.ts`

**Line 490-492** -- Change:

```typescript
// FROM:
.upsert(rows, { onConflict: 'source_post_id,target_slug', ignoreDuplicates: true });

// TO:
.insert(rows);
```

That is the only change needed. The delete-then-insert pattern on lines 469-474 already prevents duplicates for `ai_suggested` entries.

### Also fix in: `supabase/functions/scan-for-semantic-links/index.ts`

The same upsert pattern exists there and would cause the same error. Change it to `.insert()` as well (the existing code also deletes before inserting).

