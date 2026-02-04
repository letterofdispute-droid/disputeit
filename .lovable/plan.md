
# Failed Article Recovery in ClusterPlanner

## Problem Summary

When article generation completes with failures:
1. The "Generate All Queued" button becomes disabled (no queued items remain)
2. There's no "Retry Failed" button in the ClusterPlanner dialog
3. Users can't see the error message that caused the failure
4. Users are stuck with no actionable options except "Cancel"

## Solution Overview

Enhance the ClusterPlanner dialog with failure recovery capabilities:

1. **Add "Retry Failed" button** when failed items exist
2. **Show error message** on hover for failed items
3. **Per-item retry button** next to each failed item
4. **Summary stats** showing generated/failed/queued counts
5. **"Done" button** when generation is complete (instead of just "Cancel")

---

## Changes to Make

### 1. Update ClusterPlanner.tsx

**Add new functionality:**

| Feature | Description |
|---------|-------------|
| Stats display | Show "6 generated, 1 failed" summary above article list |
| Retry Failed button | Appears when any items have status "failed" |
| Per-item retry | Small retry icon button next to each failed item |
| Error tooltip | Hover over failed badge to see error message |
| Dynamic footer | Show "Done" when complete, "Retry Failed" when failures exist |

**UI Changes:**

```
Before (current state):
┌────────────────────────────────────────────────────────┐
│ Rights Explainer                        [failed]       │
│   The Consumer Rights Act...                           │
├────────────────────────────────────────────────────────┤
│                                 [Cancel] [Generate All]│ ← disabled
└────────────────────────────────────────────────────────┘

After (proposed):
┌────────────────────────────────────────────────────────┐
│ ✓ 6 generated  ✗ 1 failed                              │ ← stats bar
├────────────────────────────────────────────────────────┤
│ Rights Explainer              [⟲ Retry] [failed ⓘ]    │ ← per-item retry + error tooltip
│   The Consumer Rights Act...                           │
├────────────────────────────────────────────────────────┤
│                    [Done] [Retry All Failed (1)]       │ ← action buttons
└────────────────────────────────────────────────────────┘
```

### 2. Hook Integration

The `useContentQueue` hook already has `retryFailed` and `isRetrying` - we just need to:
- Import and use `retryFailed` in ClusterPlanner
- Add `isRetrying` to disable buttons during retry
- Calculate plan-specific stats (queued/generated/failed counts)

---

## Implementation Details

### Stats Bar Component
```
Display at top of article list:
- ✓ {generated} generated
- ✗ {failed} failed  
- ○ {queued} queued (if any remain)
```

### Per-Item Actions for Failed Items
- Add a small retry button (RotateCcw icon) next to the failed badge
- On click, call `retryFailed([item.id])`
- Show loading spinner during retry

### Error Tooltip
- Wrap the "failed" badge in a Tooltip
- Show `item.error_message` on hover
- Truncate long errors with "..." and full display on hover

### Footer Button Logic
```
if (failedCount > 0 && queuedCount === 0):
  Show: [Done] [Retry All Failed ({failedCount})]
  
elif (queuedCount > 0):
  Show: [Cancel] [Generate All Queued ({queuedCount})]
  
elif (allGenerated):
  Show: [Done]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/seo/ClusterPlanner.tsx` | Add stats bar, retry buttons, error tooltips, dynamic footer |

---

## Summary

This enhancement adds complete failure recovery within the ClusterPlanner dialog:
- Users can see what failed and why
- Users can retry individual items or all failed items at once
- Clear action buttons based on current state
- No more "stuck" state with disabled buttons
