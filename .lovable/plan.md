

# Fix: Template Coverage Map Showing Wrong Article Counts

## Problem

The Template Coverage Map shows incorrect progress numbers (e.g., "2/2 Done" instead of "10/10") because the `useTemplateProgress` hook hits the default 1,000-row limit when fetching from `content_queue`. With 2,547 queue items in the database, only the first 1,000 are returned, causing templates to show partial or missing counts.

## Solution

Replace the client-side aggregation approach with a **server-side aggregation** using an RPC function. Instead of fetching all 2,547+ rows and counting in JavaScript, a database function will return pre-aggregated counts per template slug -- just ~470 small rows instead of thousands.

## Changes

### 1. Database Migration -- Create `get_template_progress` RPC

A SQL function that groups `content_queue` by template slug and returns the total and generated counts:

```sql
CREATE FUNCTION get_template_progress()
RETURNS TABLE(template_slug text, total bigint, generated bigint)
AS $$
  SELECT cp.template_slug,
         count(*) as total,
         count(*) FILTER (WHERE cq.status IN ('generated','published')) as generated
  FROM content_queue cq
  JOIN content_plans cp ON cp.id = cq.plan_id
  GROUP BY cp.template_slug
$$;
```

This returns ~470 rows (one per template) instead of 2,547+ individual queue items.

### 2. Update `src/hooks/useTemplateProgress.ts`

Replace the current fetch-all-rows approach with a single `supabase.rpc('get_template_progress')` call and map the results into the same `Record<string, TemplateProgress>` shape.

## Why This Fixes It

| Aspect | Before | After |
|--------|--------|-------|
| Rows fetched | 1,000 (of 2,547) | ~470 (aggregated) |
| Accuracy | Partial -- misses 60% of data | 100% accurate |
| Performance | Downloads 1,000 rows of queue data | Downloads ~470 tiny summary rows |
| Scales to 5,000+ items | Breaks further | Still ~470 rows |

