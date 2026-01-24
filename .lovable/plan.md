
# Healthcare Templates Enhancement Plan

## Overview

This plan adds the missing fields and attachment/deadline guidance to make the 50 healthcare templates complete and production-ready.

---

## Missing Elements to Add

### 1. Additional Reusable Field Sets

**Communication & Response Fields** (new field set)
- `insurerFaxNumber` - Fax number (still widely used in healthcare)
- `insurerPhoneNumber` - Claims department phone
- `providerFaxNumber` - Provider fax number
- `preferredResponseMethod` - Select: Mail, Phone, Portal, Email, Fax
- `appealDeadlineAware` - Checkbox: "I understand the appeal deadline"
- `dateNoticeReceived` - When you received the denial/bill/collection notice

**Attachment Tracking Fields** (new field set)
- `attachmentEob` - Select: Attached, Will follow, Not applicable
- `attachmentDenialLetter` - Select: Attached, Will follow, Not applicable
- `attachmentMedicalRecords` - Select: Attached, Will follow, Not applicable
- `attachmentPhysicianLetter` - Select: Attached, Will follow, Not applicable
- `attachmentProofOfPayment` - Select: Attached, Will follow, Not applicable
- `attachmentItemizedBill` - Select: Attached, Will follow, Not applicable
- `attachmentCreditReport` - Select: Attached, Will follow, Not applicable
- `attachmentOther` - Text: List other documents attached

### 2. Field Additions by Category

**A. Insurance Claim Templates (1-10)**
Add to existing field sets:
- `insurerFaxNumber` to insurance plan fields
- `insurerPhoneNumber` to insurance plan fields
- `preferredResponseMethod` 
- `appealDeadlineAware` checkbox
- `dateNoticeReceived` (date you received denial)
- Attachment tracking for: EOB, Denial Letter, Medical Records, Physician Letter

**B. Medical Billing Templates (11-20)**
Add:
- `facilityFaxNumber` to hospital billing fields
- `facilityPhoneNumber` - billing department contact
- `dateNoticeReceived` - when you got the bill
- `itemizedBillRequested` - Select: Yes/No/Already received
- `preferredResponseMethod`
- Attachment tracking for: Itemized Bill, EOB, Proof of Payment

**C. Debt Collection Templates (21-28)**
Add:
- `collectionAgencyFaxNumber`
- `collectionAgencyPhoneNumber`
- `dateNoticeReceived` - date of first collection notice (critical for 30-day validation window)
- `certifiedMailUsed` - Select: Yes/No (important for FDCPA)
- `certifiedMailTrackingNumber`
- Attachment tracking for: Collection Notice, Original Bill, Proof of Payment, Credit Report

**D. Provider & Hospital Templates (29-35)**
Add:
- `hospitalFaxNumber`
- `hospitalPhoneNumber`
- `patientAdvocateContacted` - Select: Yes/No/Unknown
- `patientAdvocateName`
- `dateIncidentReported` - when you first reported the issue
- Attachment tracking for: Medical Records, Incident Report, Prior Communication

**E. Prescription Templates (36-41)**
Add:
- `pharmacyFaxNumber`
- `pharmacyPhoneNumber`
- `insurerPriorAuthPhone` - PA department phone
- `preferredResponseMethod`
- Attachment tracking for: Prescription, Prior Denial, Physician Letter

**F. Specialized Templates (42-50)**
Add:
- All relevant fax/phone fields per template type
- `preferredResponseMethod`
- `legalRepresentationStatus` - Select: None, Consulting attorney, Have attorney
- Attachment tracking appropriate to each template

### 3. Deadline Warning Guidance

Add `helpText` to key fields with deadline warnings:

| Field | Help Text |
|-------|-----------|
| `dateNoticeReceived` | "IMPORTANT: Note when you received this notice. Most insurance appeals must be filed within 180 days of denial. Debt validation requests must be sent within 30 days of first contact to preserve rights." |
| `appealDeadline` | "Check your denial letter for the exact deadline. Missing this deadline may forfeit your appeal rights." |
| `appealDeadlineAware` | "Confirm you understand the time limit to submit this appeal. Typical deadlines: 30-180 days for insurance, 30 days for debt validation." |
| `certifiedMailUsed` | "Sending via certified mail creates proof of delivery, which is important for legal disputes." |

