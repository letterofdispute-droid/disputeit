

# Fix "Apply to Articles" Infinite Loop

## Root Cause

When a link suggestion cannot be inserted into article HTML (the AI can't find a good spot, or the paragraph matching fails), `insertLinkContextually` returns `null`. The code increments `failedCount++` but **never updates the suggestion's status**. It stays `'approved'`, so the next batch picks it up again, fails again, and the cycle repeats infinitely. This is why processed count (16,420) exceeds total (14,681).

## Fix

### File: `supabase/functions/apply-links-bulk/index.ts`

**Change 1**: When a suggestion fails to apply, mark it as `'rejected'` with an explanation so it's not re-fetched:

```typescript
// Line ~426-428: after insertLinkContextually returns null
} else {
  // Mark as rejected so it's not re-fetched in the next batch
  await supabaseAdmin
    .from('link_suggestions')
    .update({ status: 'rejected', hierarchy_violation: 'Could not find suitable insertion point' })
    .eq('id', suggestion.id);
  failedCount++;
}
```

**Change 2**: Same treatment in the catch block (~line 429-432): mark the suggestion as rejected on error.

**Change 3**: Fix the completion check. Currently `result.processed === 0` is the termination condition, but the `finally` block also checks `remaining` approved count. With the fix above, failed suggestions will be rejected, so `remaining` will eventually reach 0 and the job will terminate correctly.

### File: `src/components/admin/seo/links/LinkActions.tsx`

No changes needed -- the progress display will now show accurate numbers since processed won't exceed total.

## Result

- Failed suggestions get marked as `'rejected'` instead of staying `'approved'`
- No more infinite re-processing of the same suggestions
- Progress counter stays accurate (processed will never exceed total)
- Job completes naturally when all approved suggestions have been attempted
