
# Insurance Claims Category Expansion to 50 Templates

## Current State
- **Existing templates**: 8
- **Target**: 50
- **Templates to add**: 42

## Existing Insurance Templates
1. Insurance Claim Denial Appeal
2. Insurance Underpayment Dispute
3. Insurance Claim Delay Complaint
4. Insurance Cancellation Refund
5. Insurance Premium Dispute
6. Insurance Policy Dispute
7. Third Party Claim
8. Bad Faith Complaint

---

## New Templates to Add (42 Total)

### Auto/Motor Insurance (8 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 1 | Total Loss Valuation Dispute | `auto-total-loss-dispute` | Vehicle details, market value evidence, insurer offer, fair market comparables |
| 2 | Gap Insurance Claim | `gap-insurance-claim` | Outstanding finance, settlement amount, gap coverage details |
| 3 | Windshield/Glass Claim Dispute | `auto-glass-claim-dispute` | Damage type, repair vs replacement, coverage tier |
| 4 | Rental Car Coverage Denial | `rental-car-coverage-denial` | Policy coverage, rental agreement, dates, denial reason |
| 5 | Diminished Value Claim | `diminished-value-claim` | Accident details, repair costs, pre/post-accident value |
| 6 | Uninsured Motorist Claim | `uninsured-motorist-claim` | Accident details, other driver info, coverage limits |
| 7 | Hit and Run Claim | `hit-and-run-claim` | Incident details, police report, witness info |
| 8 | Storage Fee Dispute | `auto-storage-fee-dispute` | Tow company, daily rate, days stored, insurer delay |

### Home/Property Insurance (10 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 9 | Water Damage Claim Denial | `water-damage-claim-denial` | Damage source, date discovered, mitigation steps |
| 10 | Fire Damage Claim Dispute | `fire-damage-claim-dispute` | Fire origin, investigation report, coverage dispute |
| 11 | Theft Claim Denial | `theft-claim-denial` | Items stolen, police report, security measures |
| 12 | Storm/Weather Damage Claim | `storm-damage-claim` | Weather event, date, damage description, adjuster findings |
| 13 | Roof Damage Dispute | `roof-damage-dispute` | Age of roof, cause of damage, repair estimates |
| 14 | Contents Coverage Dispute | `contents-coverage-dispute` | Inventory list, replacement values, coverage limit |
| 15 | Additional Living Expenses Claim | `additional-living-expenses-claim` | Displacement period, temporary housing costs |
| 16 | Flood Insurance Claim Dispute | `flood-insurance-claim` | NFIP policy, flood zone, water levels, damage extent |
| 17 | Subsidence/Ground Movement Claim | `subsidence-claim` | Structural survey, cause, repair quotes |
| 18 | Landlord Insurance Claim | `landlord-insurance-claim` | Property address, tenant damage, loss of rent |

### Health/Medical Insurance (8 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 19 | Prior Authorization Denial Appeal | `prior-auth-denial-appeal` | Treatment type, medical necessity, physician letter |
| 20 | Out-of-Network Denial Appeal | `out-of-network-denial-appeal` | Provider details, network adequacy, emergency clause |
| 21 | Prescription Coverage Denial | `prescription-coverage-denial` | Medication name, formulary status, step therapy |
| 22 | Mental Health Parity Complaint | `mental-health-parity-complaint` | Treatment type, parity law violation |
| 23 | Ambulance Charge Dispute | `ambulance-charge-dispute` | Transport date, provider, emergency status |
| 24 | Balance Billing Dispute | `balance-billing-dispute` | Provider, billed amount, in-network rate |
| 25 | Coordination of Benefits Dispute | `coordination-of-benefits` | Primary/secondary insurer, COB rules |
| 26 | Annual/Lifetime Limit Dispute | `coverage-limit-dispute` | Treatment type, limit reached, essential benefit |

### Life Insurance (5 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 27 | Life Insurance Claim Denial | `life-insurance-claim-denial` | Policy number, death certificate, denial reason |
| 28 | Beneficiary Dispute | `life-insurance-beneficiary-dispute` | Claimant relationship, designation evidence |
| 29 | Contestability Period Dispute | `life-contestability-dispute` | Policy start date, misrepresentation claim |
| 30 | Accidental Death Benefit Denial | `accidental-death-benefit-denial` | Cause of death, AD&D policy terms |
| 31 | Suicide Clause Dispute | `suicide-clause-dispute` | Policy issue date, contestability period, death circumstances |