### 4. Attachment Checklists (via helpText)

Add descriptive `helpText` to attachment fields:

**For Insurance Appeals:**
```
attachmentEob helpText: "Attach the Explanation of Benefits (EOB) showing how your claim was processed. This is the document that shows what was billed, allowed, paid, and denied."

attachmentDenialLetter helpText: "Attach the denial letter in full. This documents the reason for denial and your appeal rights."

attachmentMedicalRecords helpText: "Include relevant medical records that support your case. May include: office visit notes, test results, imaging reports, surgical reports."

attachmentPhysicianLetter helpText: "A letter of medical necessity from your doctor significantly strengthens your appeal. Ask your physician to explain why this treatment is necessary."
```

**For Debt Collection:**
```
attachmentCreditReport helpText: "If disputing a credit report entry, include the relevant pages showing the disputed account. Circle or highlight the entry."

attachmentProofOfPayment helpText: "Include copies of canceled checks, bank statements, or payment confirmations showing previous payments."
```

---

## Technical Implementation

### File Changes

**`src/data/templates/healthcareTemplates.ts`**

1. Add new reusable field sets after existing ones (around line 197):

```typescript
// Communication fields
const communicationFields = [
  { id: 'insurerFaxNumber', label: 'Insurer Fax Number', type: 'text' as const, required: false, placeholder: 'Fax for claims/appeals', helpText: 'Fax is still commonly used in healthcare for formal communications' },
  { id: 'insurerPhoneNumber', label: 'Insurer Phone Number', type: 'text' as const, required: false, placeholder: 'Claims department phone' },
  { id: 'preferredResponseMethod', label: 'Preferred Response Method', type: 'select' as const, required: true, options: ['Mail', 'Email', 'Phone', 'Online Portal', 'Fax'] },
  { id: 'dateNoticeReceived', label: 'Date You Received Notice', type: 'date' as const, required: true, helpText: 'IMPORTANT: Note this date. Appeal deadlines are often calculated from when you received the denial, not when it was issued.' },
];

// Appeal deadline awareness
const deadlineAwarenessFields = [
  { id: 'appealDeadlineAware', label: 'I Understand the Appeal Deadline', type: 'select' as const, required: true, options: ['Yes - I understand the deadline', 'No - Need to check deadline'], helpText: 'Typical deadlines: 30-180 days for insurance appeals. Missing the deadline may forfeit your rights.' },
];

// Attachment checklists - Insurance
const insuranceAttachmentFields = [
  { id: 'attachmentEob', label: 'Explanation of Benefits (EOB)', type: 'select' as const, required: true, options: ['Attached', 'Will follow', 'Not applicable'], helpText: 'The EOB shows how your claim was processed - what was billed, allowed, paid, and denied.' },
  { id: 'attachmentDenialLetter', label: 'Denial Letter', type: 'select' as const, required: true, options: ['Attached', 'Will follow', 'Not applicable'], helpText: 'Attach the full denial letter documenting the reason for denial and your appeal rights.' },
  { id: 'attachmentMedicalRecords', label: 'Medical Records', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable', 'Requesting from provider'], helpText: 'Include relevant records: office notes, test results, imaging, surgical reports.' },
  { id: 'attachmentPhysicianLetter', label: 'Physician Support Letter', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable', 'Requested from doctor'], helpText: 'A letter of medical necessity from your doctor significantly strengthens appeals.' },
  { id: 'attachmentOther', label: 'Other Documents Attached', type: 'textarea' as const, required: false, placeholder: 'List any other documents you are including' },
];

// Attachment checklists - Billing
const billingAttachmentFields = [
  { id: 'attachmentItemizedBill', label: 'Itemized Bill', type: 'select' as const, required: true, options: ['Attached', 'Will follow', 'Requesting from provider'], helpText: 'An itemized bill shows each charge separately. Request one if you only have a summary bill.' },
  { id: 'attachmentEob', label: 'EOB (if insurance used)', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable'] },
  { id: 'attachmentProofOfPayment', label: 'Proof of Payment', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable'], helpText: 'Include copies of checks, bank statements, or payment confirmations.' },
  { id: 'attachmentOther', label: 'Other Documents', type: 'textarea' as const, required: false, placeholder: 'List other documents attached' },
];

// Attachment checklists - Debt Collection
const debtAttachmentFields = [
  { id: 'attachmentCollectionNotice', label: 'Collection Notice', type: 'select' as const, required: true, options: ['Attached', 'Will follow'], helpText: 'Attach the collection letter or notice you received.' },
  { id: 'attachmentOriginalBill', label: 'Original Medical Bill', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Do not have'], helpText: 'If you have the original bill from the provider, include it.' },
  { id: 'attachmentProofOfPayment', label: 'Proof of Payment', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable'] },
  { id: 'attachmentInsuranceEob', label: 'Insurance EOB', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable', 'Insurance was not used'] },
  { id: 'certifiedMailUsed', label: 'Sending via Certified Mail?', type: 'select' as const, required: true, options: ['Yes', 'No'], helpText: 'Certified mail creates proof of delivery - strongly recommended for debt disputes.' },
  { id: 'certifiedMailTrackingNumber', label: 'Certified Mail Tracking Number', type: 'text' as const, required: false, placeholder: 'Add after mailing' },
];

// Attachment checklists - Credit Report
const creditAttachmentFields = [
  { id: 'attachmentCreditReport', label: 'Credit Report Pages', type: 'select' as const, required: true, options: ['Attached', 'Will follow'], helpText: 'Include the pages showing the disputed entry. Circle or highlight the account in question.' },
  { id: 'attachmentProofOfPayment', label: 'Proof of Payment', type: 'select' as const, required: false, options: ['Attached', 'Will follow', 'Not applicable'] },
  { id: 'attachmentIdentification', label: 'Identification', type: 'select' as const, required: true, options: ['Attached'], helpText: 'Credit bureaus require a copy of ID (drivers license, passport) and proof of address.' },
];

// Provider fax/phone fields
const providerContactFields = [
  { id: 'providerFaxNumber', label: 'Provider Fax Number', type: 'text' as const, required: false, placeholder: 'Fax number' },
  { id: 'providerPhoneNumber', label: 'Provider Phone Number', type: 'text' as const, required: false, placeholder: 'Main phone number' },
  { id: 'billingDepartmentPhone', label: 'Billing Department Phone', type: 'text' as const, required: false, placeholder: 'Direct billing line' },
];
```

