

# Fix: Refresh Keyword Stats Table During Planning Progress

## Problem

The "Keywords by Vertical" table only refreshes when the entire planning job completes. While 6/13 verticals have finished (consumer-rights, contractors, ecommerce, employment, financial, healthcare), the Used/Unused columns still show the old numbers. Users can't see progress reflected in the stats table.

## Root Cause

In `src/hooks/useKeywordTargets.ts`, the `queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] })` call only happens inside the `useEffect` that checks for `status === 'completed' || status === 'failed'` (line 77). During `processing`, no stats refresh occurs.

## Fix

**File: `src/hooks/useKeywordTargets.ts`**

Add a separate `useEffect` that watches `planningJob.completed_verticals.length`. When this value changes (meaning a new vertical just finished), invalidate the `keyword-targets-stats` query so the table refreshes with updated Used/Unused counts.

```typescript
// Refresh stats as each vertical completes (not just at job end)
useEffect(() => {
  if (planningJob?.status === 'processing' && planningJob.completed_verticals.length > 0) {
    queryClient.invalidateQueries({ queryKey: ['keyword-targets-stats'] });
  }
}, [planningJob?.completed_verticals.length]);
```

This is a 5-line addition. The table will now update every time a vertical finishes processing, giving real-time visibility into keyword consumption.

## Files Changed

- **Modified**: `src/hooks/useKeywordTargets.ts` -- add useEffect to invalidate stats on each vertical completion

