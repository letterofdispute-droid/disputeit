
# Contractors & Home Improvement Templates Expansion: 7 → 50+ Templates

## Current State
- **Existing templates**: 7 (Poor workmanship, Abandonment, Solar panel, Cost overrun, Delayed completion, Deposit dispute, Unlicensed work)
- **Target**: 50+ templates
- **Templates to add**: ~43+

---

## Implementation Approach

Organize templates into modular subcategory files for maintainability:

```
src/data/templates/contractors/
├── generalContractorTemplates.ts    (existing + new general contractor disputes)
├── plumbingTemplates.ts             (NEW - plumber-specific disputes)
├── electricalTemplates.ts           (NEW - electrician-specific disputes)
├── roofingTemplates.ts              (NEW - roofing contractor disputes)
├── hvacTemplates.ts                 (NEW - heating/cooling disputes)
├── landscapingTemplates.ts          (NEW - landscaping/garden disputes)
├── flooringPaintingTemplates.ts     (NEW - flooring, painting, decorating)
├── kitchenBathTemplates.ts          (NEW - kitchen/bathroom remodels)
├── windowDoorTemplates.ts           (NEW - windows, doors, conservatories)
├── pestControlTemplates.ts          (NEW - pest control services)
├── poolSpaTemplates.ts              (NEW - pool/spa installation & maintenance)
└── index.ts                         (barrel export)
```

---

## Phase 1: General Contractor Disputes (+7 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 1 | `contractor-warranty-claim` | Contractor Warranty Claim | Warranty period, defect type, repair requests |
| 2 | `contractor-permit-issue` | Contractor Failed to Obtain Permits | Permit type, inspection failure, compliance |
| 3 | `contractor-subcontractor-damage` | Subcontractor Damage Complaint | Subcontractor name, damage description |
| 4 | `contractor-cleanup-failure` | Contractor Site Cleanup Failure | Debris left, cleanup costs |
| 5 | `contractor-communication-failure` | Contractor Communication Failure | Unanswered calls, missed appointments |
| 6 | `contractor-insurance-claim` | Contractor Insurance/Bonding Claim | Insurance details, claim process |
| 7 | `contractor-material-substitution` | Material Substitution Dispute | Materials specified vs used |

---

## Phase 2: Plumbing Disputes (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 8 | `plumber-leak-repair-failure` | Plumber Leak Repair Failure | Leak location, repair attempts, water damage |
| 9 | `plumber-overcharge` | Plumber Overcharge Complaint | Quoted vs charged, hourly rate disputes |
| 10 | `plumber-code-violation` | Plumbing Code Violation | Violation type, inspector findings |
| 11 | `plumber-water-heater-issue` | Water Heater Installation Dispute | Unit type, installation problems |
| 12 | `plumber-drain-sewer-issue` | Drain/Sewer Repair Dispute | Problem type, camera inspection |
| 13 | `plumber-emergency-callout` | Emergency Plumber Callout Dispute | Emergency nature, excessive charges |

---

## Phase 3: Electrical Disputes (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 14 | `electrician-faulty-wiring` | Faulty Electrical Wiring Complaint | Wiring issues, safety hazards |
| 15 | `electrician-overcharge` | Electrician Overcharge Dispute | Quoted vs charged, parts markup |
| 16 | `electrician-code-violation` | Electrical Code Violation | NEC/IEC violation, inspection failure |
| 17 | `electrician-panel-upgrade` | Electrical Panel Upgrade Dispute | Panel type, capacity issues |
| 18 | `electrician-lighting-installation` | Lighting Installation Dispute | Fixture type, installation quality |
| 19 | `electrician-ev-charger` | EV Charger Installation Dispute | Charger type, electrical requirements |

---

## Phase 4: Roofing Disputes (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 20 | `roofer-leak-after-repair` | Roof Leak After Repair | Leak location, previous repair details |
| 21 | `roofer-material-quality` | Roofing Material Quality Dispute | Material specified vs installed |
| 22 | `roofer-incomplete-work` | Incomplete Roofing Work | Areas unfinished, exposure damage |
| 23 | `roofer-storm-damage-repair` | Storm Damage Repair Dispute | Storm date, insurance involvement |
| 24 | `roofer-gutter-installation` | Gutter Installation Complaint | Gutter type, drainage issues |

---

## Phase 5: HVAC Disputes (+6 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 25 | `hvac-installation-failure` | HVAC Installation Failure | System type, cooling/heating issues |
| 26 | `hvac-repair-ineffective` | HVAC Repair Ineffective | Repair performed, ongoing problems |
| 27 | `hvac-overcharge` | HVAC Overcharge Complaint | Service call fees, parts markup |
| 28 | `hvac-warranty-denial` | HVAC Warranty Claim Denial | Warranty terms, denial reason |
| 29 | `hvac-maintenance-contract` | HVAC Maintenance Contract Dispute | Contract terms, services not provided |
| 30 | `hvac-wrong-size-unit` | Wrongly Sized HVAC Unit | BTU requirements, efficiency issues |

---

## Phase 6: Landscaping & Outdoor (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 31 | `landscaper-poor-workmanship` | Landscaping Poor Workmanship | Design vs execution, plant failures |
| 32 | `landscaper-drainage-issue` | Landscaping Drainage Dispute | Grading issues, flooding |
| 33 | `landscaper-hardscape-failure` | Hardscape Installation Failure | Patio/retaining wall issues |
| 34 | `landscaper-irrigation-problem` | Irrigation System Problem | Sprinkler design, coverage issues |
| 35 | `tree-service-damage` | Tree Service Property Damage | Tree work, property damage |

---

