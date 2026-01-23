

# Healthcare Templates Expansion Plan

## Overview

This plan expands the healthcare templates from 2 templates to approximately 50 comprehensive templates, organized into 6 major categories based on real-world usage patterns and dispute types.

## Current State

- **Existing templates**: 2 (Medical Billing Error Dispute, Hospital Complaint)
- **Template count in category config**: 6
- **Structure**: Basic fields without granular addressing or regulatory-specific identifiers

## Proposed Template Architecture

### Category Organization

The templates will be organized into these sub-categories:

| Category | Template Count | Priority |
|----------|---------------|----------|
| A. Insurance Claim & Coverage Disputes | 10 | Highest |
| B. Medical Billing Errors | 10 | Very High |
| C. Debt Collection & Credit Reporting | 8 | High |
| D. Provider & Hospital Disputes | 7 | Medium |
| E. Prescription & Pharmacy Disputes | 6 | Medium |
| F. Specialized/Advanced Disputes | 9 | Lower |

**Total: 50 templates**

---

## Field Schema Design

### Core Fields (Used in 90% of templates)

**A. Patient/Consumer Identity**
- `patientFullName` - Full legal name
- `patientDob` - Date of birth
- `patientAddressLine1`, `patientCity`, `patientPostcode`
- `patientPhone`, `patientEmail`
- `relationshipToPatient` - Select: Self, Parent/Guardian, Spouse, Other Representative
- `patientId` - Patient/Member ID
- `nhsNumber` - NHS Number (UK only)
- `medicareNumber` - Medicare Beneficiary ID (US)
- `medicaidId` - Medicaid ID (US)

**B. Provider/Insurer/Collector Details**
- `organizationName`
- `organizationAddressLine1`, `organizationCity`, `organizationPostcode`
- `departmentName` - Claims, Billing, Appeals, Collections
- `faxNumber` - Still widely used in healthcare
- `claimNumber`, `accountNumber`, `referenceId`
- `dateOfService`

**C. Dispute Metadata**
- `disputeType` - Locked per template
- `disputeReason` - Structured + free text
- `amountDisputed`
- `dateBillReceived` / `dateDenialReceived`
- `appealDeadlineAware` - Checkbox for deadline awareness
- `preferredResponseMethod` - Select: Mail, Phone, Portal

---

## Template Breakdown by Category

### A. Insurance Claim & Coverage Disputes (10 templates)

1. **insurance-claim-denial-medical-necessity**
   - Appeal for claims denied due to "not medically necessary"
   - Fields: diagnosis codes, treatment description, physician statement
   
2. **insurance-claim-denial-out-of-network**
   - Appeal out-of-network denials
   - Fields: network status explanation, emergency flag
   
3. **insurance-claim-denial-prior-auth**
   - Appeal denials due to missing prior authorization
   - Fields: authorization number, retroactive auth request
   
4. **insurance-partial-payment-dispute**
   - Dispute underpaid claims
   - Fields: expected vs received amount, EOB analysis
   
5. **insurance-coverage-exclusion-dispute**
   - Challenge policy exclusion decisions
   - Fields: exclusion cited, policy section reference
   
6. **insurance-emergency-care-dispute**
   - Dispute emergency care coverage denials (Prudent Layperson Standard)
   - Fields: emergency indicator, symptoms at presentation
   
7. **insurance-retroactive-denial-appeal**
   - Appeal claims initially approved then denied
   - Fields: original approval date, reason for reversal
   
8. **insurance-prescription-denial-appeal**
   - Appeal denied prescription drug coverage
   - Fields: drug name, formulary tier, alternatives tried
   
9. **insurance-diagnostic-test-denial**
   - Appeal denied diagnostic tests
   - Fields: test type, CPT codes, medical justification
   
10. **insurance-procedure-denial-appeal**
    - Appeal denied surgeries or procedures
    - Fields: procedure codes, pre-authorization details

### B. Medical Billing Errors (10 templates)

11. **medical-billing-incorrect-amount**
    - Dispute incorrect billing amounts
    - Fields: itemized charges, correct amounts
    
12. **medical-billing-duplicate-charge**
    - Dispute duplicate billing
    - Fields: duplicate line items, service dates
    
13. **medical-billing-services-not-received**
    - Dispute charges for services not provided
    - Fields: services claimed, actual services received
    
14. **medical-billing-upcoding**
    - Dispute being charged for higher-level service
    - Fields: billed code vs appropriate code
    
15. **medical-billing-unbundling**
    - Dispute services billed separately
    - Fields: bundled codes, correct coding
    
16. **medical-billing-balance-billing**
    - Dispute balance billing (in-network provider)
    - Fields: in-network confirmation, contracted rates
    
17. **medical-billing-surprise-billing**
    - Dispute surprise medical bills (No Surprises Act)
    - Fields: emergency indicator, consent documentation
    
