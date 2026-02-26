

## Current State

The `fix-broken-links` scanner only processes `blog_posts.content` and only validates/rewrites **article URL patterns** (e.g. `/blog/slug`, `/category/slug`, bare slugs). It does NOT verify whether links pointing to `/templates/...`, `/guides/...`, or other internal pages actually resolve to valid destinations.

## What's Missing

Internal links in articles can point to:
1. **Other articles** (`/articles/cat/slug`) -- currently checked via `slugToCategory` map
2. **Template pages** (`/templates/category` or `/templates/category/slug`) -- NOT validated
3. **Guide pages** (`/guides/category`) -- NOT validated
4. **State rights pages** (`/state-rights/...`) -- NOT validated
5. **Static pages** (`/pricing`, `/about`, etc.) -- NOT validated but low risk

## Plan

### 1. Expand `fix-broken-links` edge function to validate all internal link targets

- Load template slugs from `allTemplates` data (query `content_plans` or hardcode known category IDs from `templateCategories`)
- Load guide category IDs (known set from `consumerRightsContent`)
- After existing pattern rewrites, add a **validation pass**: extract ALL `href="/"` internal links from the post HTML and check each against the combined valid-targets set (articles + templates + guides + static pages)
- Report broken links that point to non-existent internal destinations (currently invisible)

### 2. Build valid-target sets in the edge function

- **Articles**: already loaded via `loadAllSlugs()` -- validate `/articles/{cat}/{slug}` exists
- **Templates**: query `content_plans` for all `template_slug` values, OR load from a known static list of template category+slug combos. Since templates are hardcoded in frontend code, we'll build a set of valid template category IDs and validate the pattern `/templates/{categoryId}` and `/templates/{categoryId}/{slug}`
- **Guides**: small known set of category IDs that have guides -- hardcode the valid guide paths
- **Static pages**: hardcode the known valid static routes

### 3. Update the scan results to distinguish link types

- Add a `linkType` field to results: `'article' | 'template' | 'guide' | 'unknown'`
- Show in the UI which type of internal link is broken, not just article URL rewrites

### 4. Update `BrokenLinkScanner.tsx` UI

- Show broken link details grouped by type (article links, template links, guide links, other)
- Display the actual broken href so admin can identify what needs fixing

**Files to change:**
- `supabase/functions/fix-broken-links/index.ts` -- add comprehensive internal link validation pass
- `src/components/admin/seo/BrokenLinkScanner.tsx` -- display richer results with link types and broken hrefs

