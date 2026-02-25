

# Template Library Expansion: Aligning with CFPB/FTC Top Dispute Categories

## Current Coverage Assessment

Here is a category-by-category analysis of what we have vs. what your research highlights as gaps.

### 1. Credit Reporting — BIGGEST GAP
**Current**: 4 templates in `creditDisputeTemplates.ts` (credit limit reduction, application denial, balance transfer, credit score correction) + 2 in core `financialTemplates.ts` (credit-report-error, credit-card-dispute). Most focus on credit *cards*, not credit *reporting*.

**Missing (high priority)**: Bureau-specific FCRA disputes (Experian/Equifax/TransUnion), incorrect payment history, accounts not belonging to you (mixed files), unauthorized hard inquiries, public record errors, 30-day investigation violations, aged-off debt still appearing, duplicate accounts, fraud alert placement failures, security freeze issues, difficulty obtaining free report.

**Recommendation**: Create a new `creditReportingTemplates.ts` file with 10 templates covering the FCRA lifecycle. This is the #1 CFPB category by volume (85%) and our weakest area.

### 2. Identity Theft — ZERO TEMPLATES
**Current**: Nothing dedicated. The `scamFraudTemplates.ts` file covers APP fraud, card fraud, and account takeover, but none of these are identity theft *recovery* letters.

**Missing**: FTC Identity Theft Report cover letter, fraudulent account dispute to creditors, credit freeze/unfreeze request, fraud alert request, tax identity theft (IRS Form 14039 cover), phone/utility fraud dispute, medical identity theft, employment fraud notification.

**Recommendation**: Create `identityTheftTemplates.ts` under `financial/` with 8 templates. Natural funnel into credit reporting templates.

### 3. Debt Collection — MODERATE COVERAGE
**Current**: 1 core template (debt-collection-dispute) + 1 in `loanDisputeTemplates.ts` (statute-barred debt). Total: 2.

**Missing**: Debt validation demand (FDCPA G-Notice), cease & desist letter, time-barred debt defense, harassment complaint (7-in-7 rule), third-party contact violation, paid debt still being collected, incorrect amount dispute, medical debt dispute, CFPB complaint escalation.

**Recommendation**: Create `debtCollectionTemplates.ts` under `financial/` with 8 templates. This is CFPB category #3.

### 4. Credit Cards — GOOD FOUNDATION, GAPS REMAIN
**Current**: 1 core (credit-card-dispute) + 3 in creditDisputeTemplates (limit reduction, application denial, balance transfer). Total: 4.

**Missing**: Billing error dispute (Reg Z/FCBA), unauthorized transaction dispute, interest rate increase challenge, late fee dispute, rewards/points not credited, promotional APR expiration dispute, over-limit fee challenge.

**Recommendation**: Add 6 templates to `creditDisputeTemplates.ts` or create a dedicated `creditCardTemplates.ts`.

### 5. Banking — SOLID COVERAGE
**Current**: 5 templates in `bankingDisputeTemplates.ts` (overdraft, wire transfer, unauthorized direct debit, account closure, ATM) + 1 core (bank-fee-dispute). Total: 6.

**Missing**: Zelle/Venmo unauthorized transfer (Reg E), account freeze dispute, fund availability hold complaint, NSF fee dispute, joint account dispute, POA recognition demand.

**Recommendation**: Add 5 templates to `bankingDisputeTemplates.ts`.

### 6. Auto Sales & Finance — WELL COVERED
**Current**: Extensive coverage across 5 sub-files (dealer, parking, garage, warranty/lemon, finance/lease + additional). Likely 30+ templates.

**Missing**: Spot delivery fraud, electronic kill switch complaint, gap insurance refund, negative equity non-disclosure, interest rate markup complaint.

**Recommendation**: Add 4 templates to `additionalVehicleTemplates.ts`. Lower priority.

### 7. Online Shopping & Subscriptions — WELL COVERED
**Current**: E-commerce category has 5 sub-files (subscription, marketplace, delivery, payment/refund, privacy). ~40 templates.

**Missing**: Drip pricing complaint, fake review complaint, counterfeit goods report, AI-generated product fraud, platform account ban with balance.

**Recommendation**: Add 4 templates to existing e-commerce files. Lower priority.

### 8. Mortgages/Real Estate — ZERO TEMPLATES
**Current**: Housing category is entirely landlord/tenant focused. No mortgage templates exist anywhere.

