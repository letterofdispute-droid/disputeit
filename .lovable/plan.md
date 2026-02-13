

# Fix: Self-Chain Timeout in Bulk Article Generation

## Problem

The `selfChainWithRetry` function awaits the full HTTP response of the next chained edge function call. Since each article now takes longer (with proper image compression), the connection exceeds the ~150-second edge function limit. The downstream function finishes its work, but the chain breaks because the caller's connection was killed.

## Why This Is the Correct Fix (Not a Workaround)

The self-chain's only job is to **trigger** the next invocation — it never uses the response data. Awaiting the full response was always unnecessary; it just didn't cause problems before because articles generated fast enough. The AbortController pattern is the standard Web/Deno API approach for "fire a request and confirm receipt."

Nothing else in the system is affected:
- Article processing, image generation, error handling, bail-out logic, job progress tracking, and pg_cron recovery all remain untouched.
- The only change is HOW LONG the self-chain waits for acknowledgment (10 seconds instead of the full processing time).

## Technical Changes

### File: `supabase/functions/bulk-generate-articles/index.ts`

Replace `selfChainWithRetry` (lines 1159-1185) with an AbortController-based version:

```typescript
async function selfChainWithRetry(jobId: string): Promise<void> {
  const selfUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/bulk-generate-articles`;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({ jobId });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[SELF_CHAIN] Attempt ${attempt} for job ${jobId}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(selfUrl, {
          method: 'POST', headers, body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.ok || response.status === 504) {
          console.log(`[SELF_CHAIN] Attempt ${attempt} accepted (${response.status})`);
          return;
        }
        console.warn(`[SELF_CHAIN] Attempt ${attempt} got ${response.status}`);
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
          console.log(`[SELF_CHAIN] Attempt ${attempt} timed out (expected) -- function is running`);
          return; // Success: function was invoked
        }
        throw fetchErr;
      }
    } catch (err) {
      console.warn(`[SELF_CHAIN] Attempt ${attempt} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
  }
  console.error(`[SELF_CHAIN] CRITICAL: failed after 2 attempts for job ${jobId}. pg_cron will recover.`);
}
```

### Deployment

The `bulk-generate-articles` edge function will be redeployed automatically.

### Testing

Generate a batch of 10-20 articles from the queue to confirm the chain no longer breaks.
