

# Super-Rich Consumer Rights Guide Content

## What We're Building

A massive content expansion of all 13 consumer rights guide pages, transforming them from ~200-word thin pages into 1,500-2,500 word authoritative legal resources. This is a code-only approach -- no database needed -- keeping everything in `consumerRightsContent.ts`.

## Content Enhancements Per Guide

Each of the 13 guides will be expanded with:

1. **Extended introduction** (3-4 paragraphs instead of 1, citing federal laws)
2. **6-8 key rights** (up from 4, each with detailed legal basis)
3. **8-10 common issues** (up from 5)
4. **8-10 action steps** (up from 5, more specific)
5. **6-8 important deadlines** (with statute references)
6. **NEW: Federal Laws section** -- specific statutes that protect consumers (e.g., FCRA, FDCPA, Magnuson-Moss, No Surprises Act)
7. **NEW: FAQ section** -- 5-6 frequently asked questions with detailed answers (also generates FAQPage schema for Google rich snippets)
8. **NEW: Warning signs section** -- red flags consumers should watch for
9. **NEW: Pro tips section** -- expert-level advice

## Interface Changes

The `CategoryGuide` interface will be extended with new optional fields:

```text
+ federalLaws: { name, citation, description, url? }[]
+ faqItems: { question, answer }[]
+ warningSigns: string[]
+ proTips: string[]
```

## Page Component Enhancements

`CategoryGuidePage.tsx` will be updated to render all new sections:

- Federal Laws card with law name, citation, and description
- FAQ accordion section (using existing Accordion component)
- Warning Signs card with alert styling
- Pro Tips card
- FAQPage + BreadcrumbList Schema.org structured data in SEOHead
- Table of Contents with jump links
- "Last updated" freshness badge

## All 13 Categories Getting Rich Content

| Category | Key Federal Laws Referenced |
|----------|---------------------------|
| Refunds & Purchases | FTC Act, Magnuson-Moss Warranty Act, Fair Credit Billing Act, Cooling-Off Rule |
| Landlord & Housing | Fair Housing Act, RESPA, Lead Paint Disclosure Act, Servicemembers Civil Relief Act |
| Travel | DOT Airline Consumer Protections, Montreal Convention, TRIP Act |
| Damaged & Defective Goods | Magnuson-Moss, UCC Article 2, CPSA, FTC Act Section 5 |
| Utilities & Telecom | Telecommunications Act, Truth in Billing, TCPA, Cable Act |
| Financial Services | FCRA, FDCPA, TILA, EFTA, Dodd-Frank Act |
| Insurance Claims | McCarran-Ferguson Act, ACA, state bad faith laws, ERISA |
| Vehicle & Auto | Magnuson-Moss, Federal Odometer Act, TILA for auto loans, state lemon laws |
| Healthcare & Medical | No Surprises Act, HIPAA, EMTALA, ACA, Fair Debt Collection (medical) |
| Employment & Workplace | FLSA, Title VII, ADA, OSHA Act, WARN Act, FMLA |
| E-commerce & Online | CAN-SPAM, COPPA, FTC's Mail Order Rule, CCPA/state privacy laws |
| HOA & Neighbor | Fair Housing Act, state HOA Acts, Davis-Stirling (CA model), covenant law |
| Contractors & Home Improvement | State contractor licensing acts, FTC Cooling-Off Rule, mechanic's lien statutes |

## Files to Create/Modify

1. **`src/data/consumerRightsContent.ts`** -- Complete rewrite with massively expanded content for all 13 categories plus new interface fields
2. **`src/pages/CategoryGuidePage.tsx`** -- Major update with new sections (Federal Laws, FAQ accordion, Warning Signs, Pro Tips, Table of Contents, structured data)
3. **`src/components/SEOHead.tsx`** -- Add support for `faqItems` and `breadcrumbs` props to generate FAQPage and BreadcrumbList schema

## Estimated Content Volume

- ~2,000 words per guide x 13 guides = ~26,000 words of rich, legally-referenced content
- ~78 FAQ items total (6 per guide) for Google rich snippet eligibility
- ~91 federal law references across all guides
- ~130 warning signs and pro tips

## SEO Impact

- FAQPage schema on 13 pages = potential for FAQ rich snippets in Google
- BreadcrumbList schema = breadcrumb display in search results
- Authoritative legal citations = E-E-A-T signals for YMYL content
- Dense internal linking to templates = stronger topical authority
- Long-form content (2,000+ words) = better ranking potential for informational queries

