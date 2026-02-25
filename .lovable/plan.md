

# Post-Fix Audit + AI Coverage Gap Analysis + Specialized AI Architecture

## Part 1: Template & Subcategory Re-Audit (Post-Fix Leftovers)

After reviewing all template files against the current `subcategoryMappings.ts` patterns, here are the remaining issues:

### 1A. Subcategory Pattern Gaps (Leftovers)

| Template ID | File | Expected Subcategory | Current Match | Issue |
|-------------|------|---------------------|---------------|-------|
| `credit-score-correction-request` | creditDisputeTemplates | Credit Reporting | Credit Cards | `credit-` prefix hits credit-cards pattern before credit-reporting |
| `authorized-push-payment-fraud` | scamFraudTemplates | Fraud & Scams | General | No pattern matches `authorized-push` |
| `bank-security-breach-complaint` | scamFraudTemplates | Fraud & Scams | Banking | `bank-` prefix matches banking pattern first |
| `card-fraud-dispute` | scamFraudTemplates | Fraud & Scams | Credit Cards | `card-` matches credit-card pattern |
| `cryptocurrency-scam-complaint` | scamFraudTemplates | Fraud & Scams | General | `cryptocurrency` not in fraud pattern |
| `pension-transfer-dispute` | investmentDisputeTemplates | Investments | General | `pension` not in investments pattern |
| `financial-advice-complaint` | investmentDisputeTemplates | Investments | General | `financial-advice` not in investments pattern |
| `trading-platform-error-complaint` | investmentDisputeTemplates | Investments | General | `trading` not in investments pattern |

### Fix for `subcategoryMappings.ts` (Financial section)
- **Banking pattern**: Remove bare `bank-account` (too broad, catches `bank-security-breach`). Use `bank-account-closure|checking|savings|atm|branch|overdraft|wire-transfer|nsf|fund-availability|zelle|venmo|direct-debit|standing-order|poa-recognition|interest-rate-dispute`
- **Credit Cards pattern**: Narrow `credit-` matching to avoid catching credit-score. Use `credit-card|charge-dispute|statement-error|apr(?!-)|billing-error|rewards-dispute|promotional-apr|credit-limit|credit-application|balance-transfer`
- **Credit Reporting pattern**: Add `credit-score`
- **Investments pattern**: Add `pension|financial-advice|trading`
- **Fraud pattern**: Add `authorized-push|card-fraud|bank-security|cryptocurrency-scam`
- **Pattern ordering**: Move Fraud & Scams ABOVE Banking and Credit Cards so specific fraud IDs match first

### 1B. Template Count Verification (Still Accurate)
The counts set in the last fix (Financial: 78, Vehicle: 45, E-commerce: 44) remain correct. No new files were added.

---

## Part 2: AI Systems Not Updated for New Templates

Three AI systems reference template data and are **NOT updated** to cover the 62 new templates:

### 2A. `siteContext.ts` - Dispute Assistant Slug Whitelist (CRITICAL)

**Problem**: The `DISPUTE_ASSISTANT_CONTEXT` contains a hardcoded whitelist of valid template slugs (lines 110-183). None of the 62 new templates are listed. This means the Dispute Assistant **cannot recommend** any of the new Credit Reporting, Identity Theft, Debt Collection, Credit Card, Banking, Mortgage, Scam, Investment, Vehicle, or E-commerce templates.

**Also stale**:
- `SITE_CONFIG.templateCount` says `'450+'` -- should be `'550+'` or `'600+'`
- `CATEGORIES` array (line 12-26) has outdated `templateCount` values (e.g., Financial shows 10 instead of 78)
- `CATEGORIES` array is missing the `Real Estate & Mortgages` category entirely

**Fix**: Update the slug whitelist with all 62 new slugs, update SITE_CONFIG.templateCount, update CATEGORIES counts, and add the mortgage category.

### 2B. `generate-legal-letter/index.ts` - LEGAL_KNOWLEDGE (MODERATE)

**Problem**: The `LEGAL_KNOWLEDGE` object (line 21-176) has entries for `financial`, `insurance`, `vehicle`, `housing`, `refunds`, `travel`, `utilities`, `employment`, `healthcare`, `ecommerce`, `hoa`, `contractors`, `damaged-goods` -- but **NO entry for `mortgage` / `real-estate-mortgages`**. Any mortgage template that hits this edge function will fall back to generic knowledge with no RESPA, TILA, or Dodd-Frank citations.

**Fix**: Add a `mortgage` entry with RESPA, TILA, Dodd-Frank statutes, CFPB agency, and relevant timeframes.

### 2C. `form-assistant/index.ts` - categoryExpertise (MODERATE)

**Problem**: The `categoryExpertise` object (line 12-61) has entries for Travel, Insurance, Housing, Contractors, Financial, Healthcare, Vehicle -- but is **missing**:
- `Real Estate & Mortgages` -- no mortgage-specific expertise
- `E-commerce` -- falls back to generic
- `Employment` -- falls back to generic
- `HOA & Property` -- falls back to generic
- `Refunds & Purchases` -- falls back to generic
- `Damaged Goods` -- falls back to generic