## Phase 7: Flooring, Painting & Decorating (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 36 | `flooring-installation-defect` | Flooring Installation Defect | Floor type, defect description |
| 37 | `flooring-moisture-issue` | Flooring Moisture Damage | Moisture test, subfloor preparation |
| 38 | `painter-poor-quality` | Poor Quality Painting | Surface preparation, coverage issues |
| 39 | `painter-color-mismatch` | Paint Color Mismatch Dispute | Color specified vs applied |
| 40 | `wallpaper-installation-failure` | Wallpaper Installation Failure | Pattern matching, adhesion issues |

---

## Phase 8: Kitchen & Bathroom Remodels (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 41 | `kitchen-remodel-dispute` | Kitchen Remodel Dispute | Scope of work, timeline, quality |
| 42 | `bathroom-remodel-dispute` | Bathroom Remodel Dispute | Scope of work, waterproofing |
| 43 | `cabinet-installation-issue` | Cabinet Installation Dispute | Cabinet type, alignment issues |
| 44 | `countertop-installation-issue` | Countertop Installation Dispute | Material type, seaming, damage |
| 45 | `tile-installation-failure` | Tile Installation Failure | Tile type, grout issues, lippage |

---

## Phase 9: Windows, Doors & Conservatories (+5 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 46 | `window-installation-dispute` | Window Installation Dispute | Window type, drafts, leaks |
| 47 | `door-installation-dispute` | Door Installation Dispute | Door type, fit issues |
| 48 | `conservatory-dispute` | Conservatory/Sunroom Dispute | Structure issues, leaks |
| 49 | `garage-door-dispute` | Garage Door Installation Dispute | Door type, operation issues |
| 50 | `skylight-installation-issue` | Skylight Installation Dispute | Leak issues, condensation |

---

## Phase 10: Specialty Services (+4 templates)
| # | Slug | Title | Key Fields |
|---|------|-------|------------|
| 51 | `pest-control-ineffective` | Pest Control Service Ineffective | Pest type, treatments applied |
| 52 | `pool-installation-dispute` | Pool Installation Dispute | Pool type, construction issues |
| 53 | `pool-maintenance-dispute` | Pool Maintenance Dispute | Service contract, chemical issues |
| 54 | `fence-installation-dispute` | Fence Installation Dispute | Fence type, property line issues |

---

## Universal Contractor Core Fields

### Customer Information
```text
- customerName, customerEmail, customerPhone, customerAddress
- propertyAddress (if different from customer address)
```

### Contractor Information
```text
- contractorName, contractorAddress, contractorEmail, contractorPhone
- contractorLicense, contractorInsurance, contractorBond
- contractorWebsite, contractorRegistration
```

### Contract Details
```text
- contractDate, contractAmount, quoteType (fixed/estimate)
- projectDescription, projectScope
- workStartDate, agreedCompletionDate, actualCompletionDate
- paymentSchedule, amountPaid, balanceDue
```

### Dispute Information
```text
- issueDescription, issueDate, photosDocumented
- previousComplaints, contractorResponse
- resolutionSought, compensationAmount
- independentQuotes, expertAssessment
```

---

## Regulatory Anchors by Jurisdiction

| Region | Primary Law | Licensing | Consumer Protection |
|--------|-------------|-----------|---------------------|
| **UK** | Consumer Rights Act 2015, Supply of Goods and Services Act 1982 | Trading Standards, TrustMark | Consumer Ombudsman, Small Claims Court |
| **EU** | Consumer Rights Directive, National Building Codes | National Trade Registers | European Consumer Centre, ADR |
| **US** | State Contractor Licensing Laws, FTC Home Improvement Rule | State Contractor Boards, CSLB (CA) | State Attorney General, BBB |
| **INTL** | Local Consumer Protection Laws | Varies by jurisdiction | Consumer Courts, Trade Associations |

---

## File Structure

```
src/data/templates/contractors/
├── generalContractorTemplates.ts   # 14 templates (existing 7 + new 7)
├── plumbingTemplates.ts            # 6 templates (NEW)
├── electricalTemplates.ts          # 6 templates (NEW)
├── roofingTemplates.ts             # 5 templates (NEW)
├── hvacTemplates.ts                # 6 templates (NEW)
├── landscapingTemplates.ts         # 5 templates (NEW)
├── flooringPaintingTemplates.ts    # 5 templates (NEW)
├── kitchenBathTemplates.ts         # 5 templates (NEW)
├── windowDoorTemplates.ts          # 5 templates (NEW)
├── specialtyServicesTemplates.ts   # 4 templates (NEW)
└── index.ts                        # Barrel export (total: 61 templates)
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/data/templates/contractors/` | Create directory with subcategory files |
| `src/data/templates/contractorsTemplates.ts` | Refactor to import from subdirectory |
| `src/data/templateCategories.ts` | Update `templateCount` from 7 to 50+ |
| `src/data/allTemplates.ts` | Import updated contractors templates |

---

## Implementation Priority

1. **Phase 1-2**: General Contractor + Plumbing (most common disputes)
2. **Phase 3-4**: Electrical + Roofing (safety-critical trades)
3. **Phase 5-6**: HVAC + Landscaping (seasonal/comfort services)
4. **Phase 7-8**: Flooring/Painting + Kitchen/Bath (interior remodels)
5. **Phase 9-10**: Windows/Doors + Specialty (structural + niche)

---

## Template Quality Standards

Each template must include:
- **Granular fields**: Separate inputs for each piece of information
- **Trade-specific terminology**: Accurate industry terms
- **Evidence requirements**: Photo documentation, inspection reports
- **Regulatory anchors**: Jurisdiction-specific legal references
- **Clear resolution paths**: Repair, refund, compensation options
- **Escalation language**: Trading standards, licensing boards, courts
