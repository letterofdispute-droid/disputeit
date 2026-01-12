import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Leasehold Reform Act', approvedPhrases: ['Under leasehold regulations', 'In accordance with the lease terms'] },
  { code: 'EU', name: 'European Union', legalReference: 'Property Law Principles', approvedPhrases: ['Under applicable property law', 'In accordance with community regulations'] },
  { code: 'US', name: 'United States', legalReference: 'State HOA Laws', approvedPhrases: ['Under state HOA regulations', 'In accordance with our CC&Rs'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable property standards'] },
];

export const hoaTemplates: LetterTemplate[] = [
  {
    id: 'hoa-complaint', slug: 'hoa-complaint-letter', category: 'HOA & Property', title: 'HOA/Management Complaint Letter',
    shortDescription: 'Complain to your HOA or property management about issues.',
    longDescription: 'Use this template to formally complain to your homeowners association or property management company.',
    seoTitle: 'HOA Complaint Letter | Property Management Template', seoDescription: 'Complain to your HOA or management company.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'hoaName', label: 'HOA/Management Company', type: 'text', required: true, placeholder: 'Enter HOA or management name' },
      { id: 'propertyAddress', label: 'Your Property Address', type: 'textarea', required: true, placeholder: 'Your unit/home address' },
      { id: 'complaintType', label: 'Type of Complaint', type: 'text', required: true, placeholder: 'e.g., maintenance, noise, parking' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the issue' },
      { id: 'previousAttempts', label: 'Previous Attempts to Resolve', type: 'textarea', required: false, placeholder: 'What you have already tried' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally complain about an issue affecting my property.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Property: {propertyAddress}. Issue: {complaintType}. Details: {complaintDetails}. Previously attempted: {previousAttempts}', placeholders: ['propertyAddress', 'complaintType', 'complaintDetails', 'previousAttempts'] },
      { id: 'request', name: 'Request', template: 'I request that you address this issue and provide a written response.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate to the housing ombudsman.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I expect this matter to be resolved promptly.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'hoa-fee-dispute', slug: 'hoa-fee-dispute', category: 'HOA & Property', title: 'HOA Fee Dispute Letter',
    shortDescription: 'Dispute HOA fees, fines, or special assessments.',
    longDescription: 'Use this template to dispute fees or fines from your HOA that you believe are unfair.',
    seoTitle: 'HOA Fee Dispute Letter | Free Template', seoDescription: 'Dispute HOA fees and fines.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'hoaName', label: 'HOA/Management Company', type: 'text', required: true, placeholder: 'Enter HOA name' },
      { id: 'propertyAddress', label: 'Your Property Address', type: 'textarea', required: true, placeholder: 'Your unit/home address' },
      { id: 'feeType', label: 'Type of Fee/Fine', type: 'text', required: true, placeholder: 'e.g., late fee, violation fine' },
      { id: 'feeAmount', label: 'Amount Disputed', type: 'text', required: true, placeholder: 'e.g., £200' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Why this charge is wrong' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute a fee charged to my account.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Property: {propertyAddress}. You charged a {feeType} of {feeAmount}. I dispute because: {disputeReason}', placeholders: ['propertyAddress', 'feeType', 'feeAmount', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request that you remove this charge and provide a corrected statement.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days. I will not pay the disputed amount until resolved.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I am prepared to attend a hearing if necessary.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
