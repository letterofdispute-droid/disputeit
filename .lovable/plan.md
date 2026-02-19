

# Fix: Reconcile Counts Statement Timeout

## Problem
The `reconcile_link_counts` database function is timing out. It regex-scans 68 MB of HTML content across 5,780 published articles -- far too heavy for the default PostgREST statement timeout (~8 seconds).

## Solution: Set a longer statement timeout inside the function

PostgreSQL allows setting `statement_timeout` at the function level using `SET statement_timeout`. This only affects the function execution and does not change the global timeout. The reconciliation is a legitimate heavy operation that should be allowed to run longer.

## Changes

### Migration: Update `reconcile_link_counts` function with extended timeout

Add `SET statement_timeout = '120s'` to the function definition. This gives the function up to 2 minutes to complete, which is sufficient for 68 MB of content.

The function body remains identical -- only the function signature changes to include the timeout setting.

```sql
CREATE OR REPLACE FUNCTION public.reconcile_link_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '120s'   -- <-- new line
AS $function$
-- ... existing body unchanged ...
$function$
```

### Files Changed

| File | Change |
|------|--------|
| New migration SQL | Re-create `reconcile_link_counts` with `SET statement_timeout = '120s'` |

### No UI changes needed
The existing UI code (`LinkActions.tsx` and `useSemanticLinkScan.ts`) already handles success/error states correctly. Once the timeout is extended, the function will complete and return results as expected.

### Expected Outcome
- "Reconcile Counts" will complete successfully instead of timing out
- All 5,780 published articles will be scanned for link references
- Inbound/outbound counts and ghost suggestions will be corrected
- The orphan count of 198 will be updated based on the newly applied links from the rescue operation
