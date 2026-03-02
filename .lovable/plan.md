

# Seed All Dynamic Route Pages into the Database

## Problem
Only ~23 top-level system pages were seeded. Hundreds of dynamic pages are invisible in admin:
- **51 state rights hubs** (`/state-rights/new-york`, etc.)
- **663 state+category pages** (`/state-rights/new-york/lemon-law`, etc.)
- **14 template category pages** (`/templates/vehicle`, etc.)
- **14 guide pages** (`/guides/housing`, etc.)
- **51 small claims state pages** (`/small-claims/california`, etc.)
- **Subcategory pages** (`/templates/vehicle/lemon-law`, etc.)

Total: ~800+ missing pages.

## Approach

### 1. Database migration to seed dynamic system pages

Run a single migration that INSERTs all dynamic routes as `page_type = 'system'` rows. We'll batch them in groups:

**Group A — Template categories (14 rows)**
One row per category: `templates/refunds`, `templates/housing`, etc.

**Group B — Guide categories (14 rows)**
One row per category: `guides/refunds`, `guides/housing`, etc.

**Group C — State rights hubs (51 rows)**
One per state/DC: `state-rights/new-york`, `state-rights/california`, etc.

**Group D — State rights category pages (663 rows)**
51 states × 13 categories: `state-rights/new-york/lemon-law`, etc.

**Group E — Small claims state pages (51 rows)**
One per state: `small-claims/california`, `small-claims/new-york`, etc.

**Group F — Subcategory pages (~50-80 rows)**
From the subcategory mappings: `templates/vehicle/lemon-law`, etc.

We'll use `ON CONFLICT (slug) DO NOTHING` to avoid duplicates with existing entries.

### 2. Add unique constraint on slug
The `pages` table needs a unique constraint on `slug` to support `ON CONFLICT` and prevent duplicates.

### 3. Add `page_group` column for filtering
Add `page_group text` to categorize pages for admin filtering:
- `static` — Home, About, FAQ, etc.
- `legal` — Terms, Privacy, Disclaimer, Cookie Policy
- `tool` — State Rights hub, Deadlines, Analyzer, Small Claims tools
- `template` — Template categories and subcategories
- `guide` — Guide category pages
- `state-rights` — All 714 state rights pages
- `small-claims` — Small claims state pages
- `auth` — Login, Signup (if desired)

Update the existing 23 rows to set their `page_group`. Add a group filter dropdown to AdminPages.

### 4. Update AdminPages UI
- Replace the simple System/CMS type filter with a `page_group` dropdown filter
- Keep the existing type filter alongside it
- Show page_group as a subtle label or badge

### Files changed
- **Migration SQL**: Add `page_group` column, unique constraint on `slug`, INSERT all dynamic routes (~800 rows), UPDATE existing 23 rows with `page_group`
- **`src/pages/admin/AdminPages.tsx`**: Add `page_group` filter dropdown, display group badge

### Data generation approach
The migration SQL will use `generate_series` patterns and explicit value lists for states and categories rather than relying on TypeScript data files, keeping everything in pure SQL.

