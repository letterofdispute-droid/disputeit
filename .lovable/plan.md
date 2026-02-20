
# Full-Site SEO Audit — Letter of Dispute

## Audit Scope

All public-facing routes were inspected including: Homepage, Templates (500+ pages), Category/Subcategory pages, State Rights hub + 51 state hubs + 663 state×category pages, Blog (ArticlesPage, ArticleCategoryPage, ArticlePage), Guides (GuidesPage, CategoryGuidePage), and all 5 free tools (Deadlines, State Rights Lookup, Consumer News, Letter Analyzer, SettingsPage).

---

## Critical Bugs Found

### Bug 1 — `SEOHead` silently drops all `faqItems` and `breadcrumbs` schema

**Severity: High**

`SEOHead` accepts `faqItems?: FAQItem[]` and `breadcrumbs?: BreadcrumbItem[]` as props but **never emits JSON-LD for them**. It builds only 3 schemas internally (WebApplication, Organization, Article) and ignores the prop data entirely.

The following pages pass data that is silently lost:

| Page | Props passed to SEOHead | Schema actually emitted |
|---|---|---|
| `/state-rights` | `faqItems`, `breadcrumbs` | Nothing |
| `/state-rights/:stateSlug` | `breadcrumbs` | Nothing |
| `/deadlines` | `faqItems`, `breadcrumbs` | Nothing |
| `/consumer-news` | `breadcrumbs` | Nothing |
| `/analyze-letter` | `breadcrumbs` | Nothing |
| `/guides/:categoryId` | `faqItems`, `breadcrumbs` | Nothing |

Note: `/state-rights/:stateSlug/:categorySlug` correctly injects FAQ schema via a separate `<script>` tag outside of `SEOHead`, so it is fine. `/faq` and `/pricing` also bypass `SEOHead` by using `<Helmet>` directly — those are fine.

**Fix:** Add `faqSchema` and `breadcrumbSchema` generation inside `SEOHead.tsx` whenever the corresponding props are present.

---

### Bug 2 — `StateRightsStatePage` has no BreadcrumbList JSON-LD emitted

**Severity: Medium**

The state hub pages (`/state-rights/california` etc.) pass `breadcrumbs` to `SEOHead` but due to Bug 1 those breadcrumbs are never emitted. No BreadcrumbList schema exists for any of the 51 state hub pages. These are high-value hub pages ranking for "[State] consumer rights" and should display rich breadcrumbs in Google results.

---

### Bug 3 — `/articles` blog index and `/articles/:category` use wrong site branding in titles

**Severity: Low**

- `/articles` title: `"Blog | DisputeLetters - Consumer Rights & Dispute Resolution"` — **"DisputeLetters" is incorrect branding**, should be "Letter of Dispute".
- `/articles/:category` title: `"${categoryData.name} | DisputeLetters Blog"` — same issue.

These are rendered client-side via `SEOHead` and will be visible to social crawlers and Google.

---

### Bug 4 — `/guides` and `/guides/:categoryId` missing brand suffix in titles

**Severity: Low**

- `/guides` title: `"Consumer Rights Guides | Know Your Rights"` — missing "| Letter of Dispute" suffix.
- `/guides/:categoryId` title: `"${guide.title} | Consumer Rights Guide"` — missing brand suffix. Every other page on the site uses the `| Letter of Dispute` suffix pattern.

---

### Bug 5 — `SEOHead` has a ghost `type="article"` default causing incorrect Article schema on non-article pages

**Severity: Medium**

`SEOHead` defaults `type = 'article'` and emits an Article schema for **any page that doesn't explicitly set `type="website"`**. The following pages receive an incorrect Article schema:

- `/state-rights` (no `type` prop set → gets Article schema)
- `/deadlines` (no `type` prop set → gets Article schema)
- `/consumer-news` (no `type` prop set → gets Article schema)
- `/analyze-letter` (no `type` prop set → gets Article schema)
- `/guides` (no `type` prop set → gets Article schema)

These are interactive tool pages — Article schema with `datePublished: new Date().toISOString()` (always "today") is semantically incorrect and will confuse Google.

---

### Bug 6 — `/state-rights/:stateSlug` missing FAQPage schema

**Severity: Medium**

The state hub pages contain well-structured prose that would support FAQ schema, but no FAQ items are defined or passed. The state-category pages (`/state-rights/:stateSlug/:categorySlug`) correctly have FAQPage schema with 3 questions each. The intermediate hub pages (/state-rights/california) have none, which is a missed rich snippet opportunity for 51 high-value pages.

