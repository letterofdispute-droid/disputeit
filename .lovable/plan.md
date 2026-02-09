

# Fix: Reliable Progress Tracking and Accurate Stats

## Problems Identified

### 1. "Generating: 0" is almost always zero
The `useQueueStats` hook counts items where `status = 'generating'` in the `content_queue` table. However, items only spend a few seconds in `generating` status while being actively processed. Between batches (which take ~2 minutes), zero items are in that status. This makes the stat permanently misleading.

**Fix**: Replace the "Generating" stat with an "In Progress" indicator derived from the `generation_jobs` table. If any job has `status = 'processing'`, show its progress (e.g., "In Progress: 6/148") instead of the meaningless queue-level count.

### 2. Progress doesn't survive leaving the screen
The `activeJob` polling query (line 85-98 in `useContentQueue.ts`) uses the regular Supabase client, which requires a valid user session. When the user leaves the screen:
- The browser may suspend the tab (especially on mobile)
- The auth token may expire after ~1 hour
- When they return, the on-mount check finds the processing job ID, but the subsequent poll query to `generation_jobs` fails silently (RLS denies access with expired token)
- `activeJob` stays null, so `generationProgress` is null, and the progress bar either disappears or shows stale data

**Fix**: Add error handling to the `activeJob` query and auto-refresh the session before polling. Also add a `visibilitychange` listener to immediately refetch when the tab becomes active again.

### 3. Stats and progress not refreshing together
The queue stats (`useQueueStats`) poll every 5 seconds independently. The `activeJob` polls every 4 seconds. The queue items poll every 5 seconds. These are not coordinated, leading to inconsistent numbers across different parts of the dashboard.

**Fix**: Invalidate `queue-stats` whenever the `activeJob` data changes (new succeeded/failed counts), ensuring the stats bar updates in sync with progress.

## Changes

### File 1: `src/hooks/useContentQueue.ts`

- Add `visibilitychange` listener that immediately refetches `activeJob` and `queueItems` when tab becomes visible again
- Add error handling to the `activeJob` query — if it fails (auth expired), attempt session refresh
- Invalidate `queue-stats` inside the `activeJob` polling effect when succeeded/failed counts change
- Handle `cancelled` status in the completion effect (currently only handles `completed`)

### File 2: `src/hooks/useQueueStats.ts`

- Add a `processing_jobs` count: query `generation_jobs` for any job with `status = 'processing'`, returning `succeeded_items` and `total_items`
- Export this alongside existing stats so the UI can show real progress

### File 3: `src/components/admin/seo/queue/QueueStats.tsx`

- Replace the "Generating: 0" stat with dynamic content:
  - If a processing job exists: show "In Progress: X/Y" (from the job's succeeded + failed / total)
  - If no processing job: hide the field or show "Generating: 0" as before

### File 4: `src/components/admin/seo/ContentQueue.tsx`

- Ensure the progress bar shows immediately on mount when a processing job exists (don't wait for `generationProgress` to be non-null; show a loading state instead)

## Technical Details

| File | Change |
|------|--------|
| `src/hooks/useContentQueue.ts` | Add visibility listener, error handling for activeJob poll, handle cancelled status |
| `src/hooks/useQueueStats.ts` | Add processing job progress to stats |
| `src/components/admin/seo/queue/QueueStats.tsx` | Show "In Progress: X/Y" instead of "Generating: 0" |
| `src/components/admin/seo/ContentQueue.tsx` | Show loading progress state on mount when job exists |

