
Goal
Fix the mismatch where “Create Missing Plans” can say success but not actually increase queue articles, and recover the already-created empty plans (the 62 you just created).

What I found (root cause confirmed)
1) The recent button flow only inserts rows into `content_plans` and does not create any `content_queue` items.
- File: `src/components/admin/seo/TemplateCoverageMap.tsx`
- Current `createMissingPlansMutation` does:
  - find missing template slugs
  - `insert` into `content_plans`
  - no queue generation call

2) Your backend data currently matches exactly what you observed:
- Total content plans: 749
- Queue status counts: `queued=80`, `published=5689`, `generating=0`, `generated=0`
- Plans with zero queue items: 62
- Those 62 were created at the same timestamp (`2026-02-25 13:01`) and have zero queue + zero pillar posts

3) Why it felt “instant”
- The mutation is a plain DB insert (fast), then shows “added” toast.
- It does not start the async planning/generation pipeline, so “articles to generate” does not move.

Implementation plan

1) Fix the Coverage action so it creates full plans + queue (not plans-only)
File: `src/components/admin/seo/TemplateCoverageMap.tsx`

- Replace current `createMissingPlansMutation` behavior:
  - Keep missing-template detection
  - Instead of inserting directly into `content_plans`, start bulk planning jobs per category (using the existing backend function pathway)
  - Update messaging from “X content plans added” to “Started planning for X templates in background”
- This makes “Create Missing Plans” consistent with expected behavior: plans + queued articles.

2) Add orphan-plan recovery action for already-empty plans
File: `src/components/admin/seo/TemplateCoverageMap.tsx`

- Add query to detect template plans with no content yet:
  - no rows in `content_queue` for `plan_id`
  - and no rows in `blog_posts` for `content_plan_id` (safety against re-queuing already-published content)
- Surface button when count > 0:
  - “Backfill Articles for X Plans”
- This directly fixes your current broken state (the 62 empty plans).

3) Enable backend planner to repair existing plans with empty queues
File: `supabase/functions/bulk-plan-category/index.ts`

- In `generatePlanForTemplate(...)`, change the existing-plan logic:
  - Today: if plan exists -> skip
  - New:
    - if plan exists AND has content_queue/blog_posts content -> skip (already healthy)
    - if plan exists AND has no queue/posts -> generate and insert queue items into that existing plan (repair mode)
- Keep idempotent behavior (safe to retry without duplicate queue explosions).

4) Improve UX clarity so users don’t get misleading success
File: `src/components/admin/seo/TemplateCoverageMap.tsx`

- Distinguish toasts:
  - “Jobs started” (async)
  - “Nothing to backfill”
  - “Backfill completed/processing”
- Invalidate relevant queries after start:
  - `content-plans`
  - `template-progress`
  - `content-queue`
  - `queue-stats`
  - bulk job queries

5) Validation and safety checks (post-fix)
I will verify with both UI and backend counts:

```text
Before backfill:
- orphan plans = 62
- queued = 80

After backfill starts:
- bulk planning jobs appear in progress
- queued should increase substantially (based on tier sizes)

After completion:
- orphan plans = 0
- Coverage rows that were 0/10 now show real queue totals
- “Missing pillars” should also drop accordingly (because pillar queue items get created with cluster set)
```

Technical details (for transparency)
- No schema changes required.
- No auth/policy changes required.
- The key bug is not row limits this time; it is a workflow inconsistency:
  - “Create Missing Plans” currently bypasses the plan-generation pipeline that creates queue items.
- Recovery will be done through the existing asynchronous bulk planning pipeline, but with a repair path for already-created empty plans.

Execution order
1) Backend repair path in `bulk-plan-category` (so recovery is possible)
2) Frontend mutations in `TemplateCoverageMap` (so buttons trigger correct behavior)
3) Run the orphan backfill and verify counts end-to-end in Coverage + Queue tabs
