

# Fix: Auto-Create Missing Content Plans

## What's Happening

Your codebase now has **550 templates** but only **547 content plans** exist in the database. Three templates were added to the code without running "Plan All" for their category, so they show as uncovered -- dropping you from 100% to 99%.

## The Fix

Run a one-time database operation to create content plans for the 3 missing templates. This requires:

1. Identifying which 3 template slugs in code don't have matching `content_plans` rows
2. Inserting content plans for them with the correct category and tier

## Technical Approach

**Step 1**: Query the database to find which slugs are missing plans (we'll cross-reference against the code's template list at runtime).

**Step 2**: Add a small helper in `TemplateCoverageMap.tsx` -- inside the existing "Plan All" per-category button flow, it already handles templates without plans. So the simplest path is:

- Open each category in the Coverage Map
- Find the 3 uncovered templates (they'll show a "+" icon)
- Click "Plan All" on that category -- it only creates plans for templates that don't have one

Alternatively, I can write a one-time SQL migration that inserts the 3 missing plans directly, but I'd need to know their exact slugs. I can do this by adding a quick diagnostic: temporarily log `allTemplates` slugs vs `content_plans` slugs in the browser console.

**Recommended approach**: Add a "Create Missing Plans" button next to "Create All Pillars" that automatically finds templates in `allTemplates` without a matching plan and bulk-creates them. This prevents the problem from recurring whenever new templates are added to code.

## Changes

**File: `src/components/admin/seo/TemplateCoverageMap.tsx`**

- Add a `createMissingPlansMutation` that:
  1. Gets all template slugs from `allTemplates` (code)
  2. Gets all template slugs from `content_plans` (database)
  3. Finds the difference (templates without plans)
  4. For each missing template, inserts a content plan with the appropriate category tier
- Show a "Create Missing Plans" button (only visible when there are uncovered templates) next to "Create All Pillars"

This ensures that any time new templates are added to the code, you can one-click sync them to 100% coverage.

## Scope
- 1 file modified (`TemplateCoverageMap.tsx`)
- No database schema changes
- No edge function changes
