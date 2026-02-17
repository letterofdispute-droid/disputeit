

# Fix: Add Unique Constraint on content_plans.template_slug

## Root Cause

The `plan-from-keywords` edge function uses `.upsert()` with `onConflict: 'template_slug'` on the `content_plans` table (line 392-398), but `template_slug` only has a regular (non-unique) index. PostgreSQL requires a unique constraint for ON CONFLICT to work.

Every single column group across all 13 verticals hit this error:
```
Failed to create content plan: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

Result: 0 articles planned despite the AI successfully clustering keywords.

## Fix

Two changes needed:

### 1. Database Migration
Add a unique constraint on `content_plans.template_slug`:
```sql
ALTER TABLE content_plans ADD CONSTRAINT content_plans_template_slug_key UNIQUE (template_slug);
```

### 2. Fix article_type for pillars
Looking at the code, pillar articles are inserted with `article_type: 'pillar'` (line 416), but the `content_queue` table has a check constraint limiting valid types to: `how-to`, `mistakes`, `rights`, `sample`, `faq`, `case-study`, `comparison`, `checklist`. The value `'pillar'` is not in that list and would cause another insertion failure.

The fix: use the AI-suggested article_type (e.g., `how-to`) for the pillar queue item, and store the pillar/cluster role via the `parent_queue_id` relationship (pillars have `parent_queue_id = null`, clusters have it set).

**File: `supabase/functions/plan-from-keywords/index.ts` (line 416)**
Change `article_type: 'pillar'` to `article_type: pillarType` (which is already correctly computed on line 409).

## Files Changed

- **New migration**: Add unique constraint on `content_plans.template_slug`
- **Modified**: `supabase/functions/plan-from-keywords/index.ts` -- Fix line 416 to use `pillarType` instead of hardcoded `'pillar'`

## After Fix

Re-running "Plan All Keywords" should successfully create 800-1,200+ articles from all 3,931 unused keywords with proper pillar/cluster hierarchy.