---

### Bug 7 — `LetterGenerator.tsx` state-rights link uses raw `template.category` as category slug

**Severity: Low**

The helper link added in the last edit constructs the URL as:
```tsx
href={`/state-rights/${stateSlug}/${template.category}`}
```
`template.category` is the category display name (e.g. `"Vehicle"`, `"Housing & Tenant Rights"`) not the URL slug (e.g. `vehicle`, `housing`). This will produce broken URLs like `/state-rights/california/Vehicle` which return 404s.

---

## Issues by Page Type

### Homepage `/`
- Status: Good
- Has: Title, description, canonical, OG, Twitter, WebApplication schema, Organization schema
- Missing: `type="website"` is set correctly; Article schema is suppressed
- Recommendation: None critical

### Template Pages `/templates/:categoryId/:subcategorySlug/:templateSlug`
- Status: Good
- Has: WebApplication + HowTo + BreadcrumbList schema, SEO title/desc, canonical
- Has: DB SEO override support
- Recommendation: None critical

### Category Pages `/templates/:categoryId`
- Status: Good
- Has: ItemList + BreadcrumbList schema, breadcrumb UI
- Missing: `type="website"` set correctly
- Recommendation: None critical

### Subcategory Pages `/templates/:categoryId/:subcategorySlug`
- Status: Good
- Has: BreadcrumbList schema, breadcrumb UI
- Missing: No `type="website"` — gets erroneous Article schema (Bug 5)
- Recommendation: Add `type="website"` to `SubcategoryPage`

### All Templates `/templates`
- Status: Good
- Has: CollectionPage + BreadcrumbList schema
- Recommendation: None critical

### State Rights Hub `/state-rights`
- Status: Partially broken
- Has: Title, description, canonical, FAQ props (silently dropped - Bug 1)
- Missing: FAQPage schema, BreadcrumbList schema (Bug 1)
- Gets: Incorrect Article schema (Bug 5)

### State Rights State Hub `/state-rights/:stateSlug` (×51)
- Status: Partially broken
- Has: Dynamic title with citation, description, canonical, breadcrumb UI, sidebar with all-13-category grid
- Missing: BreadcrumbList schema (Bug 2), FAQPage schema (Bug 6)
- Gets: Incorrect Article schema (Bug 5)

### State Rights Category Pages `/state-rights/:stateSlug/:categorySlug` (×663)
- Status: Good
- Has: Dynamic title, description, canonical, FAQPage schema (3 questions), BreadcrumbList schema, breadcrumb UI, Federal vs State table, peer linking, sibling category links
- Recommendation: None critical

### Blog Index `/articles`
- Status: Minor issue
- Has: Title, description, canonical
- Has: Incorrect brand name "DisputeLetters" (Bug 3)

### Blog Category `/articles/:category`
- Status: Minor issue
- Has: Title, description, canonical; breadcrumb uses plain `<nav>` not `<Breadcrumb>` component
- Has: Incorrect brand name "DisputeLetters" (Bug 3)
- Missing: BreadcrumbList JSON-LD

### Blog Post `/articles/:category/:slug`
- Status: Good
- Has: Article JSON-LD (Person author, Organization publisher, datePublished, dateModified, image), OG image, dynamic canonical
- Has: Correct `meta_title`/`meta_description` from DB
- Recommendation: None critical

### Guides Hub `/guides`
- Status: Minor issue
- Missing: Brand suffix in title (Bug 4), no `type="website"` (Bug 5)

### Guide Category `/guides/:categoryId`
- Status: Partially broken
- Has: Dynamic title, description, canonical; FAQ props passed (silently dropped - Bug 1)
- Missing: FAQPage schema (Bug 1), brand suffix (Bug 4)

### Deadlines Calculator `/deadlines`
- Status: Partially broken
- Has: Title, description, canonical, FAQ props (silently dropped - Bug 1)
- Missing: FAQPage schema (Bug 1), BreadcrumbList schema (Bug 1)
- Gets: Incorrect Article schema (Bug 5)

### Consumer News `/consumer-news`
- Status: Minor issue
- Has: Title, description, canonical, breadcrumb UI
- Gets: Incorrect Article schema (Bug 5)
- Missing: BreadcrumbList schema from `breadcrumbs` prop (Bug 1)