### Travel Insurance (5 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 32 | Trip Cancellation Claim | `travel-trip-cancellation-claim` | Trip dates, cancellation reason, covered reasons |
| 33 | Medical Emergency Abroad Claim | `travel-medical-emergency-claim` | Treatment location, bills, currency conversion |
| 34 | Trip Interruption Claim | `travel-trip-interruption-claim` | Reason for interruption, unused portions |
| 35 | Delayed Departure Compensation | `travel-delay-insurance-claim` | Delay duration, expenses incurred |
| 36 | Missed Connection Insurance Claim | `missed-connection-insurance-claim` | Connection details, rebooking costs |

### Pet Insurance (4 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 37 | Pet Insurance Claim Denial | `pet-insurance-claim-denial` | Pet details, condition, vet bills, denial reason |
| 38 | Pre-existing Condition Dispute | `pet-preexisting-condition-dispute` | Pet history, condition onset date, medical records |
| 39 | Hereditary Condition Coverage | `pet-hereditary-condition-claim` | Breed, condition type, policy exclusions |
| 40 | Pet Dental Coverage Dispute | `pet-dental-coverage-dispute` | Dental procedure, coverage tier |

### Business/Commercial Insurance (2 templates)
| # | Template Name | Slug | Key Fields |
|---|---------------|------|------------|
| 41 | Business Interruption Claim | `business-interruption-claim` | Business type, loss period, revenue documentation |
| 42 | Professional Indemnity Claim | `professional-indemnity-claim` | Allegation details, policy coverage, legal costs |

---

## Field Design Principles (Applied to All Templates)

Each template will follow the regulator-aware field system with:

### Universal Insurance Core Fields
- Insurer name and claims address
- Policy number and type
- Policy start/end dates
- Policyholder name and contact details
- Claim reference number
- Claim submission date
- Denial/settlement date
- Denial letter reference

### Claim-Specific Extension Fields
- Incident date, time, location
- Damage/loss description
- Evidence documentation
- Amount claimed vs amount offered
- Appeal reason (structured)

### Regulatory Anchors by Jurisdiction
- **UK**: FCA rules, Financial Ombudsman Service escalation
- **US**: State insurance commissioner, bad faith law references
- **EU**: Insurance Distribution Directive, EIOPA
- **International**: Policy terms enforcement

---

## File Modifications

| File | Changes |
|------|---------|
| `src/data/templates/insuranceTemplates.ts` | Add 42 new template objects |
| `src/data/templateCategories.ts` | Update `templateCount` from 8 to 50 |

---

## Implementation Notes

### Regulatory Text Blocks (Embedded per Jurisdiction)
Templates will include non-editable legal reference blocks that switch based on jurisdiction:

**UK Insurance Appeals:**
- Financial Ombudsman Service (FOS) 8-week rule
- FCA ICOBS conduct standards
- Insurance Act 2015 reasonable expectations

**US Insurance Appeals:**
- State insurance commissioner complaint process
- Bad faith claim elements
- NAIC Market Conduct standards

---

## Template Complexity Estimate

| Template Type | Fields | Sections |
|---------------|--------|----------|
| Standard claim dispute | 20-25 | 5 |
| Complex denial appeal | 28-35 | 5 |
| Multi-party claims | 30-40 | 6 |

---

## Next Categories (After Insurance)

Once Insurance is complete, we can proceed with:
1. **Employment & Workplace** (6 → 50, +44 templates)
2. **E-commerce & Online Services** (5 → 50, +45 templates)
3. **HOA & Property** (3 → 50, +47 templates)
4. **Damaged Goods** (8 → 50, +42 templates)
5. **Financial Services** (10 → 50, +40 templates)
6. **Utilities & Telecommunications** (10 → 50, +40 templates)
7. **Vehicle & Auto** (8 → 50, +42 templates)
8. **Landlord & Housing** (14 → 50, +36 templates)
9. **Refunds & Purchases** (15 → 50, +35 templates)
10. **Travel & Transportation** (20 → 50, +30 templates)
11. **Contractors & Home Improvement** (7 → 50, +43 templates)
