
# Insurance Templates Expansion: 4 → 50 Templates

## Current State
- **Existing templates in file**: 4 (Claim Denial, Underpayment, Delay, Cancellation)
- **Target**: 50 templates
- **Templates to add**: 46

---

## Implementation Approach

Due to the large number of templates, I'll implement them in logical subcategories:

### Phase 1: Auto/Motor Insurance (+8 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 1 | `auto-total-loss-dispute` | Total Loss Valuation Dispute | VIN, market value evidence, comparables |
| 2 | `gap-insurance-claim` | Gap Insurance Claim | Finance balance, settlement gap |
| 3 | `auto-glass-claim-dispute` | Windshield/Glass Claim Dispute | Damage type, repair vs replace |
| 4 | `rental-car-coverage-denial` | Rental Car Coverage Denial | Rental agreement, coverage tier |
| 5 | `diminished-value-claim` | Diminished Value Claim | Pre/post accident value |
| 6 | `uninsured-motorist-claim` | Uninsured Motorist Claim | Other driver info, coverage limits |
| 7 | `hit-and-run-claim` | Hit and Run Claim | Police report, witness info |
| 8 | `auto-storage-fee-dispute` | Storage Fee Dispute | Tow company, daily rate, delay |

### Phase 2: Home/Property Insurance (+10 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 9 | `water-damage-claim-denial` | Water Damage Claim Denial | Damage source, mitigation steps |
| 10 | `fire-damage-claim-dispute` | Fire Damage Claim Dispute | Fire origin, investigation report |
| 11 | `theft-claim-denial` | Theft Claim Denial | Items stolen, police report |
| 12 | `storm-damage-claim` | Storm/Weather Damage Claim | Weather event, adjuster findings |
| 13 | `roof-damage-dispute` | Roof Damage Dispute | Roof age, cause, repair estimates |
| 14 | `contents-coverage-dispute` | Contents Coverage Dispute | Inventory list, replacement values |
| 15 | `additional-living-expenses-claim` | Additional Living Expenses Claim | Displacement period, costs |
| 16 | `flood-insurance-claim` | Flood Insurance Claim Dispute | NFIP policy, flood zone, water levels |
| 17 | `subsidence-claim` | Subsidence/Ground Movement Claim | Structural survey, repair quotes |
| 18 | `landlord-insurance-claim` | Landlord Insurance Claim | Tenant damage, loss of rent |

### Phase 3: Health/Medical Insurance (+8 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 19 | `prior-auth-denial-appeal` | Prior Authorization Denial Appeal | Treatment type, medical necessity |
| 20 | `out-of-network-denial-appeal` | Out-of-Network Denial Appeal | Provider details, emergency clause |
| 21 | `prescription-coverage-denial` | Prescription Coverage Denial | Medication, formulary status |
| 22 | `mental-health-parity-complaint` | Mental Health Parity Complaint | Parity law violation |
| 23 | `ambulance-charge-dispute` | Ambulance Charge Dispute | Transport date, emergency status |
| 24 | `balance-billing-dispute` | Balance Billing Dispute | Provider, in-network rate |
| 25 | `coordination-of-benefits` | Coordination of Benefits Dispute | Primary/secondary insurer |
| 26 | `coverage-limit-dispute` | Annual/Lifetime Limit Dispute | Treatment type, essential benefit |

### Phase 4: Life Insurance (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 27 | `life-insurance-claim-denial` | Life Insurance Claim Denial | Death certificate, denial reason |
| 28 | `life-insurance-beneficiary-dispute` | Beneficiary Dispute | Claimant relationship, designation |
| 29 | `life-contestability-dispute` | Contestability Period Dispute | Policy start, misrepresentation claim |
| 30 | `accidental-death-benefit-denial` | Accidental Death Benefit Denial | Cause of death, AD&D terms |
| 31 | `suicide-clause-dispute` | Suicide Clause Dispute | Contestability period, circumstances |

### Phase 5: Travel Insurance (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 32 | `travel-trip-cancellation-claim` | Trip Cancellation Claim | Trip dates, covered reasons |
| 33 | `travel-medical-emergency-claim` | Medical Emergency Abroad Claim | Treatment location, currency |
| 34 | `travel-trip-interruption-claim` | Trip Interruption Claim | Reason, unused portions |
| 35 | `travel-delay-insurance-claim` | Delayed Departure Compensation | Delay duration, expenses |
| 36 | `missed-connection-insurance-claim` | Missed Connection Insurance Claim | Connection details, rebooking costs |

### Phase 6: Pet Insurance (+4 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 37 | `pet-insurance-claim-denial` | Pet Insurance Claim Denial | Pet details, vet bills |
| 38 | `pet-preexisting-condition-dispute` | Pre-existing Condition Dispute | Pet history, condition onset |
| 39 | `pet-hereditary-condition-claim` | Hereditary Condition Coverage | Breed, exclusions |
| 40 | `pet-dental-coverage-dispute` | Pet Dental Coverage Dispute | Dental procedure, coverage tier |

### Phase 7: Business/Commercial Insurance (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 41 | `business-interruption-claim` | Business Interruption Claim | Loss period, revenue docs |
| 42 | `professional-indemnity-claim` | Professional Indemnity Claim | Allegation, legal costs |
| 43 | `public-liability-claim` | Public Liability Claim Dispute | Incident, third party details |
| 44 | `employers-liability-claim` | Employers Liability Claim | Employee injury, HSE report |
| 45 | `cyber-insurance-claim` | Cyber Insurance Claim | Breach details, forensics |
| 46 | `directors-officers-claim` | Directors & Officers Claim | Allegation, D&O coverage |

### Phase 8: Additional Common Templates (+4 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 47 | `insurance-premium-dispute` | Insurance Premium Dispute | Premium history, increase reason |
| 48 | `insurance-policy-dispute` | Insurance Policy Dispute | Policy terms, mis-selling |
| 49 | `third-party-claim` | Third Party Claim | At-fault party details |
| 50 | `insurance-bad-faith-complaint` | Bad Faith Complaint | Bad faith elements, damages |

---

## Field Structure (Applied to All Templates)

### Universal Insurance Core Fields
```text
- insurerName, insurerAddressLine1, insurerCity, insurerPostcode
- insuranceType (select)
- policyholderName, policyholderAddress, policyholderPhone, policyholderEmail
- policyNumber, policyStartDate, policyEndDate
- claimReference, claimSubmissionDate, claimAmount
- incidentDate, incidentDescription
```

### Regulatory Anchors by Jurisdiction
```text
UK: FCA rules, Financial Ombudsman Service, Insurance Act 2015
US: State insurance commissioner, bad faith law, NAIC standards
EU: Insurance Distribution Directive, EIOPA
International: Policy terms enforcement
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/data/templates/insuranceTemplates.ts` | Add 46 new template objects |
| `src/data/templateCategories.ts` | Update `templateCount` from 8 to 50 |

---

## Technical Notes

1. **Template Structure**: Each template follows the existing `LetterTemplate` interface with full field definitions, 5 sections, and jurisdiction-specific legal anchors

2. **Category Consistency**: All templates use `category: 'Insurance'` to match existing templates

3. **Slug Uniqueness**: All slugs are unique and follow kebab-case convention

4. **Field Reuse**: Common fields (insurer details, policy info, claim reference) are reused across templates for consistency

---

## Next Steps After Insurance

Once Insurance is complete (50 templates), proceed with:
1. Employment & Workplace (6 → 50, +44 templates)
2. E-commerce & Online Services (5 → 50, +45 templates)
3. And remaining categories...
