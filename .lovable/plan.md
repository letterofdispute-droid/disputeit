

# CRO/UX Audit: Small Claims Hub -- Page Restructuring Plan

## The Problem

The current `/small-claims` page has **13 distinct H2 sections** and contains **3 different interactive tools**, **2 state lookup tools**, **7-step filing guide**, **6 winning tips**, **8 FAQ items**, and **multiple CTAs** -- all on a single page. This creates several serious issues:

### UX Issues Identified

1. **Cognitive overload.** A user landing from search has a specific intent (e.g., "how much does small claims court cost in California?") but gets buried under 13+ sections. They bounce before finding their answer.

2. **Tool confusion.** The "Cost Breakdown" section (static cards showing $15-300, $20-75, etc.) and the "Cost Calculator" (interactive form) appear back-to-back and answer the same question. Users see the static answer first and may never scroll to the interactive tool.

3. **Demand letter messaging is scattered.** "Send a Demand Letter" appears as:
   - A CTA in the "What Is Small Claims Court?" section
   - Step 2 in "How to File"
   - An entire standalone tool (DemandLetterCostCalculator)
   - Step 2 in the Escalation Flowchart
   - The bottom CTA
   This repetition feels like a sales pitch rather than a guide.

4. **The Escalation Flowchart duplicates the Filing Steps.** Both are step-by-step paths that largely overlap (contact -> demand letter -> file). Users encounter what feels like the same content twice.

5. **Anchor links don't work reliably.** The hero promotes 5 anchor links, but `ScrollToTop` resets position on navigation, making hash links unreliable from external sources (MegaMenu, mobile nav).

6. **No clear user journey.** A first-time visitor has no guided path -- they're presented with a wall of tools and content with no prioritization.

---

## The Solution: Split Into Focused Pages

Restructure the Small Claims hub into **one pillar page + three dedicated tool pages**, each with a single clear purpose and its own SEO value.

### New Page Architecture

```text
/small-claims                         (Pillar Guide -- educational content)
/small-claims/cost-calculator         (Tool -- interactive cost estimator)  
/small-claims/demand-letter-cost      (Tool -- cost comparison calculator)
/small-claims/escalation-guide        (Tool -- category-driven flowchart)
/small-claims/statement-generator     (existing -- unchanged)
/small-claims/:state                  (existing -- unchanged)
```

---

### Page 1: `/small-claims` (Pillar Guide)

**Purpose:** Answer "What is small claims court?" -- the educational hub.

**Keeps:**
- Hero (updated -- tool links become page links, not anchors)
- "What Is Small Claims Court?" section
- US Map (interactive)
- State Lookup (dropdown)
- "Do I Have a Case?" CTA
- Filing Steps (7-step accordion)
- Cost Breakdown (static cards -- the quick-reference overview)
- "Do You Need a Lawyer?" section
- "How to Win" tips
- FAQ
- Bottom CTA

**Removes (moved to own pages):**
- CostCalculator component
- DemandLetterCostCalculator component
- EscalationFlowchart component

**Adds:**
- A "Free Tools" card grid (3 cards) between Cost Breakdown and "Do You Need a Lawyer?" that links to the three tool pages. Each card shows the tool name, a one-line description, and a "Try It Free" button. This replaces the inline tools with clear navigation.

---

### Page 2: `/small-claims/cost-calculator`

**Purpose:** "How much will my small claims case cost?" -- one focused tool.

**Contains:**
- SEO Head with targeted title: "Small Claims Court Cost Calculator -- Estimate Filing Fees by State"
- Brief intro paragraph (2-3 sentences)
- The full CostCalculator component (state + dispute type + amount)
- After results: a "What's Next?" section with links to:
  - "Send a Demand Letter First" (links to `/small-claims/demand-letter-cost`)
  - "View Your State's Full Guide" (links to `/small-claims/:state`)
  - "Back to Small Claims Guide" (links to `/small-claims`)

---

### Page 3: `/small-claims/demand-letter-cost`

**Purpose:** "Should I write my own demand letter, hire a lawyer, or use a template?" -- one focused comparison.

