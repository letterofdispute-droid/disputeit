

# Plan: Complete Small Claims SEO Gaps

## Overview
The small claims pages are built and routed, but several SEO and internal linking gaps prevent them from reaching full ranking potential. This plan addresses the 5 critical gaps found during the audit.

---

## Task 1: Add Small Claims Sitemap

The build script (`scripts/build-static.mjs`) generates sitemaps for templates, categories, state-rights, and blog posts -- but **not** for the 53 small claims URLs or the quiz page. Without sitemap coverage, Google relies solely on crawling to discover these pages.

**Changes:**
- Add `sitemap-small-claims.xml` generator to `scripts/build-static.mjs`
- Include all 51 state pages + hub + statement generator + quiz page (54 URLs total)
- Register it in the sitemap index
- Also add `/small-claims`, `/small-claims/statement-generator`, and `/do-i-have-a-case` to the static sitemap

**File:** `scripts/build-static.mjs`

---

## Task 2: Cross-Link State Rights Pages to Small Claims

Each of the 51 State Rights hub pages (`/state-rights/[state]`) should link to the corresponding small claims page (`/small-claims/[state]`). This creates 51 high-value internal links flowing authority to the new pages.

**Changes:**
- Add a "Small Claims Court" card/link in `StateRightsStatePage.tsx`
- Display the state's filing limit and a link to the full small claims guide
- Import `getSmallClaimsStateBySlug` to pull the filing limit dynamically

**File:** `src/pages/StateRightsStatePage.tsx`

---

## Task 3: Cross-Link Small Claims State Pages Back to State Rights

The state pages already link to `/state-rights/[state]` in the bottom CTA, which is good. But we should also add links to specific category-relevant state rights pages (e.g., housing, vehicle) based on common small claims dispute types.

**Changes:**
- Add a "Related Consumer Rights" section to `SmallClaimsStatePage.tsx`
- Link to 3-4 most relevant state rights categories (housing, vehicle, contractors, financial)

**File:** `src/pages/SmallClaimsStatePage.tsx`

---

## Task 4: Add Interactive US Map Component

An interactive clickable US map where users can click their state to jump to the state guide. This serves as both a UX improvement and a shareable/linkable visual asset.

**Changes:**
- Create `src/components/small-claims/USMap.tsx` -- an SVG-based clickable map of US states
- Each state is clickable and navigates to `/small-claims/[state]`
- Hover tooltips show state name and filing limit
- Add the map to the hub page (`SmallClaimsPage.tsx`) above or alongside the dropdown state lookup

**Files:**
- `src/components/small-claims/USMap.tsx` (new)
- `src/pages/SmallClaimsPage.tsx` (add map section)

---

## Task 5: Add `/do-i-have-a-case` and `/small-claims` to Static Sitemap

These two tool pages plus the statement generator are missing from the static sitemap entries in `build-static.mjs`.

**Changes:**
- Add 3 entries to the `staticPages` array in `generateStaticSitemap()`

**File:** `scripts/build-static.mjs` (same file as Task 1)

---

## Technical Details

### Sitemap Generator Function (Task 1)

A new function `generateSmallClaimsSitemap()` in `build-static.mjs` that:
- Hardcodes the 51 state slugs (same as `smallClaimsData`)
- Generates URLs for `/small-claims/[slug]` with priority 0.7, changefreq weekly
- Includes `/small-claims` (priority 0.8) and `/small-claims/statement-generator` (priority 0.7)
- Writes to `sitemap-small-claims.xml`
- Registers in the sitemap index

### US Map Component (Task 4)

An inline SVG map with:
- All 50 states + DC as clickable path elements
- `react-router-dom` `useNavigate` for client-side navigation
- Hover state showing state name + filing limit tooltip
- Responsive sizing (scales down on mobile)
- Color coding: states with higher limits shown in darker shades

### State Rights Cross-Link (Task 2)

A new card added to `StateRightsStatePage.tsx` in the category grid or as a standalone section:
```text
+------------------------------------------+
|  Small Claims Court in [State]           |
|  File up to $XX,XXX in [Court Name]      |
|  [View Filing Guide ->]                  |
+------------------------------------------+
```

### Implementation Order

1. Sitemap additions (Tasks 1 + 5) -- immediate SEO impact
2. Cross-linking (Tasks 2 + 3) -- internal link authority
3. Interactive map (Task 4) -- UX and linkable asset

---

## Summary

| Task | Impact | Files |
|------|--------|-------|
| Add small claims sitemap | Google discovery of 54 URLs | `scripts/build-static.mjs` |
| State Rights -> Small Claims links | 51 internal links | `StateRightsStatePage.tsx` |
| Small Claims -> State Rights categories | Deeper cross-linking | `SmallClaimsStatePage.tsx` |
| Interactive US map | UX + linkable asset | `USMap.tsx`, `SmallClaimsPage.tsx` |
| Static sitemap entries | 3 missing tool pages | `scripts/build-static.mjs` |