18. **medical-billing-out-of-network-provider**
    - Hospital-based provider dispute
    - Fields: facility network status, provider disclosure
    
19. **medical-billing-incorrect-patient-info**
    - Dispute billing with wrong patient information
    - Fields: correct vs incorrect details
    
20. **medical-billing-post-insurance-dispute**
    - Dispute billing after insurance payment
    - Fields: EOB details, remaining balance explanation

### C. Debt Collection & Credit Reporting (8 templates)

21. **medical-debt-validation**
    - Request debt validation letter
    - Fields: collection agency details, original creditor, disputed amount
    
22. **medical-debt-collection-dispute**
    - Dispute medical debt with collections agency
    - Fields: dispute reason, FDCPA references
    
23. **medical-debt-cease-communication**
    - Request cease communication
    - Fields: preferred contact method, written-only flag
    
24. **medical-debt-credit-report-dispute**
    - Dispute medical debt on credit report
    - Fields: credit bureau, entry reference, dispute reason
    
25. **medical-debt-paid-removal-request**
    - Request removal of paid medical debt
    - Fields: payment confirmation, deletion request
    
26. **medical-debt-incorrect-balance**
    - Dispute incorrect balance reported
    - Fields: reported balance, actual balance, proof
    
27. **medical-debt-statute-limitations**
    - Dispute debt past statute of limitations
    - Fields: original debt date, state SOL
    
28. **medical-debt-insurance-pending**
    - Dispute debt while insurance pending
    - Fields: insurance claim status, EOB pending

### D. Provider & Hospital Disputes (7 templates)

29. **hospital-negligent-care-complaint**
    - Complain about negligent care (non-legal wording)
    - Fields: incident details, impact, care standards
    
30. **medical-record-inaccuracy-dispute**
    - Dispute inaccurate medical record
    - Fields: specific record section, error description
    
31. **medical-record-diagnosis-correction**
    - Request correction of diagnosis
    - Fields: incorrect diagnosis, correct diagnosis, supporting info
    
32. **medical-record-amendment-hipaa**
    - Request HIPAA amendment of medical record
    - Fields: record section, requested change, reason
    
33. **hospital-discharge-dispute**
    - Dispute premature discharge decision
    - Fields: discharge date, condition at discharge
    
34. **hospital-informed-consent-complaint**
    - Complain about lack of informed consent
    - Fields: procedure, information not provided
    
35. **hospital-misconduct-complaint**
    - Complain about staff misconduct
    - Fields: staff involved, incident description

### E. Prescription & Pharmacy Disputes (6 templates)

36. **prescription-coverage-denial-appeal**
    - Appeal prescription coverage denial
    - Fields: drug name, tier, medical necessity
    
37. **prescription-step-therapy-exception**
    - Request step therapy exception
    - Fields: drugs already tried, medical justification
    
38. **prescription-prior-auth-appeal**
    - Appeal prior authorization denial
    - Fields: PA number, denial reason, clinical notes
    
39. **prescription-generic-substitution-dispute**
    - Dispute generic substitution
    - Fields: brand vs generic, adverse reactions
    
40. **pharmacy-incorrect-charge**
    - Dispute incorrect pharmacy charge
    - Fields: prescription details, charged vs expected
    
41. **prescription-not-covered-exception**
    - Request exception for non-covered medication
    - Fields: drug name, alternatives exhausted

### F. Specialized/Advanced Disputes (9 templates)

42. **insurance-medical-necessity-patient-letter**
    - Patient-perspective medical necessity letter
    - Fields: condition impact, treatment necessity
    
43. **insurance-experimental-treatment-appeal**
    - Appeal experimental/investigational denial
    - Fields: treatment details, clinical trial data
    
44. **insurance-second-level-appeal**
    - Second-level/external appeal
    - Fields: first appeal details, new evidence
    
45. **insurance-external-review-request**
    - Request external/independent review
    - Fields: appeal exhaustion, IRO request
    
46. **insurance-employer-plan-dispute**
    - Dispute with employer-sponsored plan
    - Fields: ERISA references, plan administrator
    
47. **medicaid-denial-appeal**
    - Appeal Medicaid denial (US)
    - Fields: state-specific fields, fair hearing request
    
48. **medicare-denial-appeal**
    - Appeal Medicare denial (US)
    - Fields: Medicare-specific references, QIC appeal
    
49. **workers-comp-medical-dispute**
    - Workers' compensation medical dispute
    - Fields: employer, carrier, claim number
    
50. **long-term-care-coverage-dispute**
    - Dispute long-term care coverage
    - Fields: LTC policy details, benefit trigger documentation

---

## Jurisdiction Configuration

### Updated Healthcare Jurisdictions

