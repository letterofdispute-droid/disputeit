

# Server-Side Article Generation (Fire and Forget)

## The Problem

Currently, when you click "Generate All," the browser runs a loop: it calls the edge function with 3 items, waits for them to finish, then calls again with the next 3. If you close the browser, lock your phone, or lose connection, the loop stops and remaining items stay as "queued" forever.

## The Solution

Move the batch loop from the browser into the edge function itself using a **self-chaining pattern**. The edge function processes 3 articles, then fires a request to itself to process the next 3. This continues entirely on the server regardless of what the browser does.

The `generation_jobs` table already exists in the database but is currently unused. We will use it to track progress so you can close your browser, come back later, and see exactly where things stand.

## How It Works

```text
Browser clicks "Generate All"
    |
    v
Edge function creates a generation_job row
    |
    v
Processes batch of 3 articles
    |
    v
Updates generation_job progress (succeeded: 3, total: 200)
    |
    v
Fires fetch() to itself with jobId (fire-and-forget)
    |
    v
Returns immediately (browser gets jobId)
    |   
    +--- Browser can close here. Server keeps going. ---+
    |                                                    |
    v                                                    v
Next batch of 3 processes...                    Admin dashboard polls
    |                                           generation_jobs table
    v                                           for live progress
Repeats until all done or bail-out
    |
    v
Sets generation_job status = 'completed'
```

## Automatic Retry for Failed Items

After the main job completes, any items that failed (except credit/rate-limit errors) get **one automatic retry**. The logic:

1. Main pass processes all queued items
2. After completion, check for failed items where error is NOT `CREDIT_EXHAUSTED` or `RATE_LIMITED`
3. Reset those to `queued` and process them in a second pass
4. If they fail again, they stay failed permanently (no infinite loop)
5. The job tracks this via a `retry_pass` flag so it only happens once

## Bail-Out Safety

- If a `CREDIT_EXHAUSTED` (402) or `RATE_LIMITED` (429) error occurs, the job stops immediately
- All remaining items are marked as failed with a clear message
- The `generation_jobs` row gets `bail_reason` set, so the UI shows why it stopped
- No retry is attempted for these errors

## Stop Button

The dashboard will show a "Stop" button while a job is running. Clicking it sets the job status to `cancelled`. At the start of each batch, the edge function checks the job status. If cancelled, it stops gracefully after the current batch finishes.

## Files to Modify

### 1. `supabase/functions/bulk-generate-articles/index.ts`
- Add `jobId` parameter support
- On first call (no jobId): create a `generation_jobs` row, process first batch of 3, then self-chain
- On continuation calls (has jobId): load job, check if cancelled, process next batch, self-chain
- After all items done: check for retryable failures, do one retry pass
- Use service role key for self-chaining (not user token)

### 2. `src/hooks/useContentQueue.ts`
- Remove the client-side batch loop from `bulkGenerateMutation`
- Replace with: single call to edge function, get back `jobId`, then poll `generation_jobs` table
- Same for `retryFailedMutation`

### 3. `src/hooks/useGenerationJob.ts` (new file)
- Hook that polls the `generation_jobs` table for active jobs
- Returns: `{ job, isRunning, progress, stopJob }`
- Polls every 3 seconds while job is running
- Provides `stopJob()` which sets status to `cancelled`

### 4. `src/components/admin/seo/ContentQueue.tsx`
- Replace `GenerationProgress` with job-based progress that persists across page reloads
- Add "Stop" button
- Show job history (last completed job result)

### 5. `src/components/admin/seo/queue/GenerationProgress.tsx`
- Update to accept job data instead of client-side progress
- Show "retry pass" indicator when auto-retry is running

## Technical Details

### Edge Function Self-Chain Call
```typescript
// Fire-and-forget: call self to continue
const selfUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bulk-generate-articles`;
fetch(selfUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ jobId: job.id }),
}).catch(() => {}); // Fire and forget
```

### Generation Job Lifecycle
```text
Status: processing -> completed | failed | cancelled
Fields used:
  - queue_item_ids: all item IDs to process
  - total_items: count of items
  - succeeded_items: count completed
  - failed_items: count failed
  - bail_reason: CREDIT_EXHAUSTED | RATE_LIMITED | null
  - status: processing | completed | cancelled | failed
```

### Retry Logic (Single Attempt)
```text
After main pass completes:
1. Query content_queue for items in queue_item_ids where status = 'failed'
2. Filter out items where error_message starts with 'CREDIT_EXHAUSTED:' or 'RATE_LIMITED:'
3. If retryable items exist AND this is not already a retry pass:
   - Reset their status to 'queued'
   - Update job: set a 'retry_pass' flag in metadata
   - Self-chain to process them
4. If this IS already a retry pass, or no retryable items: mark job complete
```

### Client-Side Hook (useGenerationJob)
```typescript
// Polls generation_jobs for active job
const { data: activeJob } = useQuery({
  queryKey: ['generation-job-active'],
  queryFn: async () => {
    const { data } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
  refetchInterval: (query) => query.state.data ? 3000 : 10000,
});
```

## What Changes for You

Before: Click "Generate All" -> keep browser open for hours -> if phone locks, generation stops

After: Click "Generate All" -> close browser whenever -> come back later -> see progress/results. Failed items get one auto-retry. Credit/rate errors stop immediately with a clear message.