2. Update each of the 50 templates to include appropriate new field sets:
   - Insurance templates (1-10): Add `communicationFields`, `deadlineAwarenessFields`, `insuranceAttachmentFields`
   - Billing templates (11-20): Add `providerContactFields`, `billingAttachmentFields`
   - Debt templates (21-28): Add `debtAttachmentFields`, `creditAttachmentFields` where relevant
   - Provider templates (29-35): Add `providerContactFields`
   - Prescription templates (36-41): Add `communicationFields`, `insuranceAttachmentFields`
   - Specialized templates (42-50): Add appropriate combination based on template type

---

## Field Summary After Enhancement

| Field Set | Fields Added |
|-----------|--------------|
| Communication | insurerFaxNumber, insurerPhoneNumber, preferredResponseMethod, dateNoticeReceived |
| Deadline Awareness | appealDeadlineAware with warning helpText |
| Insurance Attachments | attachmentEob, attachmentDenialLetter, attachmentMedicalRecords, attachmentPhysicianLetter, attachmentOther |
| Billing Attachments | attachmentItemizedBill, attachmentEob, attachmentProofOfPayment, attachmentOther |
| Debt Attachments | attachmentCollectionNotice, attachmentOriginalBill, attachmentProofOfPayment, attachmentInsuranceEob, certifiedMailUsed, certifiedMailTrackingNumber |
| Credit Attachments | attachmentCreditReport, attachmentProofOfPayment, attachmentIdentification |
| Provider Contact | providerFaxNumber, providerPhoneNumber, billingDepartmentPhone |

**Total new fields: ~25 additional reusable fields**

---

## Benefits After Implementation

1. **Deadline Awareness**: Users are explicitly warned about time-sensitive requirements
2. **Attachment Checklists**: Users know exactly what documents to include
3. **Communication Channels**: Fax numbers captured (critical for healthcare)
4. **Proof of Mailing**: Certified mail tracking for legal protection
5. **Complete Contact Info**: All communication channels for follow-up

This ensures users have everything they need to submit complete, timely disputes.
