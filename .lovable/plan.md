

# Plan: Fix False "Missing Pillars" Count

## Root Cause

The data tells the full story:

| Location | Pillar Count |
|---|---|
| `content_queue` (where the code looks) | **0** |
| `blog_posts` (where they actually are) | **547** (all published) |

The `missingPillarCount` query in `TemplateCoverageMap.tsx` (lines 117-141) only checks `content_queue` for rows with `article_type = 'pillar'`. But after pillar articles were generated and published, their `content_queue` entries were cleaned up (deleted). The 547 pillar articles exist as published blog posts linked to their content plans via `content_plan_id`, but the code never checks there.

Result: the UI reports 559 "missing" pillars when only ~12 are actually missing (687 plans minus the ~547 that have published pillars, plus some keyword-campaign plans).

## What Changes

**1 file edited**: `src/components/admin/seo/TemplateCoverageMap.tsx`

### Fix 1: Update `missingPillarCount` query (lines 117-141)

Change the query to check **both** `content_queue` and `blog_posts` for existing pillars:

```text
For each batch of plan IDs:
  1. Check content_queue for article_type='pillar' matching plan_id  (existing logic)
  2. ALSO check blog_posts for article_type='pillar' matching content_plan_id  (new)
  3. Union both sets of plan IDs → these plans have pillars
  4. Missing = plans NOT in that union
```

### Fix 2: Update `createAllPillarsMutation` (lines 144-180)

The mutation at line 151-154 has the same bug -- it only checks `content_queue`. It also has a secondary bug: no `.limit()` call, so it's capped at 1000 rows by PostgREST default. Fix both:

1. Also query `blog_posts` for existing pillar `content_plan_id` values
2. Merge both sets before filtering
3. Add batching to handle >1000 plans

### No schema changes, no new files, no new dependencies

