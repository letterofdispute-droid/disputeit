

# Fix: Keyword Planning Misses Verticals Due to Row Limit

## Root Cause

The `plan-from-keywords` edge function discovers which verticals to process by fetching ALL unused keyword rows and extracting distinct verticals client-side:

```sql
SELECT vertical FROM keyword_targets WHERE used_in_queue_id IS NULL
-- Returns max 1000 rows (PostgREST default), missing verticals beyond that
```

With ~4000 unused keywords, this only returns the first 1000 rows. Verticals whose rows fall outside that window (consumer-rights, ecommerce, financial, hoa, refunds, utilities) are never included in the job.

## Fix

### 1. Edge function: Use distinct RPC or explicit query (`supabase/functions/plan-from-keywords/index.ts`)

Replace the problematic vertical discovery query (lines 76-83) with a query that selects distinct verticals directly, avoiding the row limit:

```sql
SELECT DISTINCT vertical FROM keyword_targets WHERE used_in_queue_id IS NULL
```

Since PostgREST doesn't support `DISTINCT` directly, we'll create a small RPC function for this.

### 2. Database migration: Add `get_unused_keyword_verticals` RPC

Create a simple SQL function:

```sql
CREATE OR REPLACE FUNCTION get_unused_keyword_verticals()
RETURNS TABLE(vertical text) AS $$
  SELECT DISTINCT vertical FROM keyword_targets WHERE used_in_queue_id IS NULL ORDER BY vertical;
$$ LANGUAGE sql STABLE;
```

This returns only the distinct vertical names (max ~13 rows), completely avoiding the row limit issue.

### 3. Edge function update

Replace:
```typescript
const { data: verticalData } = await supabase
  .from('keyword_targets')
  .select('vertical')
  .is('used_in_queue_id', null);

verticalsToProcess = [...new Set(verticalData.map(d => d.vertical))].sort();
```

With:
```typescript
const { data: verticalData } = await supabase.rpc('get_unused_keyword_verticals');
verticalsToProcess = (verticalData || []).map(d => d.vertical);
```

## Files Changed

- **New migration**: Create `get_unused_keyword_verticals` RPC function
- **Modified**: `supabase/functions/plan-from-keywords/index.ts` -- use RPC instead of raw row fetch (1 line change)

## After This Fix

Click "Plan All Keywords" again. All 6 remaining verticals with unused seeds (consumer-rights, ecommerce, financial, hoa, refunds, utilities) will be picked up and processed by the AI. The progress panel will show each one being planned in real time.

