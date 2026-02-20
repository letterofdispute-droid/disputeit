
# Link Audit & Hierarchy Verification — Letter of Dispute

## Audit Scope

Inspected: all bidirectional linking between templates ↔ articles, article internal link graph (44K+ suggestions), site navigation hierarchy, state-rights linking, and URL integrity across all page types.

---

## What's Working Well

### Internal Link Volume — Excellent
- **5,780 published articles** are 100% embedded (vector coverage is perfect)
- **44,256 applied links** across the article graph
- **Average inbound: 6.6 links per article**, average outbound: 6.6 — well-balanced
- **4,796 articles (83%)** have 3+ inbound links — that's strong coverage

### Template → Article Bidirectional Linking — Strong
- **All 5,780 published articles** have `related_templates` populated (100%)
- Top templates are receiving meaningful article coverage:
  - `housing-kw-housing-complaint`: referenced in 43 articles
  - `healthcare-kw-healthcare-complaint`: referenced in 42 articles
  - `travel-kw-flight-compensation-form`: referenced in 34 articles
  - `financial-kw-bank-complaint-letter`: referenced in 20 articles

### Article → Template CTA — Correct
- `ArticlePage` correctly renders `<RelatedTemplatesCTA>` when `related_templates` array is set
- `LetterPage` correctly renders `<RelatedArticles>` querying `related_templates` field and falling back to category-wide results
- Both ends of the bidirectional link are implemented

### State Rights Navigation — Present
- Footer has 6 state hub links + 2 state×category deep links
- MegaMenu has 6 notable state hub links
- `CategoryGuidePage` has a 6-state grid linking to `state-rights/{state}/{categoryId}` deep pages
- `LetterPage` has a 5-state panel with correct `state-rights/${slug}/${categoryId}` links
- `LetterGenerator` (Step 2) shows a dynamic link to the user's selected state (slug mapping confirmed correct after last fix)

---

## Bugs Found

### Bug 1 — CRITICAL: `CategoryGuidePage.tsx` uses `/letters/` URL for template quick-links (404s)

**Severity: High**

At line 513, the "Popular Templates" quick-link section in the Guide CTA box links to:
```tsx
to={`/letters/${t.slug}`}
```

The route `/letters/:slug` does **not exist**. The correct URL pattern is:
```
/templates/:categoryId/:subcategorySlug/:templateSlug
```

This means every Category Guide page (13 pages) has broken template CTA links in the "Ready to Assert Your Rights?" section. Affected example: clicking "Security Deposit Return Letter" from `/guides/housing` routes to `/letters/housing-kw-security-deposit-return` → 404.

**Fix:** Look up each template's full hierarchical path using `inferSubcategory` and `getCategoryIdFromName`, same pattern used in `RelatedTemplatesCTA.tsx`.

---

### Bug 2 — MEDIUM: `RealWorldScenarios.tsx` (Homepage) uses stale `/letters/` slugs

**Severity: Medium**

`src/components/home/RealWorldScenarios.tsx` contains 5 hardcoded `letterSlug` values using the old `/letters/` format:
```ts
letterSlug: '/letters/housing/security-deposit-return',
letterSlug: '/letters/healthcare/medical-bill-dispute',
letterSlug: '/letters/insurance/claim-denial-appeal',
letterSlug: '/letters/refunds/defective-product-refund',
letterSlug: '/letters/travel/flight-delay-compensation',
```

These slugs appear to be legacy paths from a previous routing scheme. Whether these are used as `<Link to="">` or just shown as text needs confirming, but they represent the wrong URL format regardless.

**Fix:** Map to correct hierarchical URLs or remove if they're display-only.

---

### Bug 3 — MEDIUM: 130 orphan articles with 0 inbound links

**Severity: Medium**

130 articles (2.2%) have zero inbound links. Of these, 15 have high outbound link counts (they link OUT to 8–16 articles but receive nothing back). Notable orphans:
- `what-to-do-about-pcp` (vehicle) — 16 outbound, 0 inbound
- `everything-you-need-to-know-about-bill-shock-complaint` (utilities) — 10 outbound, 0 inbound
- `how-to-write-a-credit-report-dispute-letter-step-by-step-guide` (financial) — 8 outbound, 0 inbound

These are unreachable via internal navigation — Google will deprioritize them as "orphaned" pages.

