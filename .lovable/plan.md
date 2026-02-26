# Fix Broken Links: Add Auto-Fix Mode

## Problem

1. **Scanner is read-only** -- it already computes rewrites (422 URL rewrites found) but never saves them. The `mode: 'fix'` is permanently disabled.
2. **1061 "unknown" broken links** are mostly bare slug paths like `/contractor-no-show-...` that should be `/articles/contractors/contractor-no-show-...`. The existing rewrite patterns only catch absolute URLs (`https://letterofdispute.com/slug`), not relative bare slugs (`/slug`).
3. **963 "template" broken links** include paths like `/template/...` (singular instead of `/templates/`), or template categories/slugs that don't exist.
4. **"Slugs loaded" shows 6538** -- this only shows `slugToCategory.size` (articles). Should show total valid targets (articles + templates + embeddings).

## Plan (2 files)

### 1. `supabase/functions/fix-broken-links/index.ts`

**Re-enable fix mode** with these changes:

- Accept `mode: 'fix'` -- runs all existing rewrite patterns (1-9) AND new fix patterns, then saves updated content back to `blog_posts`
- **New Pattern 10: Fix relative bare slugs** -- `/slug` where slug matches an article → rewrite to `/articles/{cat}/{slug}`
- **New Pattern 11: Fix `/template/` (singular)** → rewrite to `/templates/`
- **New Pattern 12: Fix bare category slugs** -- `/contractors-home-improvement` → `/articles/contractors`
- **New Pattern 13: Fix bad template category** -- `/templates/bad-cat/...` → try mapping via `CAT_TO_TEMPLATE`
- After all patterns, save updated content to `blog_posts` only if changed
- Update `slugsLoaded` in response to show total targets (articles + templates + embeddings)
- User needs a stop button

### 2. `src/components/admin/seo/BrokenLinkScanner.tsx`

- Add **"Fix Broken Links"** button that appears after scan completes with broken links found
- Button calls `fix-broken-links` with `mode: 'fix'`, processes all posts in batches
- Shows progress bar and final count of fixes applied
- Update "slugs loaded" display to say "targets" instead of "slugs"
- After fix completes, auto-runs scan again to show remaining (unfixable) links