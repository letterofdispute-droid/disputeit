

# Make Image Optimizer Run in Background (Self-Chaining)

## Problem

The current implementation runs the optimization loop **client-side** in the browser. With ~6,000+ images, this means:
- You must keep the tab open the entire time
- Phone sleep or tab switch kills the process
- No resume if it fails mid-way
- Each batch re-scans all files to find the next chunk

## Solution

Refactor to use the same **self-chaining background pattern** used by `bulk-generate-articles` -- the edge function processes a small batch, stores progress in a tracking table, then triggers itself for the next batch. The UI just polls for status.

## Changes

### 1. New database table: `image_optimization_jobs`

Tracks job progress so the function can resume and the UI can poll status.

```sql
CREATE TABLE public.image_optimization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, scanning, optimizing, cleaning, completed, failed, cancelled
  total_files INT DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  oversized_files INT DEFAULT 0,
  oversized_size_bytes BIGINT DEFAULT 0,
  processed INT DEFAULT 0,
  saved_bytes BIGINT DEFAULT 0,
  deleted INT DEFAULT 0,
  freed_bytes BIGINT DEFAULT 0,
  current_offset INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.image_optimization_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage optimization jobs"
  ON public.image_optimization_jobs FOR ALL
  USING (public.is_admin(auth.uid()));
```

### 2. Refactor edge function: `optimize-storage-images`

**File: `supabase/functions/optimize-storage-images/index.ts`**

Change the modes to work with the job table:

- **`scan` mode**: Create a job row with status `scanning`, list all files, update the job with totals, set status to `scanned`. Return the job ID.
- **`optimize` mode**: Accept a `jobId`. Read `current_offset` from the job. Process a batch of 5 images (smaller batch = safer). Update `processed`, `saved_bytes`, `current_offset` in the job. If more remain, fire-and-forget call to itself with the same `jobId`. If done, set status `optimized`.
- **`cleanup` mode**: Accept a `jobId`. Delete originals in batches. Self-chain if more to delete.
- **`cancel` mode**: Set job status to `cancelled` so the next self-chain stops.
- **`status` mode**: Return current job row (for polling).

Batch size reduced to **5** for safety (each image involves download + decode + encode + upload + DB updates).

### 3. Refactor UI: `ImageOptimizer.tsx`

**File: `src/components/admin/storage/ImageOptimizer.tsx`**

- **Scan**: Call function with `mode: 'scan'`, get back a `jobId`. Start polling.
- **Polling**: Every 3 seconds, call `mode: 'status', jobId` to get progress. Update the progress bar.
- **Optimize**: Call `mode: 'optimize', jobId` once. The function self-chains from there.
- **Cleanup**: Call `mode: 'cleanup', jobId` once. Self-chains.
- **Cancel**: Call `mode: 'cancel', jobId` to stop gracefully.
- Add a "Cancel" button visible during optimization.
- On component mount, check for any in-progress job and resume polling.

### 4. Flow Diagram

```text
User clicks "Scan"
  -> Edge function creates job, scans bucket, updates job with totals
  -> UI polls job status, shows stats

User clicks "Optimize"
  -> Edge function reads job offset, processes 5 images
  -> Updates job (processed, saved_bytes, offset)
  -> Fire-and-forget calls itself with same jobId
  -> UI polls every 3s, updates progress bar
  -> User can close tab -- function keeps self-chaining
  -> When done, sets status = 'optimized'

User clicks "Cleanup"
  -> Same self-chaining pattern for deletion
  -> Sets status = 'completed' when done
```

### 5. Safety Features

- Batch size of 5 images per invocation (well within timeout)
- Each invocation checks if job status is `cancelled` before processing
- Errors are appended to the job's `errors` JSONB array
- Job has `updated_at` timestamp for stale job detection
- UI shows "Cancel" button during processing
- On mount, UI checks for existing in-progress jobs and resumes polling