**Fix:** Run the existing "Rescue Orphans" edge function from the admin SEO dashboard. It uses a lower similarity threshold (0.55 vs 0.70) to find inbound sources for exactly these articles.

---

### Bug 4 — MEDIUM: `semantic-reverse` suggestions have NULL `relevance_score` (1,118 affected)

**Severity: Medium**

The `link_suggestions` audit shows that **1,118 `semantic-reverse` suggestions have `NULL` relevance scores**. The `relevance_score` is used by the link review UI to show the quality indicator badge. These 1,118 suggestions display no score in the admin panel, making them harder to evaluate. Of 2,106 total `semantic-reverse` suggestions, 646 are approved but not yet applied.

**Fix:** Backfill `relevance_score` for `semantic-reverse` suggestions using `round(semantic_score * 100)`.

---

### Bug 5 — LOW: `CategoryGuidePage` "Related Articles" links use short slug (missing category prefix)

**Severity: Low**

At line 534, the Related Articles section in `CategoryGuidePage` links to:
```tsx
to={`/articles/${article.slug}`}
```

But the correct URL format (enforced everywhere else) is:
```
/articles/:categorySlug/:slug
```

The query already fetches `category_slug` in the select, so `article.category_slug` is available — it's just not being used.

**Fix:** Change to `` to={`/articles/${article.category_slug}/${article.slug}`} ``

---

### Bug 6 — LOW: Over-linked articles exceeding the 8-link cap

**Severity: Low**

15 articles have `outbound_count > 8`, with the highest at 17 links (`your-rights-what-to-do-when-health-insurance-denies-a-claim`). These exceed the platform's own SEO best-practice cap of 8 outbound links per article (defined in the internal linking policy). These links were applied before the cap was lowered or enforced.

**Fix:** No immediate action needed unless a reconciliation is run — these won't hurt rankings significantly. But the reconcile script should be run to audit if any are ghost links.

---

### Bug 7 — LOW: No state-rights pages appear as link targets in `link_suggestions`

**Severity: Low**

The scan-for-semantic-links and scan-for-smart-links edge functions were recently updated to inject state-rights pages as candidates. However, checking the `link_suggestions` table confirms **0 rows** have `target_slug` that is a `/state-rights/` path. This is expected because:

1. The scan functions inject them as `CandidateTarget` objects at runtime but insert them with a `target_slug` referencing the article slug pattern, not `/state-rights/` paths.
2. The state-rights pages don't have entries in `article_embeddings`, so the vector matching doesn't discover them.

The state-rights links **are** embedded directly in `LetterPage`, `CategoryGuidePage`, and generator prompts — but they are not flowing through the link suggestions system. This is acceptable for now but means the admin Link Management UI won't show them for review.

---

## Site Hierarchy Verification

### Current Structure (Correct)

```text
/ (Homepage)
├── /templates                          (All templates collection)
│   └── /templates/:categoryId          (Category page — 13 pages)
│       └── /templates/:categoryId/:sub (Subcategory — ~150 pages)
│           └── /templates/:cat/:sub/:slug (Template — 500+ pages)
├── /guides                             (Guides hub)
│   └── /guides/:categoryId             (Category guide — 13 pages)
├── /articles                           (Blog hub)
│   └── /articles/:categorySlug         (Blog category — ~15 pages)
│       └── /articles/:cat/:slug        (Blog post — 5,780 pages)
├── /state-rights                       (State rights hub)
│   └── /state-rights/:stateSlug        (State hub — 51 pages)
│       └── /state-rights/:state/:cat   (State+category — 663 pages)
└── /deadlines, /consumer-news, /analyze-letter (Free tools)
```

### Hierarchy Issues

- **Guides → Templates cross-links are sparse**: `CategoryGuidePage` links to `/templates/${categoryId}` (the category index) but the "Popular Templates" quick-links are broken (Bug 1). Once fixed, guides will be strong template funnels.
- **Blog → Template linking is working** correctly via `related_templates` field and `RelatedTemplatesCTA`.
- **Template → Blog linking works** via `RelatedArticles` which queries `related_templates` and falls back to category.
- **State Rights → Template linking is missing**: State category pages (`/state-rights/california/vehicle`) don't link to individual templates. This is a missed conversion funnel — someone reading about California vehicle rights has no direct path to the Lemon Law template.

---

## Priority Fix List