### Letter Analyzer `/analyze-letter`
- Status: Minor issue
- Has: Title, description, canonical, breadcrumb UI
- Gets: Incorrect Article schema (Bug 5)
- Missing: BreadcrumbList schema from `breadcrumbs` prop (Bug 1)

### FAQ Page `/faq`
- Status: Good — uses separate `<Helmet>` directly, bypasses Bug 5

### Pricing Page `/pricing`
- Status: Good — uses separate `<Helmet>` directly, bypasses Bug 5

---

## Implementation Plan

### Phase 1 — Fix `SEOHead.tsx` (fixes Bugs 1 and 5 at once)

**File: `src/components/SEOHead.tsx`**

1. Change the default `type` from `'article'` to `'website'` so tool/hub pages don't get incorrect Article schema by default.

2. Add FAQPage schema generation when `faqItems` prop is present:
```ts
const faqSchema = faqItems && faqItems.length > 0 ? {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
} : null;
```

3. Add BreadcrumbList schema generation when `breadcrumbs` prop is present:
```ts
const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
} : null;
```

4. Emit both schemas inside the `<Helmet>` return alongside the existing ones.

5. Update the Article schema condition: only emit if `type === 'article'` (not the default).

This single fix resolves Bug 1 on 6 pages and Bug 5 across 5+ pages simultaneously.

---

### Phase 2 — Fix branding in blog titles (Bug 3)

**File: `src/pages/ArticlesPage.tsx`**

Change: `"Blog | DisputeLetters - Consumer Rights & Dispute Resolution"`
To: `"Blog | Letter of Dispute - Consumer Rights & Dispute Resolution"`

**File: `src/pages/ArticleCategoryPage.tsx`**

Change: `` `${categoryData.name} | DisputeLetters Blog` ``
To: `` `${categoryData.name} | Letter of Dispute Blog` ``

---

### Phase 3 — Fix guide title brand suffixes (Bug 4)

**File: `src/pages/GuidesPage.tsx`**

Change: `"Consumer Rights Guides | Know Your Rights"`
To: `"Consumer Rights Guides — Know Your Rights | Letter of Dispute"`

**File: `src/pages/CategoryGuidePage.tsx`**

Change: `` `${guide.title} | Consumer Rights Guide` ``
To: `` `${guide.title} | Consumer Rights Guide — Letter of Dispute` ``

---

### Phase 4 — Add `type="website"` to tool/hub pages (Bug 5 supplementary)

After Phase 1, the default becomes `'website'`, so this phase is largely resolved automatically. However, the following pages that explicitly render Article schema via `type="article"` need to be checked:

- `SubcategoryPage.tsx` — no `type` prop currently; will correctly inherit `'website'` default after Phase 1 fix.
- `StateRightsPage.tsx` — no `type` prop; will correctly inherit `'website'` after fix.

No additional file changes needed in Phase 4 if Phase 1 changes the default.

---

### Phase 5 — Add FAQ schema to state hub pages (Bug 6)

**File: `src/pages/StateRightsStatePage.tsx`**

Define 2-3 FAQ items about the state (e.g., "What is [State]'s consumer protection law?", "How do I file a complaint with the [State] AG?") and pass them as `faqItems` to `SEOHead`. This activates the FAQPage schema added in Phase 1 for all 51 state hub pages.

---

### Phase 6 — Fix broken state-rights link in LetterGenerator (Bug 7)

**File: `src/components/letter/LetterGenerator.tsx`**

Build a `CATEGORY_TO_SLUG` mapping that converts `template.category` display name to URL slug, identical to the mapping used in the edge functions (`CATEGORY_TO_RIGHTS_SLUG`). Apply this mapping when constructing the `/state-rights/` link href.

---

## Summary Table

| Bug | Severity | Pages Affected | Fix In Phase |
|---|---|---|---|
| `SEOHead` drops `faqItems` → no FAQPage schema | High | 5+ pages | Phase 1 |
| `SEOHead` drops `breadcrumbs` → no BreadcrumbList | High | 6+ pages | Phase 1 |
| Wrong brand name "DisputeLetters" in blog titles | Low | 2 pages | Phase 2 |
| Missing "Letter of Dispute" brand suffix in guides | Low | 2 pages | Phase 3 |
| Wrong Article schema default on tool pages | Medium | 5+ pages | Phase 1 |
| No FAQPage schema on state hub pages | Medium | 51 pages | Phase 5 |
| Broken state-rights URL in LetterGenerator | Low | All letter pages | Phase 6 |
