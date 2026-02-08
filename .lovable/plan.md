
# Fix: Stuck Bulk Planning Jobs (Edge Function Timeout Issue)

## Root Cause Analysis

The E-commerce bulk planning job is stuck at 7/40 templates because of a fundamental architectural flaw:

### The Problem

```text
Edge Function Timeline:
+----------------+------------------+--------------------+
|   Request In   |  Return Response | Background IIFE   |
|                |                  | (async ()=>{...})  |
+-------+--------+--------+---------+---------+---------+
        |                 |                   |
        v                 v                   X
    Job Created     Response Sent      PROCESS KILLED!
                                       (no keepalive)
```

The `bulk-plan-category` Edge Function:
1. Creates a job record in the database (lines 511-527)
2. Returns an HTTP response immediately (lines 536-543)
3. Attempts to run background processing via an async IIFE (lines 552-643)

**But Edge Functions terminate once the response is sent.** Deno/Edge Functions don't support `waitUntil()` like Cloudflare Workers do. The async IIFE gets killed after processing a few templates (7 in this case), leaving the job stuck in "processing" forever.

### Why It Worked for Smaller Categories

Smaller categories (10-15 templates) might complete before the Edge Function timeout, but larger categories like E-commerce (40 templates) will always fail.

---

## Solution: Chunked Processing with Self-Invocation

Instead of processing all templates in one function call, we need to:

1. **Process in small batches (3-5 templates per call)**
2. **Self-invoke to continue processing the remaining templates**
3. **Use the database as state management between calls**

### New Architecture

```text
Call 1:                Call 2:                Call 3:
+---------+           +---------+           +---------+
| Process |   --->    | Process |   --->    | Process |
| 1-5     |  invoke   | 6-10    |  invoke   | 11-15   | ...
+---------+           +---------+           +---------+
     |                     |                     |
     v                     v                     v
  DB Update             DB Update             DB Update
```

Each call:
1. Reads current job state from database
2. Processes next batch of unprocessed templates
3. Updates job progress in database
4. Invokes itself to continue if more templates remain

---

## Implementation Details

### 1. Modify `supabase/functions/bulk-plan-category/index.ts`

**Key Changes:**

```typescript
// New constants
const BATCH_SIZE = 3; // Process 3 templates per function call
const SUPABASE_FUNCTIONS_URL = Deno.env.get('SUPABASE_URL')! + '/functions/v1';

// Two modes:
// Mode 1: Initial call - create job, start processing
// Mode 2: Continuation call - resume processing with jobId

interface ContinuationRequest {
  jobId: string;
  authToken: string; // Pass auth token for self-invocation
}

serve(async (req) => {
  const body = await req.json();
  
  // Check if this is a continuation call
  if (body.jobId) {
    return await processNextBatch(body.jobId, body.authToken);
  }
  
  // Otherwise, it's an initial request - create job and start
  // ... existing job creation logic ...
  
  // Instead of background IIFE, invoke self for first batch
  await invokeSelf(job.id, authHeader);
  
  return new Response(JSON.stringify({ success: true, jobId: job.id }));
});

async function invokeSelf(jobId: string, authToken: string) {
  await fetch(`${SUPABASE_FUNCTIONS_URL}/bulk-plan-category`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId, authToken }),
  });
  // Fire-and-forget: don't await response
}

async function processNextBatch(jobId: string, authToken: string) {
  // 1. Fetch job from database
  const job = await getJob(jobId);
  if (!job || job.status !== 'processing') {
    return Response.json({ status: 'completed' });
  }
  
  // 2. Find next unprocessed templates
  const processed = new Set([...job.processed_slugs, ...job.failed_slugs]);
  const remaining = job.template_slugs.filter(s => !processed.has(s));
  
  if (remaining.length === 0) {
    // All done - mark complete
    await markJobComplete(jobId);
    return Response.json({ status: 'completed' });
  }
  
  // 3. Process batch
  const batch = remaining.slice(0, BATCH_SIZE);
  for (const slug of batch) {
    try {
      await generatePlanForTemplate(slug, ...);
      // Update DB incrementally
    } catch (error) {
      // Track failure
    }
  }
  
  // 4. Self-invoke for next batch if more remaining
  if (remaining.length > BATCH_SIZE) {
    await invokeSelf(jobId, authToken);
  } else {
    // This was the last batch
    await markJobComplete(jobId);
  }
  
  return Response.json({ status: 'processing', processed: batch.length });
}
```

### 2. Add Stale Job Detection + Recovery UI

Add a "Cancel" or "Mark Failed" button for stuck jobs:

**In `BulkPlanningProgress.tsx`:**

```typescript
// Detect if job is stuck (no progress for 5+ minutes)
const lastUpdate = new Date(job.updated_at);
const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / 60000;
const isStuck = job.status === 'processing' && minutesSinceUpdate > 5;

// Show cancel button for stuck jobs
{isStuck && (
  <Button variant="destructive" size="sm" onClick={onCancelJob}>
    Cancel Stuck Job
  </Button>
)}
```

**In `useBulkPlanningJob.ts`:**

```typescript
const cancelJobMutation = useMutation({
  mutationFn: async (jobId: string) => {
    const { error } = await supabase
      .from('bulk_planning_jobs')
      .update({ 
        status: 'failed', 
        completed_at: new Date().toISOString(),
        error_messages: { _cancelled: 'Job cancelled by user' }
      })
      .eq('id', jobId);
    if (error) throw error;
  },
  onSuccess: () => {
    toast({ title: 'Job cancelled' });
    invalidateJobs();
  },
});
```

### 3. Immediate Fix: Manually Mark Current Job as Failed

For the currently stuck job, we need to mark it as failed so you can retry:

```sql
-- Mark the stuck E-commerce job as failed
UPDATE bulk_planning_jobs 
SET 
  status = 'failed',
  completed_at = NOW(),
  error_messages = error_messages || '{"_timeout": "Job timed out due to Edge Function limits"}'::jsonb
WHERE id = 'e53f46dc-c75c-40f6-bb2a-cc496e96fef7';
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/bulk-plan-category/index.ts` | **Rewrite** | Implement chunked self-invocation pattern |
| `src/components/admin/seo/BulkPlanningProgress.tsx` | **Modify** | Add stuck detection + cancel button |
| `src/hooks/useBulkPlanningJob.ts` | **Modify** | Add cancelJob mutation |

---

## Database Migration

Mark the currently stuck job as failed:

```sql
UPDATE bulk_planning_jobs 
SET status = 'failed', 
    completed_at = NOW(),
    error_messages = error_messages || '{"_timeout": "Edge Function timeout"}'::jsonb
WHERE status = 'processing' 
  AND updated_at < NOW() - INTERVAL '10 minutes';
```

---

## Expected Results

After implementation:

1. **Immediate**: The stuck E-commerce job will be marked as failed and can be retried
2. **Going forward**: Jobs will process in batches of 3 templates, each within Edge Function time limits
3. **UI improvement**: Stuck jobs will show a "Cancel" button after 5 minutes of no progress
4. **Reliability**: Categories with 40+ templates will complete successfully through self-invocation chain

---

## Technical Tradeoffs

| Approach | Pros | Cons |
|----------|------|------|
| **Self-invocation (chosen)** | Works within Edge Function limits, no external dependencies | Slightly more complex, adds network latency between batches |
| **External scheduler (pg_cron)** | More robust | Requires additional setup, less real-time feedback |
| **Supabase Queue (pgmq)** | Industry standard pattern | Adds dependency, more complex setup |

The self-invocation pattern is the most pragmatic fix given the current architecture.
