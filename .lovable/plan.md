
# Fix "Create All Pillars" Error

## Root Cause

The `content_queue` table has a CHECK constraint on the `priority` column: `priority >= 1 AND priority <= 100`. However, the "Create All Pillars" code in `TemplateCoverageMap.tsx` sets `priority: 200` for pillar articles, which violates this constraint and causes the insert to fail silently with "Unknown error".

## Fix

**File: `src/components/admin/seo/TemplateCoverageMap.tsx` (line 87)**

Change `priority: 200` to `priority: 100` (the maximum allowed value), keeping pillar articles at the highest priority level.

## Technical Details

- The constraint is: `CHECK ((priority >= 1) AND (priority <= 100))`
- Current code sets: `priority: 200` (violates constraint)
- Fix: Set `priority: 100` (max allowed, highest priority)
- No database migration needed -- the existing constraint range is fine; pillar articles at priority 100 already places them at the top of the queue
