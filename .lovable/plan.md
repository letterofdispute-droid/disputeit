
# Sitemap Completeness Audit — Current Status & One Remaining Fix

## Full Cross-Reference: Every Route vs. Sitemap Coverage

After a complete audit of `App.tsx`, `scripts/build-static.mjs`, `consumerRightsContent.ts`, and `stateSpecificLaws.ts`, here is the definitive coverage map:

### sitemap-static.xml — 16 pages (COMPLETE after last fix)

| Route | Present | Sitemap File |
|---|---|---|
| `/` | Yes | sitemap-static.xml |
| `/templates` | Yes | sitemap-static.xml |
| `/how-it-works` | Yes | sitemap-static.xml |
| `/pricing` | Yes | sitemap-static.xml |
| `/faq` | Yes | sitemap-static.xml |
| `/about` | Yes | sitemap-static.xml |
| `/contact` | Yes | sitemap-static.xml |
| `/guides` | Yes | sitemap-static.xml |
| `/articles` | Yes | sitemap-static.xml |
| `/privacy` | Yes | sitemap-static.xml |
| `/terms` | Yes | sitemap-static.xml |
| `/disclaimer` | Yes | sitemap-static.xml |
| `/deadlines` | Yes (added last session) | sitemap-static.xml |
| `/consumer-news` | Yes (added last session) | sitemap-static.xml |
| `/analyze-letter` | Yes (added last session) | sitemap-static.xml |
| `/cookie-policy` | Yes (added last session) | sitemap-static.xml |

### sitemap-categories.xml — COMPLETE

Contains all 13 template category pages, all subcategory pages, and all 13 Consumer Rights Guide pages (`/guides/:categoryId`). The `generateCategoriesSitemap()` function loops over the same 13 categories defined in `consumerRightsContent.ts` — exact match, no gaps.

### sitemap-templates.xml — COMPLETE

All 400+ template leaf pages are inferred at build time from the template TypeScript source files.

### sitemap-state-rights.xml — COMPLETE

715 URLs: `/state-rights` hub + 51 state hubs + 663 state+category leaf pages. The hub page `/state-rights` is correctly placed in this file (not the static file) — this is valid per sitemap spec.

### sitemap-blog-*.xml — COMPLETE after last fix

All 14 active blog category pages + all published blog posts fetched from the database. The stale 5 slugs have been replaced.

---

## The One Real Bug: Stale Console Count

Line 638 of `build-static.mjs` has a hardcoded `12` for the static page count that was never updated when 4 pages were added:

```text
// CURRENT (wrong):
const totalUrls = 12 + categories.length + subcatCount + ...

// SHOULD BE:
const totalUrls = staticPages.length + categories.length + subcatCount + ...
```

This only affects the console log output — not any actual sitemap content — but it reports ~4 fewer URLs than are actually generated, which is misleading.

**The correct fix** is to move the calculation inside `generateStaticSitemap()` or pass the count out dynamically, so it self-updates whenever pages are added.

---

## Implementation

**Single file changed: `scripts/build-static.mjs`** — line 638 only.

Change the hardcoded `12` to a dynamic reference. The cleanest approach is to make `generateStaticSitemap()` also return the count, or simply count the `staticPages` array at the point of use.

Concretely, refactor `generateStaticSitemap()` to return both the XML and the page count:

```text
// Before: returns string
function generateStaticSitemap() { ... return xml; }

// After: returns { xml, count }
function generateStaticSitemap() { ... return { xml: xmlString, count: staticPages.length }; }
```

Then update the call site and total count line accordingly. This ensures the console summary is always accurate regardless of future additions.

**No other changes are needed.** The sitemap is structurally complete — all public indexable routes from the application are covered across the five sitemap files.
