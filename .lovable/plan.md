# Update: Align Homepage FAQ, FAQ Page, and Legal Pages with Current Platform

## Problem Summary

Several content areas are out of sync with the platform's current offerings:

1. **Homepage FAQ** (`src/components/home/FAQ.tsx`) has critical inaccuracies:
  - Uses **EUR pricing** (EUR 9.99, EUR 19.99, EUR 29.99) instead of current USD pricing ($9.99 / $14.99) - this should be updated when admin change price in admin dadhboard
  - References a "Final Notice" third tier that no longer exists
  - Mentions "editable DOCX" downloads when the model is now "PDF + 30-day Edit Access"
  - No mention of free tools (Small Claims, State Rights, Letter Analyzer, Deadlines)
  - No mention of the AI Dispute Assistant
2. **FAQ Page** (`src/pages/FAQPage.tsx`):
  - Missing an entire "Free Tools" FAQ category (Cost Calculator, Demand Letter Costs, Escalation Guide, State Rights, Deadlines, Letter Analyzer)
  - Pricing section references "$9.99 for PDF + Editable" but not the $5.99 PDF-only tier name. Prices need to match admin dashboard
  - No mention of the AI Dispute Assistant guided intake flow
  - "500+ templates" should be "550+"
3. **Legal pages** (Terms, Privacy, Disclaimer, Cookie Policy): Already up-to-date - no changes needed. They already reference the AI Dispute Assistant, Free Tools, Dispute Tracker, and evidence uploads.
4. **Homepage sections**: Hero, Pricing, HowItWorks - already current.

## Changes

### File 1: `src/components/home/FAQ.tsx` (Homepage FAQ Section)

**Complete rewrite of the FAQ data array** to reflect current platform state:

- **Fix pricing**: Replace EUR amounts with current USD pricing ($5.99 PDF Only, $9.99 PDF + Edit Access, $5.99 edit unlock)
- **Fix product model**: Replace "DOCX" references with "PDF + 30-day in-app editing" model
- **Remove "Final Notice" tier** references (does not exist)
- **Add FAQ about free tools**: "What free tools do you offer?" covering State Rights Lookup, Statute of Limitations Calculator, Small Claims Court Guide (with Cost Calculator, Demand Letter Costs, Escalation Guide), Letter Strength Analyzer, Consumer News Hub
- **Add FAQ about AI Dispute Assistant**: "What is the AI Dispute Assistant?" explaining the guided intake flow
- **Update "How quickly" FAQ**: Mention the AI assistant path as well as direct template browsing
- **Fix currency in "Do I need to mail" FAQ**: Replace EUR 500 with $500
- **Update template count**: 500+ to 550+
- Trim total FAQs to ~10-12 most impactful (homepage should be concise)

### File 2: `src/pages/FAQPage.tsx` (Dedicated FAQ Page)

**Add a "Free Tools" FAQ category** and update existing content:

- Add new category block (id: `free-tools`, icon: `Wrench` or `Calculator`):
  - "What free tools do you offer?"
  - "What is the Small Claims Court Guide?"
  - "How does the State Consumer Rights Lookup work?"
  - "What is the Letter Strength Analyzer?"
- Add new category or entry for AI Dispute Assistant under "Getting Started":
  - "What is the AI Dispute Assistant?"
- **Fix pricing**: Update "Getting Started" and "Pricing" sections to match current $9.99 / $14.99 model - sync with admin dashboard
- **Update template count**: 500+ to 550+
- Fix "PDF + Editable ($14.99)" description to match current naming: "PDF + Edit Access"

### File 3: `src/components/home/FAQ.tsx` - Schema Update

The FAQ schema (JSON-LD) auto-generates from the `faqs` array, so fixing the data fixes the schema automatically. No separate schema change needed.

## What Is NOT Changing

- **Terms of Service** - Already references AI Dispute Assistant, Free Tools, Dispute Tracker
- **Privacy Policy** - Already covers AI intake data, Letter Analyzer, Dispute Tracker data retention
- **Disclaimer** - Already covers AI Dispute Assistant, user responsibility for intake descriptions
- **Cookie Policy** - Already current (no new cookies from free tools)
- **Homepage Hero** - Already current (550+ templates, AI assistant CTA)
- **Pricing component** - Already pulls from site settings ($5.99 / $9.99)
- **HowItWorks** - Already current

## Technical Details


| File                          | Type of Change                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/home/FAQ.tsx` | Rewrite `faqs` array (~12 items), fix pricing/product model, add free tools + AI assistant FAQs                                               |
| `src/pages/FAQPage.tsx`       | Add "Free Tools" category (~4 FAQs), add AI assistant FAQ to Getting Started, fix pricing references, update template count from 500+ to 550+ |


No new dependencies. No database changes. No edge function changes.