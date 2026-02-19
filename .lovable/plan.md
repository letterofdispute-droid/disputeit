
# Fix Rescue Orphans Feedback Loop

## Problem
When the user clicks "Rescue Orphans", the only feedback is an initial "started" toast. The self-chaining edge function runs in the background, but the UI never shows:
- A progress bar during processing (it may flash too briefly or the polling misses the processing window)
- A completion toast when the job finishes
- An auto-refresh of the orphan list after completion

The rescue job that just ran completed successfully (285 orphans processed, 16 suggestions found), but the user saw nothing.

## Root Cause
The `useSemanticLinkScan` hook has no `useEffect` watching `activeRescueJob` for state transitions. The discovery scan job (`activeScanJob`) has the same gap but is less noticeable because it takes longer. There is no mechanism to detect when a rescue job transitions from `processing` to `completed` and trigger a completion toast + data refresh.

## Changes

### 1. Add completion detection effect in `SemanticScanPanel.tsx`

Add a `useEffect` that watches `activeRescueJob` status. When it transitions to `completed`:
- Show a success toast with the results (X orphans processed, Y suggestions found)
- Auto-refresh the orphan articles list
- Auto-refresh link suggestions

Similarly, handle the `failed` status to show an error toast.

```typescript
// Track previous rescue job status to detect transitions
const [prevRescueStatus, setPrevRescueStatus] = useState<string | null>(null);

useEffect(() => {
  if (!activeRescueJob) return;
  const currentStatus = activeRescueJob.status;
  
  if (prevRescueStatus === 'processing' && currentStatus === 'completed') {
    toast({
      title: 'Orphan rescue complete',
      description: `Processed ${activeRescueJob.processed_items} orphans, found ${activeRescueJob.total_suggestions} link suggestions`,
    });
    refetchOrphans();
    // invalidate link suggestions
  }
  
  if (prevRescueStatus === 'processing' && currentStatus === 'failed') {
    toast({
      title: 'Orphan rescue failed',
      description: 'The rescue job encountered an error. Check scan history for details.',
      variant: 'destructive',
    });
  }
  
  setPrevRescueStatus(currentStatus);
}, [activeRescueJob?.status]);
```

### 2. Show rescue completion summary even after job finishes

In the orphan section UI, add a "recently completed" state (similar to the scan job's `scanJobRecentlyCompleted` logic) that shows:
- "Rescue complete - 16 new suggestions found from 285 orphans"
- A note to review them in the Link Review tab
- This persists for 1 hour after completion so the user always sees the result

### 3. Ensure progress bar visibility during short jobs

The rescue job self-chains in batches of 10. If batches process quickly, the polling (every 2s) might miss the `processing` state entirely. To handle this:
- Show a "Rescue in progress..." indicator immediately after clicking the button (use local state `justStartedRescue`)  
- Keep it visible until either the polling picks up the job or 10 seconds pass
- This bridges the gap between the button click and the first poll response

## Files to Change

| File | Change |
|------|--------|
| `src/components/admin/seo/links/SemanticScanPanel.tsx` | Add completion detection effect, "recently completed" rescue summary, and immediate progress indicator |

## Expected Outcome
After clicking "Rescue Orphans":
1. Immediate visual indicator shows "Rescue in progress..."
2. If the job takes time, the progress bar with processed/total count appears
3. When complete, a toast appears: "Rescue complete - 16 suggestions found from 285 orphans"  
4. The orphan count auto-refreshes
5. A completion summary persists in the UI for review