| Bug | Severity | File(s) | Fix Type |
|---|---|---|---|
| CategoryGuidePage `/letters/` broken links | High | `CategoryGuidePage.tsx` | Code fix |
| CategoryGuidePage article URL missing category prefix | Low | `CategoryGuidePage.tsx` | Code fix |
| RealWorldScenarios legacy `/letters/` slugs | Medium | `RealWorldScenarios.tsx` | Code fix |
| 130 orphan articles | Medium | Admin SEO Dashboard | Run Rescue Orphans |
| semantic-reverse NULL relevance scores | Medium | Database | SQL backfill |
| State category pages missing template CTAs | Medium | `StateRightsCategoryPage.tsx` | New feature |

---

## Implementation Plan

### Phase 1 — Fix `CategoryGuidePage.tsx` (Bugs 1 and 5)

**File: `src/pages/CategoryGuidePage.tsx`**

**Fix Bug 1** (line 513): Replace `/letters/${t.slug}` with the correct hierarchical template URL. Import `inferSubcategory` and `getCategoryIdFromName`, then compute:
```tsx
const sub = inferSubcategory(t.id, t.category);
const subSlug = sub?.slug || 'general';
const catId = getCategoryIdFromName(t.category);
to={`/templates/${catId}/${subSlug}/${t.slug}`}
```

**Fix Bug 5** (line 534): Replace `to={`/articles/${article.slug}`}` with `to={`/articles/${article.category_slug}/${article.slug}`}`.

---

### Phase 2 — Fix `RealWorldScenarios.tsx` (Bug 2)

**File: `src/components/home/RealWorldScenarios.tsx`**

Map each hardcoded `letterSlug` to the correct hierarchical URL:
- `/letters/housing/security-deposit-return` → `/templates/housing/tenancy-dispute/housing-kw-security-deposit-dispute`
- `/letters/healthcare/medical-bill-dispute` → `/templates/healthcare/billing-coding/healthcare-kw-medical-bill-dispute`
- `/letters/insurance/claim-denial-appeal` → `/templates/insurance/health-insurance/insurance-kw-insurance-appeal`
- etc.

If the `letterSlug` field is only for display and not used in `<Link>`, confirm and clean up or properly route it.

---

### Phase 3 — Backfill `relevance_score` on semantic-reverse suggestions (Bug 4)

This is a database fix that sets `relevance_score = round(semantic_score * 100)` for all `semantic-reverse` suggestions where `relevance_score IS NULL`. This improves the admin link review UI immediately for the 646 approved-but-unreviewed suggestions.

---

### Phase 4 — Add Template CTAs to State Category Pages (Bug 7 enhancement)

**File: `src/pages/StateRightsCategoryPage.tsx`**

Add a sidebar section or bottom CTA that links to the 3 most relevant templates for that state's category. For example, `/state-rights/california/vehicle` would show links to the Lemon Law, Car Dealer Complaint, and Vehicle Warranty templates. This closes the conversion funnel for the 663 highest-value SEO pages.

---

### Phase 5 — Run Rescue Orphans (Bug 3)

From the Admin SEO Dashboard → Link Management → "Rescue Orphans" button. This immediately fixes the 130 orphans by auto-approving inbound link suggestions for them.

---

## Summary Table

| Check | Status | Details |
|---|---|---|
| 100% article embedding coverage | PASS | 5,780/5,780 articles embedded |
| All articles have related_templates | PASS | 5,780/5,780 (100%) |
| Average inbound links per article | PASS | 6.6 avg, 83% with 3+ |
| Applied link total | PASS | 44,256 links injected |
| Template bidirectional linking | PASS | Articles → Templates → Articles all wired |
| State rights linking from templates | PASS | 5-state panel on every LetterPage |
| State rights linking from guides | PASS | 6-state grid on every CategoryGuidePage |
| Guide → Template CTA URLs | FAIL | Bug 1: broken `/letters/` URLs |
| Guide → Article URLs | FAIL | Bug 5: missing category prefix |
| Homepage scenario links | FAIL | Bug 2: legacy `/letters/` URLs |
| Orphan articles | WARN | 130 orphans (2.2%) — run Rescue Orphans |
| Over-linked articles (>8) | WARN | 15 articles exceed cap |
| semantic-reverse relevance scores | WARN | 1,118 NULL scores |
| State rights → Template CTAs | MISSING | 663 pages lack template conversion path |
