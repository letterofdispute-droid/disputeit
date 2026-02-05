
# Fix: Content Queue Data Fetching and Progress Tracking

## Root Cause Analysis

Your progress bars and queue stats are showing incorrect data because of a **query limit issue**:

| What's Happening | Database Reality | UI Shows |
|------------------|------------------|----------|
| Poor Workmanship articles | 7 generated | 3/7 progress |
| Total queued items | 191 queued | 32 queued |
| Total items | 433 items | Only 200 fetched |

The `useContentQueue` hook limits results to 200 items, but there are now 433 items in the queue. For templates whose items fall outside this window, progress bars show incorrect counts.

## Solution Overview

1. **Smart data fetching** - Fetch aggregated stats from database instead of calculating client-side
2. **Separate queries** for different use cases (coverage map vs queue management)
3. **Pagination** for the queue table to handle large item counts

## Implementation Plan

### Part 1: Add Database-Side Stats Calculation

Instead of fetching all items and counting client-side, fetch pre-calculated stats per template:

**New query approach for Coverage Map:**
- Query `content_plans` with a count of generated/total items per plan
- This gives accurate stats regardless of how many items exist

### Part 2: Fix useContentQueue Hook

**File: `src/hooks/useContentQueue.ts`**

1. Remove the `.limit(200)` restriction when fetching for a specific plan
2. When fetching globally (for Queue tab), add pagination support
3. Add a separate stats-only query that aggregates counts

### Part 3: Update TemplateCoverageMap

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**

Instead of filtering queue items client-side, use a dedicated hook that fetches accurate counts per template directly from the database.

### Part 4: Update ContentQueue Component

**File: `src/components/admin/seo/ContentQueue.tsx`**

Add pagination or virtual scrolling to handle large item lists, with accurate global stats from a separate aggregation query.

## Technical Changes

### useContentQueue.ts Changes

```typescript
// When fetching for a specific plan, remove limit
if (planId) {
  query = query.eq('plan_id', planId);
  // No limit for specific plan - need all items for accurate stats
} else {
  // For global queue view, keep limit but add pagination
  query = query.limit(500); // Increase limit for queue view
}

// Add separate stats query
const { data: globalStats } = useQuery({
  queryKey: ['content-queue-stats'],
  queryFn: async () => {
    const { data } = await supabase
      .from('content_queue')
      .select('status')
    // Count by status
    return {
      queued: data?.filter(i => i.status === 'queued').length || 0,
      // ... etc
    };
  }
});
```

### New useTemplateProgress Hook

Create a dedicated hook for coverage map progress that queries efficiently:

```typescript
// Fetch article counts per template from database
const { data: templateProgress } = useQuery({
  queryKey: ['template-progress'],
  queryFn: async () => {
    const { data } = await supabase
      .from('content_queue')
      .select('plan_id, status, content_plans!inner(template_slug)')
    
    // Aggregate by template
    const progress: Record<string, {generated: number, total: number}> = {};
    // ... aggregation logic
    return progress;
  }
});
```

## Files to Modify

1. **`src/hooks/useContentQueue.ts`**
   - Remove limit when querying by planId
   - Increase global limit to 500-1000
   - Add separate stats aggregation query

2. **`src/hooks/useTemplateProgress.ts`** (new file)
   - Dedicated hook for template coverage progress
   - Efficient aggregation query

3. **`src/components/admin/seo/TemplateCoverageMap.tsx`**
   - Use new useTemplateProgress hook
   - Remove dependency on useContentQueue for stats

4. **`src/components/admin/seo/queue/QueueStats.tsx`**
   - Use aggregated stats from useContentQueue

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Poor Workmanship progress | 3/7 | 7/7 ✓ |
| Queue tab: Queued count | 32 | 191 (actual) |
| Queue tab: Total visible | 200 | All items with pagination |
| Retry tracking | Items disappear | All items tracked correctly |

## Deployment

After implementation, the edge function deployment timeout issue should be resolved separately by:
1. Waiting for platform stability
2. Manually triggering deployment via the retry flow
