

# Fix: Mobile Footer, Em-Dashes, Button Overflow, Interlinking Audit, and SEO Relevance

## 1. Mobile Footer: Two-Row Grid Layout

**Problem:** The footer has 6 columns that stack to a single column on mobile, creating an extremely long scroll. The screenshot shows it takes multiple screens to get through all footer links.

**Fix:** Change the mobile grid from `grid-cols-1` to `grid-cols-2` so footer columns pair up into a compact 2-column layout on small screens.

| File | Change |
|------|--------|
| `src/components/layout/Footer.tsx` | Change line 11: `grid-cols-1 md:grid-cols-3 lg:grid-cols-6` to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`. The Brand column stays full-width with `col-span-2 md:col-span-1`. |

---

## 2. Remove Em-Dash Character from New Pages

**Problem:** The `title` and body text on all three new tool pages use the em-dash character. User wants it removed.

**Fix:** Replace all em-dashes with regular hyphens or restructure the sentence.

| File | Lines | Change |
|------|-------|--------|
| `SmallClaimsCostCalculatorPage.tsx` | 14 | Title: "Small Claims Court Cost Calculator - Estimate Filing Fees by State" |
| `SmallClaimsDemandLetterPage.tsx` | 13, 34 | Title: "Demand Letter Cost Comparison - DIY vs. Lawyer vs. Templates"; body text: replace em-dash with hyphen |
| `SmallClaimsEscalationPage.tsx` | 13, 34 | Title: "Complaint Escalation Guide - Step-by-Step Dispute Resolution Path"; body text: replace em-dash with hyphen |

Note: Em-dashes in `SmallClaimsPage.tsx` (pillar page) are in existing educational content - those will be left as-is since the user said "from all new pages you created."

---

## 3. Fix Button Overflow on Mobile

**Problem:** The screenshot shows the "Browse Demand Letter Templates" button in `DemandLetterCostCalculator.tsx` (line 326-331) has an icon on the left AND an arrow on the right, which makes it too wide for mobile screens and it overflows the card.

**Fix:** In `DemandLetterCostCalculator.tsx`:
- Add `whitespace-normal` to the button so text wraps gracefully on small screens
- Hide the right arrow icon on small screens (`hidden sm:inline`)
- This keeps the button within bounds without changing the desktop experience

| File | Change |
|------|--------|
| `src/components/small-claims/DemandLetterCostCalculator.tsx` | Line 326-331: Add responsive classes to the CTA button to prevent overflow |

---

## 4. Interlinking Audit - Findings

After reviewing all pages, the interlinking is solid but has one gap:

**Current link map:**
- Pillar `/small-claims` links to all 3 tool pages via "Free Tools" grid (good)
- `/small-claims/cost-calculator` links to: demand-letter-cost, state-rights, /small-claims (good)
- `/small-claims/demand-letter-cost` links to: /templates, cost-calculator, escalation-guide (good)
- `/small-claims/escalation-guide` links to: cost-calculator, demand-letter-cost, /do-i-have-a-case (good)
- MegaMenu links to all 3 tool pages (good)
- Mobile nav links to all 3 tool pages (good)

**Missing link:** The Footer "Free Tools" section only lists "Small Claims Court Guide" - it does not include the 3 new tool sub-pages. This is acceptable since the footer shouldn't be overloaded, and the tools are discoverable from the pillar page and MegaMenu.

**Missing link (actionable):** The `/small-claims/cost-calculator` page links back to `/small-claims` but uses `ArrowRight` icon visually (misleading for a "back" action). This is a minor UX issue but not critical.

**Verdict:** Interlinking is correct and complete. No changes needed.

---

## 5. Boosting Relevance of New Tool Pages (SEO Strategy)

These new pages are thin wrapper pages right now. Here is the strategy to boost their relevance:

### A. Add FAQ Schema to Each Tool Page (immediate, this implementation)
Each tool page should include 3-4 targeted FAQ items with `faqItems` prop on `SEOHead`. This gives Google rich snippet eligibility and adds content depth.

Example FAQs for Cost Calculator page:
- "How much does it cost to file in small claims court?"
- "Are there hidden fees in small claims court?"
- "Is it worth suing in small claims court for $500?"

Example FAQs for Demand Letter page:
- "How much does a demand letter cost?"
- "Can I write my own demand letter?"
- "Do I need a lawyer to send a demand letter?"

Example FAQs for Escalation Guide page:
- "What is the complaint escalation process?"
- "When should I file a complaint with a government agency?"
- "What is the difference between a complaint and a lawsuit?"

### B. Add Content Below Tools (immediate, this implementation)
Add 2-3 paragraphs of unique educational content below each tool and before the "What's Next?" section. This gives Google real text to index rather than just an interactive widget.

### C. Internal Blog Linking (future, via SEO dashboard)
Use the existing content planning system to create supporting blog articles targeting long-tail keywords that link back to these tool pages. For example:
- "How Much Does Small Claims Court Cost in [State]?" linking to cost-calculator
- "Demand Letter vs. Lawyer: Which Is Better?" linking to demand-letter-cost
- "Step-by-Step Guide to Escalating a Consumer Complaint" linking to escalation-guide

### D. Footer Addition (optional)
Add the 3 new tool pages as sub-items under the existing "Small Claims Court Guide" footer link, or add a dedicated "Small Claims Tools" group.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/layout/Footer.tsx` | Two-column mobile grid |
| `src/pages/SmallClaimsCostCalculatorPage.tsx` | Remove em-dashes; add FAQ items + educational content |
| `src/pages/SmallClaimsDemandLetterPage.tsx` | Remove em-dashes; add FAQ items + educational content |
| `src/pages/SmallClaimsEscalationPage.tsx` | Remove em-dashes; add FAQ items + educational content |
| `src/components/small-claims/DemandLetterCostCalculator.tsx` | Fix button overflow on mobile |

