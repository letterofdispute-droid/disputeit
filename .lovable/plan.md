

# Seed Missing Pages into the Database

## What's missing

### Group 1 — Individual template pages (~400 rows)
Every template like `/templates/vehicle/warranty-lemon/lemon-law-demand-letter` is a real page visitors land on. These are defined in `allTemplates.ts` and rendered via the `/:categoryId/:subcategorySlug/:templateSlug` route. None were seeded.

### Group 2 — Auth & user pages (7 rows)
`login`, `signup`, `forgot-password`, `reset-password`, `dashboard`, `settings`, `purchase-success` — functional but still pages on the site. Mark as `no_index: true`.

## Approach

### Migration SQL
- Insert all ~400 individual templates by reading from `allTemplates` data and generating slugs matching the hierarchical pattern `templates/{categoryId}/{subcategorySlug}/{templateSlug}`
- Insert 7 auth/user pages with `page_group = 'auth'`, `no_index = true`
- Use `ON CONFLICT (slug) DO NOTHING`
- All entries: `page_type = 'system'`, `status = 'published'`

Since the template data lives in TypeScript (not SQL), the migration will need to enumerate them explicitly. There are ~400 templates across 14 categories — I'll generate the full INSERT from the `allTemplates` data.

### AdminPages UI update
- Add `'auth'` to the `PAGE_GROUPS` filter list
- Update pagination default — with 800+ pages now, the 100-per-page pagination already in place will handle this well

### Files changed
- **New migration SQL** — INSERT ~400 template detail pages + 7 auth pages
- **`src/pages/admin/AdminPages.tsx`** — add `auth` to PAGE_GROUPS array

