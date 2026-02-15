

# Fix: Link Suggestions Not Populating During Active Scan

## Root Cause

Two issues combine to make it look broken:

1. The scan mutation fires `onError` when the HTTP connection times out (expected with long-running edge functions). This shows a scary red error toast even though the scan continues in the background via self-chaining and pg_cron recovery.

2. The `link-suggestions` query is only invalidated in the scan mutation's `onSuccess` handler. Since the frontend sees an error (not success), it never refetches. The 1,641 pending suggestions sitting in the database are invisible to the UI.

## Changes

### 1. `src/hooks/useLinkSuggestions.ts` -- Auto-refetch during active scan

Add a `refetchInterval` to the suggestions query that activates when a scan job is running. This way, as the background scan creates suggestions, they appear in the UI automatically.

- Accept an optional `isScanRunning` parameter
- When true, refetch every 10 seconds so new suggestions appear progressively
- When false, no auto-refetch (normal behavior)

### 2. `src/components/admin/seo/LinkSuggestions.tsx` -- Pass scan state to hook

- Import `useSemanticLinkScan` to get `isScanJobRunning`
- Pass it to `useLinkSuggestions` so the auto-refetch activates during scans

### 3. `src/hooks/useSemanticLinkScan.ts` -- Suppress misleading error toast

The scan mutation's `onError` handler currently shows "Semantic scan failed" for any error, including expected HTTP timeouts. Update it to:

- Check if a scan job exists in `processing` state
- If yes, show an info toast ("Scan continues in background...") instead of a destructive error
- If no active job, show the error as before

### 4. `src/hooks/useLinkSuggestions.ts` -- Fix stats to use DB counts

The `getStats` function currently counts from the loaded 200-item array, which is misleading. Add a separate count query that fetches real totals from the database so the "Pending: X, Approved: Y" stats reflect actual numbers.

## Technical Details

### useLinkSuggestions changes:
```text
- Add parameter: isScanRunning?: boolean
- Add to useQuery options: refetchInterval: isScanRunning ? 10000 : false
- Add a new useQuery for stats counts:
    SELECT status, count(*) FROM link_suggestions GROUP BY status
  This gives accurate totals independent of the 200-row display limit
```

### useSemanticLinkScan onError change:
```text
onError: (error) => {
  // Check if job is still running in background
  const isJobActive = activeScanJob?.status === 'processing';
  if (isJobActive || error.message?.includes('Failed to send') || error.message?.includes('Failed to fetch')) {
    toast({ title: 'Scan continues in background', description: 'The link scan is still running...' });
  } else {
    toast({ title: 'Semantic scan failed', ... , variant: 'destructive' });
  }
}
```

### LinkSuggestions component:
```text
- Import useSemanticLinkScan to get isScanJobRunning
- Pass to useLinkSuggestions(statusFilter, undefined, isScanJobRunning)
- Use DB-based stats instead of array-based stats
```