**Contains:**
- SEO Head: "Demand Letter Cost Comparison -- DIY vs. Lawyer vs. Templates"
- Brief intro explaining why a demand letter matters
- The full DemandLetterCostCalculator component (3-column comparison + savings calculator)
- After the tool: "What's Next?" section with links to:
  - "Browse Letter Templates" (links to `/templates`)
  - "Estimate Your Court Costs" (links to `/small-claims/cost-calculator`)
  - "Not Sure What to Do? Follow the Escalation Guide" (links to `/small-claims/escalation-guide`)

---

### Page 4: `/small-claims/escalation-guide`

**Purpose:** "What should I do step by step to resolve my dispute?" -- one focused flowchart.

**Contains:**
- SEO Head: "Complaint Escalation Guide -- Step-by-Step Dispute Resolution Path"
- Brief intro explaining the escalation concept
- The full EscalationFlowchart component (category selector + flowchart)
- After the tool: "What's Next?" section with links to:
  - "Estimate Court Costs" (links to `/small-claims/cost-calculator`)
  - "Compare Demand Letter Options" (links to `/small-claims/demand-letter-cost`)
  - "Take the Case Strength Quiz" (links to `/do-i-have-a-case`)

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SmallClaimsPage.tsx` | Remove 3 tool imports; add "Free Tools" card grid linking to new pages |
| `src/pages/SmallClaimsCostCalculatorPage.tsx` | **New** -- wrapper page for CostCalculator tool |
| `src/pages/SmallClaimsDemandLetterPage.tsx` | **New** -- wrapper page for DemandLetterCostCalculator tool |
| `src/pages/SmallClaimsEscalationPage.tsx` | **New** -- wrapper page for EscalationFlowchart tool |
| `src/App.tsx` | Add 3 new routes before the `:state` wildcard |
| `src/routes.ts` | Add 3 new static routes for SSG |
| `src/components/layout/MegaMenu.tsx` | Update tool links from hash anchors to real page URLs |
| `src/components/layout/Header.tsx` | Update mobile nav tool links from hash anchors to real page URLs |

---

## Technical Details

### Route Order (Critical)

The three new routes must be added **before** the `/small-claims/:state` wildcard route in `App.tsx` to prevent React Router from matching "cost-calculator" as a state slug:

```tsx
<Route path="/small-claims" element={<SmallClaimsPage />} />
<Route path="/small-claims/cost-calculator" element={<SmallClaimsCostCalculatorPage />} />
<Route path="/small-claims/demand-letter-cost" element={<SmallClaimsDemandLetterPage />} />
<Route path="/small-claims/escalation-guide" element={<SmallClaimsEscalationPage />} />
<Route path="/small-claims/statement-generator" element={<SmallClaimsGeneratorPage />} />
<Route path="/small-claims/:state" element={<SmallClaimsStatePage />} />
```

### "Free Tools" Card Grid on Pillar Page

Replaces the 3 inline tools with a clean navigation section:

```text
+----------------------------+  +----------------------------+  +----------------------------+
| Calculator icon            |  | DollarSign icon            |  | GitBranch icon             |
|                            |  |                            |  |                            |
| Court Cost Calculator      |  | Demand Letter Costs        |  | Escalation Guide           |
| Estimate filing fees,      |  | Compare DIY vs. lawyer     |  | Step-by-step path from     |
| service costs & ROI for    |  | vs. our templates.         |  | first contact to court.    |
| your specific case.        |  |                            |  |                            |
|                            |  |                            |  |                            |
| [Try It Free ->]           |  | [Compare Options ->]       |  | [See the Steps ->]         |
+----------------------------+  +----------------------------+  +----------------------------+
```

### SEO Benefits

- Each tool page gets its own `<title>`, `<meta description>`, canonical URL, and FAQ schema -- tripling the number of indexable, rankable pages.
- The pillar page `/small-claims` becomes cleaner and faster (smaller JS bundle, less DOM), improving Core Web Vitals.
- Internal linking between tools creates a strong topic cluster around "small claims court."

### Navigation Updates

MegaMenu and mobile nav links change from hash anchors (`/small-claims#cost-calculator`) to real routes (`/small-claims/cost-calculator`), which resolves the unreliable hash scrolling issue.

