

# Audit: Non-Blog Page Interlinking

## Build Blocker (must fix first)

The build is failing because `siteContext.ts` has 622 template slugs but template source files have 624. The 2 extra slugs come from `src/data/letterTemplates.ts` which contains 3 legacy templates with slugs `refund`, `landlord-repairs`, and `damaged-goods` that are not listed in the siteContext whitelist (one may overlap with another file's slug, explaining the 2-not-3 gap).

**Fix**: Add the 2-3 missing legacy slugs to `siteContext.ts` under their respective categories, OR exclude `letterTemplates.ts` from the validator since those templates are overridden by deduplication in `allTemplates.ts`.

## Interlinking Audit Results

### Correctly Linked (no issues found)

| Page/Component | Links To | Status |
|---|---|---|
| **LetterPage.tsx** breadcrumbs | `/templates/{categoryId}`, `/templates/{categoryId}/{subcategorySlug}` | Correct - uses resolved IDs |
| **SubcategoryPage.tsx** breadcrumbs | `/templates/{category.id}` | Correct - uses `category.id` |
| **StateRightsCategoryPage.tsx** template links | `/templates/{categorySlug}/{subSlug}/{slug}` | Correct - uses canonical `CATEGORY_TEMPLATE_MAP` |
| **StateRightsPage.tsx** | `/state-rights/{getStateSlug(code)}`, `/templates/{selectedCategory}` | Correct - uses canonical IDs |
| **StateRightsStatePage.tsx** breadcrumbs | `/state-rights` | Correct |
| **StateRightsCategoryPage.tsx** breadcrumbs | `/state-rights/{stateSlug}` | Correct |
| **SmallClaimsPage.tsx** tool links | `/small-claims/cost-calculator`, `/small-claims/demand-letter-cost`, etc. | Correct |
| **SmallClaimsStatePage.tsx** | `/state-rights/{stateData.slug}` | Correct |
| **SmallClaimsEscalationPage.tsx** cross-links | `/small-claims/cost-calculator`, `/do-i-have-a-case` | Correct |
| **SmallClaimsDemandLetterPage.tsx** cross-links | `/small-claims/cost-calculator`, `/small-claims/escalation-guide` | Correct |
| **SmallClaimsCostCalculatorPage.tsx** | `/state-rights` | Correct |
| **DeadlinesPage.tsx** dynamic links | `/templates/{selectedCategory}`, `/state-rights?state=...` | Correct - categories use canonical IDs from `CATEGORY_LABELS` keys |
| **LetterAnalyzerPage.tsx** | `/templates/{category}`, `/state-rights`, `/deadlines`, `/consumer-news` | Correct - category comes from analysis result |
| **ConsumerNewsPage.tsx** sidebar | `/state-rights`, `/deadlines`, `/analyze-letter` | Correct - static paths |
| **GuidesPage.tsx** / **CategoryGuidePage.tsx** | `/guides`, `/guides/{id}` | Correct |
| **CaseQuizPage.tsx** / **QuizResult** | `/templates/{category.categoryId}`, `/small-claims` | Correct |
| **MegaMenu** / **Header** | `/guides`, `/templates`, `/articles` | Correct |

### No Issues Found

All non-blog page interlinking uses correct canonical category IDs, proper hierarchical template URLs, and valid static routes. The `CATEGORY_TEMPLATE_MAP`, `CATEGORY_LABELS`, and `getStateSlug()` utilities all produce correct URL segments.

## Implementation Plan

**Single fix**: Resolve the siteContext slug drift to unblock the build.

1. Open `supabase/functions/_shared/siteContext.ts`
2. Add the missing legacy slugs (`refund`, `landlord-repairs`, `damaged-goods`) to their respective category sections (refunds, housing, damaged-goods)
3. This will make the count match (624 = 624) and unblock the build

No interlinking fixes are needed for non-blog pages.

