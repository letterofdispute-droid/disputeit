import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'NHS Constitution', approvedPhrases: ['Under the NHS Constitution', 'In accordance with patient rights'] },
  { code: 'EU', name: 'European Union', legalReference: 'Cross-Border Healthcare Directive', approvedPhrases: ['Under EU patient rights', 'In accordance with healthcare regulations'] },
  { code: 'US', name: 'United States', legalReference: 'No Surprises Act', approvedPhrases: ['Under the No Surprises Act', 'In accordance with patient protection laws'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable healthcare standards'] },
];

export const healthcareTemplates: LetterTemplate[] = [
  {
    id: 'medical-billing-error', slug: 'medical-billing-error-dispute', category: 'Healthcare', title: 'Medical Billing Error Dispute Letter',
    shortDescription: 'Dispute incorrect charges on your medical bill.',
    longDescription: 'Use this template when you have received a medical bill with errors or services you did not receive.',
    seoTitle: 'Medical Billing Error Dispute Letter | Free Template', seoDescription: 'Dispute medical billing errors.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'providerName', label: 'Healthcare Provider', type: 'text', required: true, placeholder: 'Hospital/clinic name' },
      { id: 'accountNumber', label: 'Account/Patient Number', type: 'text', required: true, placeholder: 'Enter account number' },
      { id: 'serviceDate', label: 'Date of Service', type: 'date', required: true },
      { id: 'billedAmount', label: 'Amount Billed', type: 'text', required: true, placeholder: 'e.g., £500' },
      { id: 'disputedCharges', label: 'Disputed Charges', type: 'textarea', required: true, placeholder: 'List the incorrect charges' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute errors on my medical bill.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Account: {accountNumber}. Service date: {serviceDate}. Billed: {billedAmount}. Incorrect charges: {disputedCharges}', placeholders: ['accountNumber', 'serviceDate', 'billedAmount', 'disputedCharges'] },
      { id: 'request', name: 'Request', template: 'I request an itemized statement and correction of these errors.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 30 days. I will not pay disputed amounts until resolved.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please send a corrected bill.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'hospital-complaint', slug: 'hospital-complaint-letter', category: 'Healthcare', title: 'Hospital Complaint Letter',
    shortDescription: 'Complain about hospital care or service issues.',
    longDescription: 'Use this template to formally complain about the quality of care or service at a hospital.',
    seoTitle: 'Hospital Complaint Letter | Free Template', seoDescription: 'Complain about hospital care.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'hospitalName', label: 'Hospital Name', type: 'text', required: true, placeholder: 'Enter hospital name' },
      { id: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g., A&E, Surgery' },
      { id: 'treatmentDate', label: 'Date of Treatment', type: 'date', required: true },
      { id: 'patientName', label: 'Patient Name', type: 'text', required: true, placeholder: 'Who was treated' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe what went wrong' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally complain about the care provided at your hospital.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Patient: {patientName}. Department: {department}. Date: {treatmentDate}. Complaint: {complaintDetails}', placeholders: ['patientName', 'department', 'treatmentDate', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request a full investigation and written response.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please acknowledge within 3 working days and respond within 25 working days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I hope this feedback helps improve care.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
