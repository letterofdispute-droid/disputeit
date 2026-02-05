
# Fix Stuck "Generating" Articles: Stale Status Detection & Recovery

## Problem Identified

The article "The Magnuson-Moss Warranty Act: Your Ally Against Subcontractor Issues" is stuck in `status: 'generating'` with:
- `generated_at: null`
- `error_message: null`
- Created at: `2026-02-05 08:15:13`

**Root Cause Analysis:**

From the edge function logs:
1. The `bulk-generate-articles` function processed 6 articles successfully before timing out
2. Edge function execution time: **125,485ms (over 2 minutes)** 
3. Connection reset errors occurred during AI image generation
4. The 7th article ("Magnuson-Moss...") was marked as `generating` but the function timed out before it could complete or mark it as `failed`

**Why this happens:**
- Edge functions have timeout limits (~150s on free tier, 400s on paid)
- Processing multiple AI-generated images per article takes 30-60 seconds each
- When timeout occurs, there's no cleanup mechanism to mark in-progress items as failed
- The frontend only polls while `generationProgress` is active (which stops when the HTTP request completes/errors)

---

## Solution: Multi-Layer Recovery System

### 1. Database Trigger for Stale Detection

Create a function that automatically marks items stuck in "generating" for more than 10 minutes as "failed":

```sql
-- Function to detect and recover stale generating items
CREATE OR REPLACE FUNCTION public.recover_stale_generating_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.content_queue
  SET 
    status = 'failed',
    error_message = 'Generation timed out after 10 minutes'
  WHERE 
    status = 'generating'
    AND created_at < NOW() - INTERVAL '10 minutes'
    AND (generated_at IS NULL);
END;
$function$
```

### 2. Frontend Stale Detection Hook

Add automatic detection of stale items in the UI:

```typescript
// In useContentQueue.ts

// Add stale detection helper
const getStaleGeneratingItems = useCallback(() => {
  if (!queueItems) return [];
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  return queueItems.filter(item => 
    item.status === 'generating' && 
    new Date(item.created_at) < tenMinutesAgo
  );
}, [queueItems]);

// Expose a mutation to reset stale items
const resetStaleMutation = useMutation({
  mutationFn: async (ids: string[]) => {
    const { error } = await supabase
      .from('content_queue')
      .update({ 
        status: 'failed', 
        error_message: 'Generation timed out - automatically detected' 
      })
      .in('id', ids);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['content-queue'] });
    toast({ title: 'Stale items marked as failed', description: 'You can now retry them' });
  },
});
```

### 3. Always-On Polling for Active Plans

Update the `refetchInterval` to poll whenever there are items in `generating` status (not just when `generationProgress` is set):

```typescript
const hasGeneratingItems = queueItems?.some(item => item.status === 'generating');

const { data: queueItems, ... } = useQuery({
  ...
  // Poll when there are generating items OR during active generation
  refetchInterval: (generationProgress || hasGeneratingItems) ? 5000 : false,
});
```

### 4. Edge Function Improvements

Add a pre-check at the start of bulk generation that cleans up stale items:

```typescript
// At the start of bulk-generate-articles, before processing
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

await supabaseAdmin
  .from('content_queue')
  .update({ 
    status: 'failed', 
    error_message: 'Previous generation timed out' 
  })
  .eq('status', 'generating')
  .lt('created_at', tenMinutesAgo);

console.log('Cleaned up stale generating items');
```

### 5. Smaller Batch Processing

Reduce the risk of timeouts by processing fewer articles per function call:

```typescript
// In bulk-generate-articles, limit to 3 articles per invocation
const maxArticlesPerBatch = 3;
const itemsToProcess = queueItems.slice(0, maxArticlesPerBatch);
```

The frontend can then chain multiple calls if needed.

---

## UI Enhancement: Stale Item Warning

In ClusterPlanner, show a warning when stale items are detected:

```tsx
// Add stale detection
const staleItems = planQueueItems.filter(item => {
  if (item.status !== 'generating') return false;
  const createdAt = new Date(item.created_at);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return createdAt < tenMinutesAgo;
});

// Show warning banner
{staleItems.length > 0 && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription>
      {staleItems.length} item(s) appear stuck. 
      <Button variant="link" onClick={handleMarkStaleAsFailed}>
        Mark as failed and retry
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add `recover_stale_generating_items()` function |
| `src/hooks/useContentQueue.ts` | Add stale detection, always-poll when generating, reset mutation |
| `src/components/admin/seo/ClusterPlanner.tsx` | Add stale warning banner with "Mark as failed" action |
| `supabase/functions/bulk-generate-articles/index.ts` | Pre-clean stale items, limit batch size to 3 |

---

## Expected Behavior After Fix

1. **Immediate recovery**: Existing stuck item will be detected as stale and shown with a warning
2. **User can retry**: Clicking "Mark as failed" allows immediate retry
3. **Future prevention**: 
   - Smaller batches reduce timeout risk
   - Edge function cleans up old stale items on each run
   - UI continuously polls until all items complete
4. **Automatic cleanup**: Items stuck for 10+ minutes automatically marked as failed

---

## Immediate Manual Fix

To unblock the current stuck item right now, run this query:

```sql
UPDATE content_queue 
SET status = 'failed', error_message = 'Generation timed out'
WHERE id = '3c060fc6-5961-4c94-b253-cba47074cc6e';
```

Then the item will appear as "failed" and can be retried normally.
