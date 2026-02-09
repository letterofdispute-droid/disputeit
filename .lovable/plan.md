

# Add Cancel/Stop Button to Generation Progress

## What Already Works
The backend already checks for a `cancelled` status at the start of each self-chain iteration (line 909). Setting the job status to `cancelled` in the database will stop processing after the current batch of 3 finishes.

## Changes

### 1. `src/hooks/useContentQueue.ts`
Add a `cancelJob` mutation that updates the active `generation_jobs` row to `status: 'cancelled'` and clears the local `activeJobId`.

### 2. `src/components/admin/seo/queue/GenerationProgress.tsx`
- Add a "Stop" button (red, with Square/StopCircle icon) next to the progress text
- Accept `onCancel` and `isCancelling` props
- Show confirmation before cancelling (since the current batch will still complete)

### 3. `src/components/admin/seo/ContentQueue.tsx`
- Pass the new `cancelJob` and `isCancelling` from `useContentQueue` down to `GenerationProgress`

## How It Works

```
User clicks Stop -> update generation_jobs.status = 'cancelled'
                  -> current batch (up to 3 articles) finishes
                  -> next self-chain checks status, sees 'cancelled', stops
                  -> remaining queued items stay as 'queued' (not marked failed)
```

The current batch will complete (up to ~30 seconds), but no new batches will start. Remaining items stay in "queued" status so they can be generated later.

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useContentQueue.ts` | Add `cancelJob` mutation + `isCancelling` state |
| `src/components/admin/seo/queue/GenerationProgress.tsx` | Add Stop button with `onCancel` prop |
| `src/components/admin/seo/ContentQueue.tsx` | Wire `cancelJob` to GenerationProgress |
