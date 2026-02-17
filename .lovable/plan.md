
# Add Real Progress Tracking UI for Keyword Planning

## What's Wrong

The planning job backend works (self-chaining edge function, `keyword_planning_jobs` table, polling hook) but the UI only shows a generic spinner with "AI is clustering keywords..." -- no actual progress numbers, no vertical-by-vertical status, no way to tell if it's working.

## What Changes

### 1. Update `KeywordManager.tsx` -- Replace generic spinner with real progress panel

When a planning job is active, show:
- A determinate progress bar (e.g., 5/13 verticals = 38%)
- Current vertical being processed (e.g., "Processing: insurance")
- Count of completed vs total verticals
- Total articles planned so far
- List of completed verticals with their article counts (green checkmarks)
- List of failed verticals (red X marks)
- When complete: summary toast already works, but also show final results inline

### 2. Update `useKeywordTargets.ts` -- Minor improvements

- Expose `planningJob` data more cleanly (already mostly done)
- No major changes needed, the hook already polls every 3 seconds

## No backend changes needed

The edge function and database table are already correctly implemented with:
- One-vertical-at-a-time processing (no timeout risk)
- Self-chaining with fire-and-forget pattern
- Progress tracked in `keyword_planning_jobs` table
- Hook already polls every 3 seconds

## File Changes

**Modified**: `src/components/admin/seo/KeywordManager.tsx`
- Replace the indeterminate `<Progress>` + generic text (lines 185-192) with a detailed progress panel that reads from `planningJob`
- Show: progress bar with percentage, current vertical name, completed/failed lists, total articles planned
- Use existing `planningJob` data from the hook (verticals, current_vertical_index, completed_verticals, failed_verticals, total_planned, vertical_results)

## Technical Details

The progress panel will render when `planningJob` is truthy and status is `'processing'`:

```text
+-----------------------------------------------+
| Planning Keywords (5 / 13 verticals)           |
| [=========>........................] 38%        |
|                                                 |
| Currently processing: financial                 |
| Articles planned so far: 42                     |
|                                                 |
| Done: insurance (8), healthcare (6),            |
|       employment (7), contractors (5),          |
|       housing (8)                               |
| Failed: (none)                                  |
+-----------------------------------------------+
```

When status becomes `'completed'` or `'failed'`, show a summary with green/red styling before the panel auto-dismisses (existing toast handles notification).
