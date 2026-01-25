
# Add High-Demand Missing Templates

## Overview

I'll add 4 critical high-demand templates that cover major consumer protection scenarios currently missing from the platform:

| Template | Category | Priority | Key Regulations |
|----------|----------|----------|-----------------|
| Lemon Law Formal Demand | Vehicle | High | State Lemon Laws (US), Consumer Rights Act (UK) |
| Identity Theft Fraud Alert | Financial | High | FCRA, Data Protection Act, GDPR |
| FOIA/Subject Access Request | Financial/Privacy | High | FOIA (US), GDPR Article 15, UK DPA 2018 |
| Employment Discrimination | Employment | High | Title VII (US), Equality Act 2010 (UK) |

---

## Template 1: Lemon Law Formal Demand Letter

**Category:** Vehicle  
**Slug:** `lemon-law-demand`  
**Target:** Manufacturers refusing to replace/refund defective vehicles

### Fields (~28 total)

**Vehicle Identification:**
- Vehicle make, model, year, variant
- VIN (17-character)
- Registration/License plate
- Vehicle color
- Purchase date
- Purchase price
- Dealer name and address
- Finance company (if applicable)

**Defect Documentation:**
- Primary defect description
- Secondary defects (if any)
- Date defect first noticed
- Number of repair attempts
- Repair dates (textarea for list)
- Days out of service (total)
- Current mileage
- Mileage at first defect

**Lemon Law Specifics:**
- State/jurisdiction (for US lemon law applicability)
- Manufacturer case number (if opened)
- Arbitration attempted (yes/no)
- Desired resolution (refund/replacement dropdown)

**Regulatory Anchors:**
- US: State-specific lemon law + Magnuson-Moss Warranty Act
- UK: Consumer Rights Act 2015 (right to reject within 30 days, or after multiple failed repairs)
- EU: Consumer Sales Directive

---

## Template 2: Identity Theft Fraud Alert Letter

**Category:** Financial  
**Slug:** `identity-theft-fraud-alert`  
**Target:** Credit agencies, banks, creditors

### Fields (~25 total)

**Victim Information:**
- Full legal name
- Current address
- Previous addresses (last 2 years)
- Date of birth
- Last 4 digits of SSN/National ID
- Phone number
- Email

**Fraud Details:**
- Type of fraud (select: New accounts, Account takeover, Tax fraud, Medical, Other)
- Date fraud discovered
- How fraud was discovered
- Fraudulent accounts/transactions itemized
- Total estimated fraud amount

**Reporting & Documentation:**
- Police report filed (yes/no)
- Police report number
- FTC Identity Theft Report number (US)
- Action Fraud reference (UK)
- Credit agencies already contacted
- Accounts already frozen

**Request Type:**
- Request type (Fraud alert placement, Credit freeze, Dispute fraudulent account, Block information)

**Regulatory Anchors:**
- US: FCRA Section 605A (90-day fraud alert), 7-year extended alert for victims
- UK: Data Protection Act 2018, CIFAS protective registration
- EU: GDPR Article 17 (right to erasure of fraudulent data)

---

## Template 3: FOIA / Subject Access Request Letter

**Category:** Financial (fits data privacy scope)  
**Slug:** `subject-access-request`  
**Target:** Government agencies, companies holding personal data

### Fields (~20 total)

**Requester Information:**
- Full legal name
- Current address
- Email
- Phone number
- Previous names used (optional)
- Previous addresses (optional)

**Request Details:**
- Organization name
- Organization address
- Request type (select: FOIA request, Subject Access Request, Data deletion, Data portability)
- Specific data requested (textarea)
- Time period for data
- Account/reference numbers (if any)
- Relationship to organization (customer, employee, other)

**Verification Willingness:**
- Identity verification method (select: Copy of ID, Utility bill, Other)
- Format preference (electronic, paper)

**Regulatory Anchors:**
- US: Freedom of Information Act (20 business days response)
- UK: GDPR Article 15 / UK DPA 2018 (30 calendar days, extendable to 90)
- EU: GDPR Article 15-20 (access, rectification, erasure, portability)

---

## Template 4: Employment Discrimination Complaint Letter

**Category:** Employment  
**Slug:** `employment-discrimination-complaint`  
**Target:** Employers, HR departments

### Fields (~30 total)

**Employee Information:**
- Full name
- Employee ID/staff number
- Job title
- Department
- Start date
- Current employment status (employed, terminated, resigned)
- Manager name
- HR contact name

**Employer Information:**
- Company name
- Company address
- Company size (select: <15, 15-100, 100-500, 500+)

**Discrimination Details:**
- Protected characteristic (select: Race, Sex, Age, Disability, Religion, Pregnancy, National origin, Sexual orientation, Gender identity, Other)
- Type of discrimination (select: Disparate treatment, Harassment, Hostile work environment, Retaliation, Failure to accommodate, Pay discrimination)
- Date(s) of discriminatory incidents
- Description of incidents (textarea)
- Witnesses (names if any)
- Prior complaints made (yes/no)
- Prior complaint dates/details

**Impact & Resolution:**
- Impact on employment (demotion, termination, denied promotion, pay cut)
- Emotional/financial impact
- Resolution sought (reinstatement, compensation, policy change, apology)

**Regulatory Anchors:**
- US: Title VII, ADA, ADEA, PDA (EEOC filing deadline 180-300 days)
- UK: Equality Act 2010 (3-month filing deadline for tribunal)
- EU: Equal Treatment Directive

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/templates/vehicleTemplates.ts` | Add Lemon Law template (+1 template) |
| `src/data/templates/financialTemplates.ts` | Add Identity Theft and FOIA/SAR templates (+2 templates) |
| `src/data/templates/employmentTemplates.ts` | Add Discrimination Complaint template (+1 template) |
| `src/data/templateCategories.ts` | Update template counts for vehicle (4→5), financial (4→6), employment (2→3) |

---

## Template Count Summary

| Category | Current | After | Change |
|----------|---------|-------|--------|
| Vehicle | 4 | 5 | +1 (Lemon Law) |
| Financial | 4 | 6 | +2 (Identity Theft, FOIA/SAR) |
| Employment | 2 | 3 | +1 (Discrimination) |
| **Total** | **10** | **14** | **+4** |

---

## Security Considerations

**Fields NOT included (per best practices):**
- Full SSN/National Insurance number (only last 4)
- Full credit card numbers
- Government ID copies
- Immigration status
- Medical records (except as relevant to discrimination)

---

## Jurisdiction Handling

Each template will include locked legal text blocks that change based on jurisdiction selection:

```text
US Jurisdiction → Cite specific federal statutes + note state law variations
UK Jurisdiction → Cite UK statutes (Consumer Rights Act, Equality Act, DPA)
EU Jurisdiction → Cite EU Directives and GDPR articles
International → Generic consumer protection language
```

