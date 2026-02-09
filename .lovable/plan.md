
# Fix: Self-Chain Stalls After Token Expiry

## Problem
The generation is stuck at "6 of 160" because the self-chaining mechanism breaks when your login token expires.

Here's what happens:
1. You start a 160-article batch -- your login token is sent with the request
2. Each batch of 3 articles takes about 30-60 seconds
3. The function finishes a batch, then calls itself to process the next batch, passing along your original login token
4. After about an hour, your login token expires
5. The next self-chain call fails authentication (401 Unauthorized) and silently dies
6. The job stays stuck as "processing" forever with no more batches firing

## Fix

### 1. `supabase/functions/bulk-generate-articles/index.ts`

**Skip auth check on continuation calls**: When the function is called as a continuation (has `jobId` + `remainingIds`), it was already authorized on the initial call. No need to re-verify the user token each time.

**Use service role for self-chain auth**: Instead of passing the user's expiring token, use the service role key (which never expires) as the Authorization header for self-chain calls.

Changes:
- Move the auth check (lines 851-869) so it only runs on the **initial call** (when there is no `existingJobId`)
- For continuation calls, verify the job exists and is still "processing" in the database (prevents unauthorized access)
- Update `selfChain()` to use `Bearer {serviceRoleKey}` instead of the user's token

### No other files change
The frontend already has the Stop button wired up. This is purely a backend reliability fix.

## How It Works After the Fix

```text
Initial call: User token verified -> job created -> process batch 1 -> self-chain with service role key
Continuation:  Service role key used -> verify job exists & is 'processing' -> process batch 2 -> self-chain
...continues until all 160 items are done (no token expiry possible)
```

## After Deploying

The current stuck job (id: `a915857f`) will need to be manually reset so you can retry the remaining 154 items. The fix prevents this from happening again on future runs.
