

# Small Claims Court Guide and Tool — Implementation Plan

## Competitive Intelligence Summary

**CaseCraft.ai** (casecraft.ai) is a UK-focused small claims platform with:
- AI-powered case filing and document generation
- A polished dashboard (case tracker, calendar, document management, AI chatbot)
- Success-based pricing: 10% only if you win
- Strong UX but limited to UK jurisdiction only

**LogicBalls** has a basic form-based "Small Claims Statement Generator" — shallow, no state-specific logic.

**IdeaBrowser** is just a market research report, not a competitor.

**Critical SERP insight**: The top 97 organic results for "small claims court" (40,500/mo) are exclusively government .gov sites and legal encyclopedias (Nolo, FindLaw). Zero AI tools or interactive resources rank for these terms. This is a wide-open opportunity.

---

## Keyword Opportunity Map

| Keyword Cluster | Volume/mo | KD | Our Angle |
|---|---|---|---|
| "small claims court" (head term) | 40,500 | 61 | Comprehensive guide hub |
| "how to file small claims court" variants | 1,600-2,900 | 34-53 | Step-by-step interactive guide |
| State-specific ("small claims court [state]") | 590-1,900 each | 18-42 | 50 state pages (low KD!) |
| "small claims court limit/amount" | 880-2,400 | 39-50 | Interactive limits lookup table |
| "small claims court cost/fees" | 880 | 26-32 | Fee calculator by state |
| "how much does small claims court cost" | 880 | 26 | Cost breakdown tool |
| "do you need a lawyer for small claims court" | 720 | 19 | Informational guide |
| "how to take someone to small claims court" | 2,400 | 42 | Action-oriented guide |
| "how to sue someone in small claims court" | 1,000 | 44 | Process walkthrough |
| "small claims court forms" | 1,300 | 42 | Forms directory by state |
| "how to win in small claims court" | 590 | 24 | Strategy guide |

**Total addressable search volume**: ~80,000+/mo across all variants

---

## What We Will Build

### 1. Small Claims Court Hub Page (`/small-claims`)

A comprehensive, SEO-optimized guide page that serves as the pillar content for all small claims queries. This single page targets the head term "small claims court" (40,500/mo) and dozens of long-tail variants.

**Page sections:**
- Hero with "Small Claims Court: The Complete Guide" headline
- "What is Small Claims Court?" explainer section
- **Interactive State Lookup Tool** (the linkable asset) — select your state, instantly see:
  - Filing limit (dollar amount)
  - Filing fee range
  - Statute of limitations
  - Where to file (court type name)
  - Link to state court website
  - Link to our `/state-rights/[state]` page for deeper legal info
- "How to File a Small Claim" step-by-step accordion (targets "how to file" cluster)
- "How Much Does Small Claims Court Cost?" section with fee ranges
- "Do You Need a Lawyer?" section
- "How to Win Your Case" tips section
- FAQ accordion with JSON-LD FAQPage schema
- CTA blocks linking to our demand letter templates (natural conversion path: "Before you file, send a demand letter first")

### 2. State-Specific Small Claims Pages (`/small-claims/[state]`)

50 state + DC pages, each targeting "[state] small claims court" queries (590-1,900/mo each, KD 18-42).

**Each page includes:**
- State-specific filing limits, fees, court names
- Step-by-step filing instructions for that state
- Links to actual court forms (external)
- Links to our existing `/state-rights/[state]` pages
- Relevant demand letter templates for that state
- FAQ schema with state-specific questions

### 3. Small Claims Statement Generator (`/small-claims/statement-generator`)

A free AI-powered tool (similar to LogicBalls but far better) that generates a small claims court statement of claim. This is the "free tool" linkable asset.

**Form fields:**
- State (dropdown — auto-populates court info)
- Claim amount
- Nature of dispute (dropdown: unpaid debt, property damage, contract breach, security deposit, defective goods, services not rendered)
- Brief description of what happened
- What you want (the remedy)
- Defendant name

**Output:** A formatted Statement of Claim / Plaintiff's Statement with:
- Proper court header for the selected state
- Numbered factual allegations
- Legal basis (citing relevant state statutes from our existing `stateSpecificLaws.ts`)
- Prayer for relief

Free to use (1 per day without account, unlimited with account). This drives signups and positions us as the go-to small claims resource.

---

## Data Architecture

**New data file**: `src/data/smallClaimsData.ts`

Contains for each state:
- `filingLimit`: dollar amount
- `filingFee`: range string
- `courtName`: what the court is called in that state (e.g., "Justice Court" in Texas, "Small Claims Division" in California)
- `statuteOfLimitations`: by type (written contract, oral contract, property damage, personal injury)
- `courtWebsite`: official URL
- `formLinks`: array of form URLs
- `specialNotes`: state-specific rules (e.g., "Corporations must be represented by an attorney in California")

This data is verified and static — sourced from state court websites. No AI hallucination risk.

---

## Technical Implementation

### Files to Create
1. `src/data/smallClaimsData.ts` — State-by-state court data (limits, fees, forms, rules)
2. `src/pages/SmallClaimsPage.tsx` — Hub page with interactive state lookup
3. `src/pages/SmallClaimsStatePage.tsx` — Individual state pages (51 total)
4. `src/pages/SmallClaimsGeneratorPage.tsx` — AI statement generator tool
5. `src/components/small-claims/StateLookup.tsx` — Interactive state selector component
6. `src/components/small-claims/FilingSteps.tsx` — Step-by-step accordion
7. `src/components/small-claims/CostBreakdown.tsx` — Fee/cost information component
8. `src/components/small-claims/StatementForm.tsx` — Generator form component
9. `supabase/functions/generate-small-claims-statement/index.ts` — Edge function for AI statement generation

### Route Updates
- Add `/small-claims` to `App.tsx` and `routes.ts`
- Add `/small-claims/:state` for all 50 states + DC
- Add `/small-claims/statement-generator`

### SEO Implementation
- Each page gets unique title, description, canonical URL
- FAQPage JSON-LD schema on hub and state pages
- HowTo JSON-LD schema on the filing steps
- BreadcrumbList JSON-LD schema
- Internal linking from existing `/state-rights/[state]` pages
- Internal linking from relevant letter template pages
- All 51+ pages added to SSG routes for pre-rendering

### Navigation Integration
- Add "Small Claims Court Guide" to the MegaMenu under "Free Tools"
- Add to footer navigation
- Cross-link from existing Deadlines page and State Rights pages

---

## SEO Strategy: Why This Will Rank

1. **Low-competition state pages**: 51 pages targeting queries with KD 18-42 will rank fastest (3-6 months)
2. **Comprehensive hub page**: Targets the 40,500/mo head term with depth that .gov sites lack (interactive tools, cross-references)
3. **Internal link power**: 5,780 existing articles can link to these pages, passing authority
4. **Linkable asset**: The free statement generator is something journalists and legal bloggers will reference
5. **Existing domain infrastructure**: Our state-rights data (`stateSpecificLaws.ts`) gives us a foundation no competitor has

---

## Implementation Sequence

1. Create `smallClaimsData.ts` with all 51 state datasets
2. Build the hub page (`SmallClaimsPage.tsx`) with state lookup tool
3. Build state-specific pages (`SmallClaimsStatePage.tsx`)
4. Build the statement generator form + edge function
5. Update routing, navigation, and internal links
6. Add JSON-LD schema to all pages

