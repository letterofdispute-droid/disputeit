

# Plan: Fix Duplicate FAQPage Schema + Verify Small Claims State Pages

## Task 1: Fix Duplicate FAQPage Schema (GSC Error — 48 affected pages)

**Root cause:** `StateRightsCategoryPage.tsx` emits FAQPage JSON-LD schema **twice**:
1. Via the `SEOHead` component (line 177: `faqItems={faqItems.map(...)}`), which internally renders a `<script type="application/ld+json">` with the FAQPage schema
2. Via a manual `<script dangerouslySetInnerHTML>` tag (lines 181-184) with the same data

**Fix:** Remove the manual `<script>` block at lines 181-184 since `SEOHead` already handles it. This is a 4-line deletion.

**Files changed:**
- `src/pages/StateRightsCategoryPage.tsx` — remove lines 181-184

This fixes all 48 affected URLs shown in Google Search Console.

---

## Task 2: Small Claims State Pages — Already Complete

The 51 state-specific small claims pages (`/small-claims/[state]`) are **already built and routed**:
- `src/data/smallClaimsData.ts` contains all 50 states + DC (635 lines)
- `src/pages/SmallClaimsStatePage.tsx` renders each page with filing limits, fees, statute of limitations, filing steps, court forms, FAQ schema, and CTAs
- `src/App.tsx` has the route: `/small-claims/:state`
- `src/routes.ts` includes all 51 slugs in SSG pre-rendering via `smallClaimsData.map(s => /small-claims/${s.slug})`

No changes needed — these pages are live and indexable.

---

## Summary

| Task | Action | Files |
|------|--------|-------|
| Fix duplicate FAQPage | Remove redundant `<script>` tag | `StateRightsCategoryPage.tsx` |
| Small claims state pages | Already implemented | None |

