

## Visual Inconsistency Audit — Hero Sections Across All Pages

### Current Hero Patterns Found

There are **4 distinct hero styles** used across the site, creating visual inconsistency:

**Pattern A — `tools-hero-bg.jpg` with `bg-primary/45` overlay** (correct tool/interactive page pattern):
- `SmallClaimsStatePage` ✅
- `SmallClaimsCostCalculatorPage` ✅
- `SmallClaimsDemandLetterPage` ✅
- `SmallClaimsEscalationPage` ✅
- `SmallClaimsGeneratorPage` ✅
- `ConsumerNewsPage` ✅
- `DeadlinesPage` ✅
- `StateRightsPage` ✅

**Pattern B — Flat `bg-primary` (no image, no overlay)**:
- `LetterAnalyzerPage` — flat `bg-primary py-14 md:py-18`, no background image
- `GuidesPage` — flat `bg-primary py-16 md:py-20`
- `CategoryGuidePage` — flat `bg-primary py-12 md:py-16`
- `StateRightsStatePage` — flat `bg-primary py-12 md:py-16`
- `StateRightsCategoryPage` — flat `bg-primary py-12 md:py-16`
- `AllTemplatesPage` — flat `bg-primary py-12 md:py-16`
- `FAQPage` — flat `bg-primary py-16 md:py-20`
- `ContactPage` — flat `bg-primary py-12 md:py-16`
- `HowItWorksPage` — (need to check, likely flat)
- `PrivacyPage` — flat `bg-primary py-12 md:py-16`
- `CookiePolicyPage` — flat `bg-primary py-12 md:py-16`
- `ArticlePage` — flat `bg-primary py-16 md:py-20`

**Pattern C — `hero-bg.jpg` with `bg-primary/90` overlay** (different image + heavier overlay):
- `SmallClaimsPage` — uses `/images/hero-bg.jpg` + `bg-primary/90` (different from tools pattern)

**Pattern D — Dynamic Unsplash image with gradient overlay**:
- `CategoryPage` — fetches image via `useCategoryImage`, uses `bg-gradient-to-br from-primary via-primary/95 to-primary/90`
- `AboutPage` — fetches image via `useCategoryImage`

**Pattern E — Light/no hero**:
- `CaseQuizPage` — `bg-gradient-to-b from-primary/5 to-background` (very light, no dark hero)

### Inconsistencies to Address

1. **`LetterAnalyzerPage`** — An interactive tool page that should follow Pattern A (tools-hero-bg.jpg + overlay) but uses flat `bg-primary`. This is the same type of page as SmallClaimsGenerator.

2. **`StateRightsStatePage`** — A state-specific page (like `SmallClaimsStatePage`) but uses flat `bg-primary` instead of the image-backed hero.

3. **`StateRightsCategoryPage`** — Same issue as StateRightsStatePage.

4. **`SmallClaimsPage`** — Uses a *different* background image (`hero-bg.jpg`) and *heavier* overlay (`bg-primary/90`) than all other tool pages. Should probably match Pattern A.

5. **Pattern B pages (flat `bg-primary`)** — These are content/info pages. The flat dark blue is *intentionally* simpler and arguably correct for non-tool pages (guides, FAQ, legal pages). No change needed unless you want full visual parity.

### Recommended Implementation

**High priority (tool/interactive pages that should match Pattern A):**

1. **`LetterAnalyzerPage.tsx`** — Add `tools-hero-bg.jpg` background + `bg-primary/45` overlay to hero section. Add `relative overflow-hidden` to the section and `relative z-10` to content.

2. **`SmallClaimsPage.tsx`** — Change from `hero-bg.jpg` + `bg-primary/90` to `tools-hero-bg.jpg` + `bg-primary/45` for consistency with all other small-claims tool pages.

3. **`StateRightsStatePage.tsx`** — Add `tools-hero-bg.jpg` + `bg-primary/45` overlay to match the parent `StateRightsPage` which already uses it.

4. **`StateRightsCategoryPage.tsx`** — Same treatment as StateRightsStatePage.

**Leave as-is (intentionally different):**
- Content pages (FAQ, Contact, Guides, Privacy, Cookies, Articles) — flat `bg-primary` is appropriate for informational pages
- `CategoryPage` — dynamic Unsplash images per category are a deliberate design choice
- `CaseQuizPage` — light hero is intentional for the quiz UI
- `AboutPage` — dynamic image is intentional

