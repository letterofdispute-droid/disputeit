
# State Rights Lookup: From 1 Page to 650+ Indexable URLs

## Current State — What Exists

The `/state-rights` page is fully built and working as an interactive SPA tool:
- State selector (51 options including DC)
- Category selector (13 categories)
- Live results: statute cards, AG office link, federal vs. state table, notable states strip, AG complaint guide
- URL params update on selection: `/state-rights?state=CA&category=vehicle`
- Data lives in `stateSpecificLaws.ts` — all 51 states have real statute citations

## The Gap — What "650 Index Targets" Actually Means

Right now, Google sees **1 URL**: `/state-rights`. The query string (`?state=CA&category=vehicle`) is not indexed as a separate page — search engines treat query strings as parameters, not separate documents.

To capture the SEO value of 650+ distinct searches ("California lemon law consumer rights", "Texas housing tenant rights statute", etc.), each combination needs its **own route with its own HTML, title, description, and canonical tag**.

The target architecture is:

```text
/state-rights                              → Hub page (existing)
/state-rights/california                   → State hub (50 pages)
/state-rights/california/vehicle           → State + category (650 pages)
```

That is **701 total crawlable URLs** (1 hub + 50 state hubs + 650 state+category pages).

## Data Coverage Assessment

The existing `stateSpecificLaws.ts` covers:
- All 51 jurisdictions (50 states + DC) ✅
- `consumerProtection` statute for every state ✅
- `lemonLaw` for most states ✅
- `landlordTenant` for most states ✅
- `insurance` for some states (CA, FL, AL)
- `debtCollection` for some states (CA, IL)
- `homeImprovement` for some states (CA, CT)

For categories where a state has no specific statute (`damaged-goods`, `refunds`, `travel`, `utilities`, `employment`, `ecommerce`), the page falls back to the general `consumerProtection` statute — which is correct and sufficient for indexing.

The 13 categories are already defined in `CATEGORY_LABELS` in `StateRightsPage.tsx`.

## Implementation Plan

### Step 1 — Slug Utilities

Add two helper functions to `stateSpecificLaws.ts`:
- `getStateSlug(stateCode)` → converts "CA" to "california", "NY" to "new-york"
- `getStateFromSlug(slug)` → reverse lookup: "new-york" → "NY"

Also export a `CATEGORY_SLUGS` constant — the 13 category IDs already used as slugs.

### Step 2 — New Route Components

**`src/pages/StateRightsStatePage.tsx`** — handles `/state-rights/:stateSlug`

- Reads `stateSlug` from `useParams`
- Resolves to state code via `getStateFromSlug`
- Unique `<title>`: "California Consumer Rights Laws & Statutes | Letter of Dispute"
- Unique `<meta description>`: "Find all California consumer protection statutes — lemon law, tenant rights, debt collection — with Attorney General contact info."
- Shows the state's full data: all available statutes, AG info, cross-links to each category page
- Renders a grid of 13 "category cards" linking to `/state-rights/california/vehicle`, etc.
- Breadcrumb: Home → State Rights → California

**`src/pages/StateRightsCategoryPage.tsx`** — handles `/state-rights/:stateSlug/:categorySlug`

- Reads both params
- Unique `<title>`: "California Lemon Law & Vehicle Consumer Rights | Letter of Dispute"
- Unique `<meta description>`: "California vehicle consumer protection under Cal. Civ. Code § 1790 (Song-Beverly). Find your rights, deadlines, and how to file a complaint."
- Shows: the specific statute(s) for that state+category combo, AG office, federal vs. state comparison, CTA to the matching letter template category
- FAQ structured data: 3 questions specific to state + category (e.g. "What is California's lemon law?")
- Breadcrumb: Home → State Rights → California → Vehicle (Lemon Law)

### Step 3 — Register Routes in `App.tsx`

```tsx
<Route path="/state-rights/:stateSlug" element={<StateRightsStatePage />} />
<Route path="/state-rights/:stateSlug/:categorySlug" element={<StateRightsCategoryPage />} />
```

Both lazy-loaded. The existing `/state-rights` route remains unchanged as the interactive hub.

### Step 4 — Register 701 Routes in `routes.ts`

Generate the full list programmatically at build time:

```ts
// 50 state hub pages
US_STATES.map(s => `/state-rights/${getStateSlug(s.code)}`)

// 650 state+category pages
US_STATES.flatMap(s =>
  Object.keys(CATEGORY_LABELS).map(cat =>
    `/state-rights/${getStateSlug(s.code)}/${cat}`
  )
)
```

This tells the static site generator (vite-ssg) to pre-render all 701 pages with their unique HTML at build time.

### Step 5 — Update Hub Page (`StateRightsPage.tsx`) for Internal Linking

When a user selects a state, instead of just updating query params, also show a prominent link: "View full California consumer rights page →" pointing to `/state-rights/california`.

The 51 state entries in the selector become clickable links to their hub pages, which massively increases crawl depth and internal link equity.

### Step 6 — SEO Metadata Strategy per Page Type

**State hub** (`/state-rights/california`):
- Title: `{StateName} Consumer Rights Laws — All Statutes & AG Contact`
- Description: `Find {StateName}'s consumer protection law ({citation}), lemon law, tenant rights, and more. Includes {AG office name} contact details.`
- H1: "{StateName} Consumer Protection Laws"

**State+category** (`/state-rights/california/vehicle`):
- Title: `{StateName} {CategoryLabel} Rights — {PrimaryStatuteName}`
- Description: `{StateName} consumers: your rights under {citation}. Find statute text, deadlines, and how to file a complaint with the {AG office name}.`
- H1: "{StateName} {CategoryLabel} Consumer Rights"
- FAQ schema: 3 questions auto-generated from the statute data

### No New Data Required

All statute data already exists in `stateSpecificLaws.ts`. The category-to-statute mapping already exists in `getStateStatutesForCategory()`. No new edge functions, no database changes.

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/data/stateSpecificLaws.ts` | Edit | Add `getStateSlug()`, `getStateFromSlug()`, export `CATEGORY_LABELS` |
| `src/pages/StateRightsStatePage.tsx` | Create | New page for `/state-rights/:stateSlug` — state hub with all statute types and category grid |
| `src/pages/StateRightsCategoryPage.tsx` | Create | New page for `/state-rights/:stateSlug/:categorySlug` — targeted statute page with FAQ schema |
| `src/App.tsx` | Edit | Add 2 new lazy route registrations |
| `src/routes.ts` | Edit | Add 701 pre-rendered route strings |
| `src/pages/StateRightsPage.tsx` | Edit | Add "View full page" links for each state selection; update state list items to link to hub pages |

## What This Unlocks

- **701 crawlable, pre-rendered HTML pages** each with unique title, description, H1, and canonical
- **Targeting 650+ long-tail queries**: "Texas lemon law consumer rights", "Florida tenant rights statute", "California debt collection laws", etc.
- **Internal link equity**: the hub page links to 51 state pages; each state page links to 13 category pages; each category page links to the matching letter template
- **Featured snippet potential**: each state+category page's statute summary is structured for Google to pull as a definition answer
- **Zero additional data entry** — all content comes from the existing verified dataset