```typescript
const healthcareJurisdictions = [
  {
    code: 'UK',
    name: 'United Kingdom',
    legalReference: 'NHS Constitution / Consumer Rights Act 2015',
    approvedPhrases: [
      'Under the NHS Constitution',
      'In accordance with patient rights',
      'Under the Health and Social Care Act 2012'
    ]
  },
  {
    code: 'US',
    name: 'United States',
    legalReference: 'No Surprises Act / HIPAA / FCRA / FDCPA',
    approvedPhrases: [
      'Under the No Surprises Act',
      'Under HIPAA regulations',
      'Under the Fair Credit Reporting Act',
      'Under the Fair Debt Collection Practices Act',
      'Under the Employee Retirement Income Security Act (ERISA)',
      'Under the Prudent Layperson Standard'
    ]
  },
  {
    code: 'EU',
    name: 'European Union',
    legalReference: 'Cross-Border Healthcare Directive / GDPR',
    approvedPhrases: [
      'Under EU patient rights',
      'In accordance with GDPR data rights',
      'Under the Cross-Border Healthcare Directive'
    ]
  },
  {
    code: 'INTL',
    name: 'International / Other',
    approvedPhrases: [
      'In accordance with applicable healthcare standards'
    ]
  }
];
```

---

## Implementation Details

### File Changes

1. **`src/data/templates/healthcareTemplates.ts`**
   - Complete rewrite with 50 templates
   - Organized into logical sections with comments
   - Reusable field sets for common patterns

2. **`src/data/templateCategories.ts`**
   - Update `templateCount` from 6 to 50 for healthcare category
   - Consider marking as `popular: true`

3. **`src/data/allTemplates.ts`**
   - No changes needed (already imports healthcareTemplates)

### Template Structure Pattern

Each template will follow this pattern:

```typescript
{
  id: 'category-specific-id',
  slug: 'seo-friendly-slug',
  category: 'Healthcare',
  title: 'Clear Action-Oriented Title',
  shortDescription: '< 100 chars describing when to use',
  longDescription: 'Detailed description with use cases',
  seoTitle: 'SEO-optimized title | Free Template',
  seoDescription: '< 160 chars for search results',
  tones: ['neutral', 'firm', 'final'],
  fields: [...], // Granular, category-appropriate fields
  sections: [...], // Introduction, Facts, Request, Deadline, Closing
  jurisdictions: healthcareJurisdictions,
  pricing: standardPricing
}
```

### Field Patterns by Template Type

**Insurance Appeal Templates:**
- Plan type selection (HMO, PPO, EPO, HDHP, Medicare, Medicaid)
- Group number for employer plans
- CPT/HCPCS codes (optional)
- ICD-10 diagnosis codes (optional)
- Provider NPI (optional)
- Appeal level (first, second, external)
- Urgency flag (standard vs expedited)

**Medical Billing Templates:**
- Billing account number
- Facility name/location
- Rendering provider
- Itemized charges (structured repeatable concept)
- Emergency vs non-emergency indicator
- Consent acknowledgment

**Debt Collection Templates:**
- Collection agency name
- Original creditor
- Collection account number
- Date of first delinquency
- Credit bureau selection (Experian, Equifax, TransUnion)
- FCRA/FDCPA compliance statements (locked text)

**HIPAA Record Templates:**
- Specific record section disputed
- Amendment request type
- HIPAA-compliant language (locked blocks)

---

## Security Considerations

### Fields Never Requested
- Full Social Security Number
- Complete medical history
- Legal admissions of fault
- Malpractice accusations (wording risk)

### Required Warnings
- Templates include deadline awareness prompts
- Attachment reminders for EOBs, denial letters
- Regulatory escalation paths mentioned

---

## Technical Implementation Notes

### Estimated File Size
- Current file: ~85 lines
- Expanded file: ~3,500-4,000 lines
- Will organize with section comments for maintainability

### Reusable Constants
```typescript
// Field sets to reduce duplication
const corePatientFields = [...]
const insuranceExtensionFields = [...]
const billingExtensionFields = [...]
const debtExtensionFields = [...]
```

### Template Count Update
Update `templateCategories.ts`:
```typescript
{
  id: 'healthcare',
  name: 'Healthcare & Medical Billing',
  description: 'Dispute medical bills, insurance denials, coding errors, or debt collection.',
  icon: Stethoscope,
  templateCount: 50,  // Updated from 6
  color: 'hsl(var(--chart-4))',
  popular: true,  // Mark as popular given high demand
}
```

---

## Summary

This plan creates a comprehensive healthcare dispute template library covering:

- **Insurance disputes**: Appeals for denials, underpayments, coverage exclusions
- **Billing errors**: Upcoding, unbundling, surprise billing, balance billing
- **Debt collection**: Validation requests, credit report disputes, cease communication
- **Provider complaints**: Care quality, medical records, HIPAA amendments
- **Prescription issues**: Coverage appeals, step therapy exceptions, pharmacy disputes
- **Specialized cases**: Medicare, Medicaid, workers' comp, experimental treatment

All templates use granular, regulator-safe field sets following the established patterns from other template files in the codebase.