While these last few are less critical (the generic fallback is reasonable), the **Mortgage** gap is significant since RESPA/TILA/servicing rules are highly specialized.

**Fix**: Add `'Real Estate & Mortgages'` expertise entry with RESPA QWR procedures, escrow analysis, PMI rules, dual tracking prohibitions, and CFPB servicing rules.

### 2D. `categoryKnowledge.ts` - Client-side Knowledge Base (MODERATE)

**Problem**: No `'Real Estate & Mortgages'` key exists. The form-level knowledge (evidence requirements, regulations, tips) will be empty for all 10 mortgage templates.

**Fix**: Add a `'Real Estate & Mortgages'` entry with subcategories for Payment Issues, Escrow, PMI, Foreclosure, Closing, Force-Placed Insurance, and Inherited Property.

### 2E. `legalKnowledge.ts` - Legal Knowledge Database (MODERATE)

**Problem**: No entry with `categoryId: 'mortgage'` or `'real-estate-mortgages'`. The `ResolutionPlanPanel` and `EscalationFlowchart` components will show no legal data for mortgage templates.

**Fix**: Add a mortgage entry with RESPA, TILA, Dodd-Frank, HPA statutes and CFPB/HUD agencies.

---

## Part 3: Specialized AI Per Category -- Architecture Assessment

**Your question**: Should we have multiple AI "experts" -- one specialized for each template category (e.g., Financial vs Healthcare vs Vehicle)?

**Answer: You already have the foundation for this, and yes -- deepening it is both possible and valuable.**

### What Already Exists

The `form-assistant/index.ts` edge function already implements a **category-specific expertise** pattern via the `categoryExpertise` object. When a user fills out a Financial template, the AI gets Financial-specific context; when they fill out a Travel template, it gets Travel context. This is the right architecture.

The `generate-legal-letter/index.ts` edge function similarly switches `LEGAL_KNOWLEDGE` by category to inject the right statutes and agencies.

### What Would Make It Better

Currently each category's expertise is a **single paragraph**. A truly specialized AI per category would mean:

```text
Current (shallow):
  Financial: "You understand FCRA, FDCPA, and banking regulations..." (5 lines)

Proposed (deep):
  Financial > Credit Reporting: 
    - FCRA dispute lifecycle (30-day investigation, reinsertion rules)
    - Bureau-specific procedures (Experian online vs TransUnion mail)
    - Furnisher vs CRA obligations under § 1681s-2
    
  Financial > Debt Collection:
    - FDCPA validation timeline (30 days from G-Notice)
    - 7-in-7 call harassment rule
    - Time-barred debt revival rules by state
    
  Financial > Identity Theft:
    - FTC recovery plan steps
    - Extended fraud alert vs credit freeze
    - IRS Form 14039 process
```

### Recommended Architecture

Instead of creating separate edge functions per category (which increases maintenance), **deepen the existing `categoryExpertise` object into a two-level system**: category + subcategory. The edge function already receives the `category` parameter -- we just need to also pass the subcategory or template slug so it can select the right specialized context.

### Implementation Plan

| File | Change |
|------|--------|
| `form-assistant/index.ts` | Expand `categoryExpertise` from 7 entries to ~20 subcategory-aware entries, accept `subcategory` param, and add mortgage expertise |
| `generate-legal-letter/index.ts` | Add `mortgage` to `LEGAL_KNOWLEDGE`, expand `financial` into sub-entries for credit-reporting, identity-theft, debt-collection |
| `siteContext.ts` | Update slug whitelist with 62 new slugs, fix counts, add mortgage category |
| `categoryKnowledge.ts` | Add `'Real Estate & Mortgages'` category entry |
| `legalKnowledge.ts` | Add mortgage `CategoryLegalKnowledge` entry |
| `subcategoryMappings.ts` | Fix 8 remaining pattern conflicts |

---

## Summary of All Changes

| Priority | What | Files |
|----------|------|-------|
| Critical | Update Dispute Assistant slug whitelist + counts | `siteContext.ts` |
| Critical | Fix 8 remaining subcategory pattern conflicts | `subcategoryMappings.ts` |
| High | Add mortgage legal knowledge to letter generator | `generate-legal-letter/index.ts` |
| High | Add mortgage category expertise to form assistant | `form-assistant/index.ts` |
| High | Add mortgage to client-side knowledge bases | `categoryKnowledge.ts`, `legalKnowledge.ts` |
| Medium | Deepen `categoryExpertise` with subcategory-level specialization (Phase 2 enhancement) | `form-assistant/index.ts` |

This is a single implementation batch -- all files can be updated together. The subcategory-level AI deepening (the "specialized AI per category" question) can be done in a follow-up pass once the foundation is solid.

