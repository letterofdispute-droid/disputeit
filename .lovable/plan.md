
# Failure Explainer Notifications for Content Queue

## Problem
When AI credit balance runs out (HTTP 402) or rate limits are hit (HTTP 429), the system silently marks items as "failed" with a generic error like "AI Gateway error: 402". There's no prominent notification explaining what happened or what to do about it.

## Solution
Add categorized error detection in both the backend and frontend to surface clear, actionable failure explanations.

---

## Changes

### 1. Backend: Categorize errors in `bulk-generate-articles`
When the AI gateway returns specific HTTP status codes, store a **structured, human-readable error message** on the queue item instead of the generic "AI Gateway error: 402".

- **402**: "AI credit balance exhausted. Add credits at Settings > Workspace > Usage, then retry."
- **429**: "Rate limit exceeded. Wait a few minutes, then retry with a smaller batch size."
- **5xx**: "AI service temporarily unavailable. Please retry later."

### 2. Frontend: Add a failure summary banner in `ContentQueue.tsx`
When failed items exist, analyze their `error_message` values and show a prominent alert banner above the queue table that:
- Groups failures by error type (credits, rate limit, AI error, other)
- Shows a clear icon and explanation for each failure category
- Provides direct action guidance (e.g., "Retry" button, link to reduce batch size)

### 3. Frontend: Show toast on generation completion with failures
When `bulkGenerate` or `retryFailed` completes with failures, enhance the existing toast to include the failure reason category (not just "X failed").

---

## Technical Details

### File: `supabase/functions/bulk-generate-articles/index.ts`
Around line 1129, where `aiResponse.ok` is checked, add specific status code handling:

```typescript
if (!aiResponse.ok) {
  if (aiResponse.status === 402) {
    throw new Error('CREDIT_EXHAUSTED: AI credit balance exhausted. Add credits in workspace settings then retry.');
  }
  if (aiResponse.status === 429) {
    throw new Error('RATE_LIMITED: Rate limit exceeded. Wait a few minutes then retry with smaller batch.');
  }
  throw new Error(`AI_ERROR: AI service error (${aiResponse.status}). Retry later.`);
}
```

Also add early bail-out logic: if a 402 is detected, skip remaining items in the batch (no point retrying without credits).

### File: `src/components/admin/seo/queue/FailureSummary.tsx` (new)
A new component that:
- Accepts `failedItems: ContentQueueItem[]`
- Parses `error_message` for known prefixes (`CREDIT_EXHAUSTED:`, `RATE_LIMITED:`, `AI_ERROR:`)
- Renders an Alert with appropriate icon, color, and guidance per category

### File: `src/components/admin/seo/ContentQueue.tsx`
- Import and render `FailureSummary` between the progress indicator and the filters when `stats.failed > 0`

### File: `src/hooks/useContentQueue.ts`
- Enhance the `onSuccess` callback in both `bulkGenerateMutation` and `retryFailedMutation` to check failed items' error messages and include the reason category in the toast description

---

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/bulk-generate-articles/index.ts` | Modify | Categorize 402/429/5xx errors with prefixes, add early bail-out on 402 |
| `src/components/admin/seo/queue/FailureSummary.tsx` | Create | Prominent failure explanation banner component |
| `src/components/admin/seo/ContentQueue.tsx` | Modify | Render FailureSummary when failures exist |
| `src/hooks/useContentQueue.ts` | Modify | Enhanced toast messages with failure reason |
