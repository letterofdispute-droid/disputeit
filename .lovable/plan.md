

# Plan: Asynchronous Bulk Content Planning with Progress Tracking

## Problem Statement
When clicking "Plan 41" for a category, the current implementation:
1. Calls `generatePlan()` **sequentially** for each template (41 times)
2. Each call waits for AI to generate diverse titles (~3-5 seconds per plan)
3. **Total wait time: ~2-3 minutes** with UI frozen on "Creating Plans..."
4. No visibility into progress or ability to navigate away

The quality requirements (unique titles, banned patterns, cross-database deduplication) remain critical and are preserved.

---

## Solution: Backend Job Queue with Progress Polling

### Architecture Overview

```text
+------------------+     +-----------------------+     +---------------------+
|  Frontend UI     |     | bulk-plan-category    |     | generate-content-   |
|                  |     | edge function         |     | plan edge function  |
+------------------+     +-----------------------+     +---------------------+
        |                         |                           |
        | 1. Click "Plan 41"      |                           |
        |------------------------>|                           |
        |                         | 2. Create job record      |
        |                         | status: 'processing'      |
        |                         |                           |
        | 3. Return immediately   |                           |
        |<------------------------|                           |
        |    { jobId, status }    |                           |
        |                         |                           |
        | 4. Poll for progress    | 5. Process templates      |
        |------------------------>|    one by one             |
        |                         |-------------------------->|
        |                         |    update progress        |
        |                         |<--------------------------|
        |                         |                           |
        | 6. Show real-time       |                           |
        |    progress bar         |                           |
        +-------------------------+---------------------------+
```

### Key Benefits
- **Immediate UI response** - dialog closes instantly, progress shows in stats bar
- **Real-time progress** - see "Planning 5/41..." as each completes
- **Navigate freely** - leave page, come back, progress persists
- **Resilient to failures** - failed templates can be retried individually
- **Quality preserved** - same AI title generation with full diversity checks

---

## Implementation Details

### 1. New Database Table: `bulk_planning_jobs`

Track the progress of bulk planning operations:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| category_id | text | Category being planned |
| value_tier | text | 'high', 'medium', 'longtail' |
| total_templates | integer | Templates to process |
| completed_templates | integer | Templates processed so far |
| failed_templates | integer | Count of failures |
| status | text | 'processing', 'completed', 'failed' |
| template_slugs | text[] | List of slugs to process |
| processed_slugs | text[] | Already processed |
| error_messages | jsonb | Template-specific errors |
| created_at | timestamp | Job creation time |
| completed_at | timestamp | Job completion time |

### 2. New Edge Function: `bulk-plan-category`

Orchestrates the batch processing:

```typescript
// supabase/functions/bulk-plan-category/index.ts

// Phase 1: Create job and return immediately
const job = await createBulkPlanningJob({
  categoryId,
  valueTier,
  templateSlugs: templates.map(t => t.slug),
});

// Return job ID to frontend immediately
return { jobId: job.id, status: 'processing', total: templates.length };

// Phase 2: Process templates in background
for (const template of templates) {
  try {
    // Call existing generate-content-plan logic
    await generatePlanForTemplate(template, valueTier);
    
    // Update job progress
    await updateJobProgress(job.id, template.slug, 'success');
  } catch (error) {
    await updateJobProgress(job.id, template.slug, 'failed', error.message);
  }
}

// Mark job complete
await completeJob(job.id);
```

### 3. Frontend Progress Component

Replace blocking dialog with inline progress:

```text
+------------------------------------------+
| Travel (41 templates)                    |
|                                          |
| [████████████░░░░░░░░░░] 15/41 planned  |
| Currently: "Airline Delay Letter"        |
|                                          |
| [Cancel] or navigate away safely         |
+------------------------------------------+
```

### 4. Modified `TemplateCoverageMap.tsx` Flow

```typescript
// Old: Sequential blocking
for (const template of templates) {
  await generatePlan(template); // Waits 3-5s each
}

// New: Fire-and-forget with polling
const { jobId } = await startBulkPlan(categoryId, tier, templates);
// Dialog closes immediately

// Progress shown via separate poll query
const { data: job } = useQuery({
  queryKey: ['bulk-planning-job', categoryId],
  refetchInterval: 2000, // Poll every 2s
});
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/functions/bulk-plan-category/index.ts` | Create | New edge function for async batch processing |
| `src/hooks/useBulkPlanningJob.ts` | Create | Hook for starting jobs and polling progress |
| `src/components/admin/seo/BulkPlanningProgress.tsx` | Create | Inline progress component |
| `src/components/admin/seo/TemplateCoverageMap.tsx` | Modify | Use new async flow, show progress inline |
| `src/components/admin/seo/BulkPlanConfirmDialog.tsx` | Modify | Update messaging, close immediately on confirm |

**Database Migration:**
- Create `bulk_planning_jobs` table with RLS policies for admin-only access

---

## Quality Preservation

The existing title diversity system remains **completely unchanged**:

- Same `generate-content-plan` edge function called per template
- Same `BANNED_TITLE_STARTERS` validation
- Same cross-database deduplication (checks 500 existing titles)
- Same 2x buffer with retry loop for rejected titles
- Same question-mark limits and first-word uniqueness checks
- Same category-specific tone and terminology

The only change is **orchestration** - moving from synchronous frontend loop to asynchronous backend job queue.

---

## User Experience Flow

### Before (Current)
1. Click "Plan 41" → Confirmation dialog
2. Click "Create 41 Plans" → **Wait 2-3 minutes** (UI frozen)
3. Dialog closes, all plans created

### After (Proposed)
1. Click "Plan 41" → Confirmation dialog
2. Click "Start Planning" → Dialog closes **immediately**
3. Category row shows progress bar: "Planning 5/41..."
4. User can navigate away, progress persists
5. When complete, row updates to "All Planned ✓"

---

## Error Handling

- **Individual failures don't block batch** - continue with remaining templates
- **Failed templates tracked** - shown in UI with retry option
- **Stale job recovery** - jobs stuck >15 minutes auto-marked failed
- **Retry individual failures** - button to retry just failed templates

---

## Progress Polling Strategy

```typescript
// Poll every 2 seconds while job is active
const { data: activeJob } = useQuery({
  queryKey: ['bulk-planning-job', categoryId],
  queryFn: () => fetchActiveJob(categoryId),
  refetchInterval: (query) => {
    const job = query.state.data;
    // Stop polling when complete
    return job?.status === 'processing' ? 2000 : false;
  },
});
```

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| UI blocking time | 2-3 minutes | 0 seconds |
| User can navigate | No | Yes |
| Progress visibility | None | Real-time |
| Failure recovery | Restart all | Retry failed only |
| Total processing time | Same | Same (runs in background) |

