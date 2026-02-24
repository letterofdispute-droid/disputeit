

# Plan: Three Full-Featured Interactive Tools for Small Claims Hub

## Overview

Build three production-quality interactive tools, each with comprehensive inputs, detailed results, and clear CTAs. All are 100% client-side using existing data from `smallClaimsData.ts`, `legalKnowledge.ts`, and `templateCategories.ts`.

---

## Tool 1: Small Claims Court Cost Calculator

**File:** `src/components/small-claims/CostCalculator.tsx`

A full-featured calculator with three inputs and comprehensive results:

**Inputs:**
- **State** (dropdown from all 51 entries in smallClaimsData)
- **Type of Dispute** (10 options: Breach of Written Contract, Breach of Verbal Agreement, Property Damage, Personal Injury, Security Deposit, Defective Product, Unpaid Debt, Auto Repair, Contractor Dispute, Other)
- **Claim Amount** (dollar input with formatting)

**Results Panel (shown after clicking "Calculate My Costs"):**
1. **Eligibility Banner** -- green if within filing limit, amber warning if over limit with explanation of options (reduce claim or file in higher court)
2. **Cost Breakdown Grid** (4 cards): Filing Fee, Service of Process ($20-75), Total Estimated Cost, Time to Hearing
3. **Detailed Info Card**: Court name, filing limit, lawyers allowed (yes/no with icons), appeals allowed, relevant statute of limitations (dynamically selected based on dispute type -- e.g. "Written Contract: 6 years" for a contract dispute in California)
4. **State-specific notes** from `specialNotes` array
5. **ROI Analysis**: Shows cost as percentage of claim value ("Your costs of $55-130 represent just 1.3% of the claim value -- that's a strong return")
6. **Action Buttons**: View state filing guide, Send a demand letter first, Visit court website

**Technical:** Uses `parseFeeRange()` to extract min/max from strings like "$30-$75". Maps dispute types to the correct `statuteOfLimitations` fields (e.g. "contractor" maps to both propertyDamage and writtenContract SOLs).

---

## Tool 2: Demand Letter Cost Comparison Calculator

**File:** `src/components/small-claims/DemandLetterCostCalculator.tsx`

An interactive comparison tool showing three resolution paths side by side:

**Input:**
- **Claim Amount** (dollar input) -- used to calculate lawyer costs as a percentage

**Three-Column Comparison (always visible):**

| | DIY (Write It Yourself) | Hire a Lawyer | Letter of Dispute |
|---|---|---|---|
| Cost | Free | $150-500/hr ($300-1,500 total) | From $9.99 |
| Time | 2-4 hours research + writing | 1-2 weeks for appointment + drafting | Under 5 minutes |
| Legal Citations | None (unless you research) | Yes, state-specific | Yes, AI-grounded in real statutes |
| Success Rate | Low -- often ignored | High, but expensive | High -- professional formatting + citations |
| State-Specific | Manual research required | Yes | Yes, auto-selected |
| Customization | Full control | Attorney handles | Guided wizard, full editing |

**Dynamic Savings Section (shows when claim amount entered):**
- Visual bar chart showing: Lawyer cost vs. Letter of Dispute cost vs. claim amount
- "Save up to $X by using Letter of Dispute instead of a lawyer" calculation
- "A lawyer would cost X% of your claim -- we cost less than Y%"

**Bottom CTA:** "Browse Demand Letter Templates" button linking to /templates

---

## Tool 3: Complaint Escalation Flowchart

**File:** `src/components/small-claims/EscalationFlowchart.tsx`

An interactive, category-aware escalation path visualization:

**Input:**
- **Dispute Category** (dropdown from all 13 categories in `templateCategories.ts`: Refunds, Housing, Insurance, Vehicle, Financial, etc.)

**Default State (before selection):**
Shows a generic 5-step escalation path that applies to most disputes:
1. Contact the Company Directly (attempt resolution)
2. Send a Formal Demand Letter (create paper trail)
3. File Regulatory Complaint (CFPB, FTC, State AG, etc.)
4. File BBB / Consumer Agency Report
5. File in Small Claims Court

**After Category Selection:**
Pulls the `escalationPaths` array from `legalKnowledge.ts` for the selected category and renders:
- Each step as a numbered card with connecting vertical line/arrow
- **Relevant agencies** with names, abbreviations, and complaint URLs (clickable)
- **Key timeframes** (e.g., "Credit bureau investigation: 30 days per FCRA 1681i")
- **Federal statutes** that protect the user (e.g., "Fair Credit Reporting Act, 15 U.S.C. 1681")
- **Typical violations** to reference (helps users identify if their rights were violated)
- A "Your Rights" sidebar badge listing consumer rights for that category

**Each step card includes:**
- Step number (1, 2, 3...)
- Title (from escalationPaths)
- Relevant timeframe if applicable
- CTA link: "Browse [Category] Templates" or "File complaint at [agency URL]"

**Visual Design:**
- Vertical flowchart with CSS connector lines (border-left + pseudo-elements for circles/arrows)
- Steps alternate subtle background colors for visual separation
- Color-coded by severity: green (contact) -> amber (formal letter) -> orange (regulatory) -> red (court)
- Each step has an icon: MessageSquare -> FileText -> Building -> Scale

---

## Page Integration

**File:** `src/pages/SmallClaimsPage.tsx`

Insert the three new tools after the existing `CostBreakdown` section:

```text
...
CostBreakdown (existing -- general info)
CostCalculator (NEW -- personalized calculator)
DemandLetterCostCalculator (NEW -- cost comparison)
EscalationFlowchart (NEW -- category-driven paths)
Do You Need a Lawyer? (existing)
...
```

Import and add:
```tsx
import CostCalculator from '@/components/small-claims/CostCalculator';
import DemandLetterCostCalculator from '@/components/small-claims/DemandLetterCostCalculator';
import EscalationFlowchart from '@/components/small-claims/EscalationFlowchart';
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/small-claims/CostCalculator.tsx` | New -- full interactive cost calculator with state/type/amount inputs |
| `src/components/small-claims/DemandLetterCostCalculator.tsx` | New -- 3-column cost comparison with dynamic savings calculator |
| `src/components/small-claims/EscalationFlowchart.tsx` | New -- category-driven escalation path with legal data |
| `src/pages/SmallClaimsPage.tsx` | Import and place the three new components |

---

## Technical Notes

- All three tools are 100% client-side -- no backend, no API calls, no edge functions
- Data sources: `smallClaimsData.ts` (51 states + DC with fees, limits, SOLs, notes), `legalKnowledge.ts` (statutes, agencies, timeframes, escalation paths for 10+ categories), `templateCategories.ts` (13 categories)
- Components use existing shadcn/ui primitives: Card, Select, Input, Badge, Button, Label
- Results sections use `animate-fade-up` for smooth reveal
- Fully responsive -- single column on mobile, grid layouts on desktop
- Escalation flowchart uses CSS borders/pseudo-elements for connector lines (no charting library)

