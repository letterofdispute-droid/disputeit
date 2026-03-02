

# Store All Site Pages in the Database

## Current state
- The `pages` table exists with 9 entries (about, contact, terms, etc.)
- ~15 hardcoded routes are missing: state-rights, deadlines, analyze-letter, consumer-news, small-claims (5 pages), do-i-have-a-case, cookie-policy, templates, articles, guides/:categoryId
- The table has no way to distinguish CMS-managed pages from system/hardcoded pages

## Plan

### 1. Add `page_type` column to `pages` table
Add a `page_type text DEFAULT 'cms'` column to distinguish page sources:
- `cms` — fully editable content pages (current behavior)
- `system` — hardcoded React pages (read-only content, but SEO meta is editable)

Also add `no_index boolean DEFAULT false` to track indexing status.

### 2. Seed missing hardcoded pages into the database
Insert ~15 missing routes with `page_type = 'system'` and proper meta titles/descriptions. Update the existing 9 entries to also have `page_type = 'system'` since they correspond to hardcoded components.

Pages to seed:

| Slug | Title | Type |
|------|-------|------|
| / | Home | system |
| state-rights | State Consumer Rights | system |
| deadlines | Dispute Deadlines | system |
| consumer-news | Consumer News | system |
| analyze-letter | Letter Analyzer | system |
| small-claims | Small Claims Guide | system |
| small-claims/cost-calculator | Small Claims Cost Calculator | system |
| small-claims/demand-letter-cost | Demand Letter Cost Guide | system |
| small-claims/escalation-guide | Escalation Guide | system |
| small-claims/statement-generator | Statement Generator | system |
| do-i-have-a-case | Do I Have a Case? | system |
| cookie-policy | Cookie Policy | system |
| templates | All Templates | system |
| articles | Articles | system |

### 3. Update Admin Pages UI
- Mark existing 9 pages as `page_type = 'system'`
- Add a "Type" badge column showing `system` vs `cms`
- System pages: Edit action opens SEO meta editor only (not full content editor)
- CMS pages: Full edit as before
- Add type filter alongside status filter
- Show `no_index` status indicator

### Files changed
- **Migration**: Add `page_type` and `no_index` columns to `pages` table
- **Data insert**: Seed ~15 missing system pages + update existing 9
- **`src/pages/admin/AdminPages.tsx`**: Add type badge column, type filter, restrict system pages to SEO-only editing

### Benefits for both of us
- **You**: See every page on your site, manage SEO meta from one place, know what's indexed
- **Me (Lovable)**: Can query the `pages` table to understand the full site map, update SEO programmatically, and avoid creating duplicate routes