**Missing**: Payment misapplication dispute, escrow error complaint, PMI removal request, loan modification delay complaint, foreclosure during review complaint, payoff statement error, HELOC freeze challenge, force-placed insurance dispute, closing cost dispute (RESPA), successor in interest claim.

**Recommendation**: Create a new **Real Estate & Mortgages** top-level category with 10 templates. This is high-complexity, high-value content that serves homeowners (a different audience from renters).

### 9. Investment & Scams — PARTIALLY COVERED (UK-HEAVY)
**Current**: 5 in `scamFraudTemplates.ts` (APP fraud, card fraud, account takeover, bank security, crypto scam) + 6 in `investmentDisputeTemplates.ts` (mis-selling, pension transfer, broker fee, trading error, FSCS claim, financial advice). Most are UK-focused (CRM Code, FSCS, FCA).

**Missing**: SEC complaint, FINRA arbitration demand, pig butchering scam report, government impersonation scam (IRS/SSA), tech support scam refund, romance scam bank claim, Ponzi scheme complaint, recovery room scam warning, QR code/phishing fraud report.

**Recommendation**: Add 6 US-focused templates across `scamFraudTemplates.ts` and `investmentDisputeTemplates.ts`.

---

## Implementation Plan — 3 Phases

### Phase 1: Highest Impact (Credit Reporting + Identity Theft + Debt Collection)
These three cover CFPB categories #1, #2, and #3. Currently near-zero coverage.

| New File | Templates | Key Topics |
|----------|-----------|------------|
| `financial/creditReportingTemplates.ts` | 10 | Bureau dispute (per-bureau), incorrect payment history, mixed file dispute, unauthorized inquiry removal, public record error, 30-day investigation violation, aged debt removal, duplicate account, fraud alert request, security freeze |
| `financial/identityTheftTemplates.ts` | 8 | FTC report cover letter, fraudulent account dispute, credit freeze request, fraud alert request, tax ID theft (IRS), phone/utility fraud, medical ID theft, employment fraud |
| `financial/debtCollectionTemplates.ts` | 8 | Debt validation demand, cease & desist, time-barred debt, harassment complaint, third-party contact violation, paid debt still collected, incorrect amount, medical debt |

**Also update**:
- `financialTemplates.ts` — import and spread the 3 new files
- `subcategoryMappings.ts` — add patterns for `credit-reporting`, `identity-theft`, `debt-collection`
- `templateCategories.ts` — update Financial `templateCount`

### Phase 2: Credit Cards + Banking + Mortgages
| File | Templates | Key Topics |
|------|-----------|------------|
| `financial/creditCardTemplates.ts` (new) | 6 | Billing error (FCBA), unauthorized transaction, interest rate increase, late fee, rewards dispute, promotional APR |
| `bankingDisputeTemplates.ts` (extend) | 5 | Zelle/Venmo Reg E, account freeze, fund hold, NSF fee, POA recognition |
| New category: `templates/mortgage/` (new folder) | 10 | Payment misapplication, escrow error, PMI removal, loan mod delay, foreclosure during review, payoff error, HELOC freeze, force-placed insurance, closing costs, successor in interest |

**Also update**:
- `allTemplates.ts` — import mortgage templates
- `templateCategories.ts` — add "Real Estate & Mortgages" category
- `subcategoryMappings.ts` — add mortgage patterns
- MegaMenu — add new category to Letter Templates dropdown

### Phase 3: Scams/Investment (US-focused) + Vehicle + E-commerce
| File | Templates | Key Topics |
|------|-----------|------------|
| `scamFraudTemplates.ts` (extend) | 4 | Government impersonation, tech support scam, romance/pig butchering bank claim, recovery room scam |
| `investmentDisputeTemplates.ts` (extend) | 3 | SEC complaint, FINRA demand, Ponzi scheme report |
| `additionalVehicleTemplates.ts` (extend) | 4 | Spot delivery fraud, kill switch, gap insurance refund, rate markup |
| E-commerce files (extend) | 4 | Drip pricing, counterfeit goods, fake reviews, platform ban with balance |

---

## Summary

| Phase | New Templates | Priority |
|-------|--------------|----------|
| Phase 1 | 26 templates (3 new files) | Critical — covers 85%+ of CFPB volume |
| Phase 2 | 21 templates (2 new files, 1 extension) | High — adds mortgage category + fills credit card/banking gaps |
| Phase 3 | 15 templates (extensions only) | Medium — polishes existing categories |
| **Total** | **62 new templates** | |

This would bring the library from ~550 to ~612 templates and close every major gap identified in the CFPB/FTC data.

Shall I start with Phase 1?

