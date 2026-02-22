

# Fix Broken Links & Declutter SEO Dashboard

## Problems Identified

### 1. Scanner misses relative broken links
The current scanner only detects absolute URLs (`https://letterofdispute.com/...`). But ~200 posts contain **relative** broken links like:
- `href="/landlord-housing/roof-leak-complaint"` (old category path)
- `href="/blog/some-slug"` (old blog prefix)
- `href="/category/landlord-housing"` (old category prefix)
- `href="/categories/insurance-claims"` (old categories prefix)

### 2. "Unfixable" links are actually fixable
994 links are marked "unfixable" because pattern ordering is wrong. For example, `/landlord-housing` gets caught by the "bare slug" pattern (Pattern 3) before the "category-only" pattern (Pattern 5). Since `landlord-housing` isn't an article slug, it's wrongly flagged as unfixable -- but it should simply redirect to `/articles/housing`.

### 3. SEO Dashboard has 10 tabs
Too crowded, especially on mobile. Need to consolidate.

---

## Plan

### A. Fix the Edge Function (`supabase/functions/fix-broken-links/index.ts`)

1. **Add relative link patterns** -- extend all 8 patterns to also match relative URLs (without `https://letterofdispute.com`), e.g.:
   - `href="/blog/slug"` 
   - `href="/landlord-housing/slug"`
   - `href="/category/..."` and `href="/categories/..."`

2. **Fix pattern ordering** -- move category-only matching (Pattern 5) BEFORE bare-slug matching (Pattern 3), so `/landlord-housing` is correctly resolved to `/articles/housing` instead of being treated as an unknown article slug.

3. **Remove false "unfixable" classification** -- when a category-path link like `/landlord-housing/slug` can't find the exact article, the function currently marks it unfixable but ALSO rewrites it to `/articles/housing` (line 146). This is contradictory. Fix: if we can resolve to a valid category page, count it as fixed, not unfixable.

4. **Add `/mistakes/` path pattern** -- database shows some links like `href="https://letterofdispute.com/mistakes/ignoring-deadlines..."` which need handling.

5. **Widen the scan filter** -- currently only scans posts containing `letterofdispute.com`. Add a second pass for posts with relative broken patterns (`/blog/`, `/category/`, `/categories/`, old category paths).

### B. Consolidate SEO Dashboard Tabs

Reduce from 10 tabs to 7 by merging related functionality:

| Current Tabs (10) | New Structure (7) |
|---|---|
| Discover | Discover (unchanged) |
| Coverage | Coverage (unchanged) |
| Queue | Queue (unchanged) |
| Links + 404s | **Links** (merge 404 scanner into Links tab as a sub-section) |
| Calendar | Calendar (unchanged) |
| Analytics + Gaps | **Analytics** (merge Gap Analysis into Analytics tab as a second section) |
| Keywords | Keywords (unchanged) |
| Settings | Settings (unchanged) |

This removes 3 tab slots: 404s merges into Links, Gaps merges into Analytics. The 404 scanner becomes a collapsible section within the Links tab.

### C. Enhance BrokenLinkScanner UI

- Add a progress bar instead of just text
- Show percentage complete
- Make the "Scan & Fix All" the primary/default action (since scan-only isn't very useful without fixing)

---

## Files to Modify

| File | Change |
|---|---|
| `supabase/functions/fix-broken-links/index.ts` | Add relative link patterns, fix pattern ordering, widen scan filter, fix unfixable classification |
| `src/pages/admin/SEODashboard.tsx` | Reduce from 10 to 7 tabs by merging 404s into Links and Gaps into Analytics |
| `src/components/admin/seo/LinkSuggestions.tsx` | Add BrokenLinkScanner as a collapsible section at the top |
| `src/components/admin/seo/analytics/ContentPerformance.tsx` | Add GapAnalysis as a section below performance |

