import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Insurance Act 2015', approvedPhrases: ['Under the Insurance Act 2015', 'In accordance with FCA regulations'] },
  { code: 'EU', name: 'European Union', legalReference: 'Insurance Distribution Directive', approvedPhrases: ['Under EU insurance regulations', 'In accordance with my consumer rights'] },
  { code: 'US', name: 'United States', legalReference: 'State Insurance Regulations', approvedPhrases: ['Under applicable state insurance law', 'In accordance with insurance regulations'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable insurance standards'] },
];

export const insuranceTemplates: LetterTemplate[] = [
  {
    id: 'insurance-claim-denial', slug: 'insurance-claim-denial-appeal', category: 'Insurance', title: 'Insurance Claim Denial Appeal Letter',
    shortDescription: 'Appeal against an insurance claim that has been denied.',
    longDescription: 'Use this template when your insurance company has denied a claim and you believe this decision is wrong.',
    seoTitle: 'Insurance Claim Denial Appeal Letter | Free Template', seoDescription: 'Appeal denied insurance claims.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'insurerName', label: 'Insurance Company', type: 'text', required: true, placeholder: 'Enter insurer name' },
      { id: 'policyNumber', label: 'Policy Number', type: 'text', required: true, placeholder: 'Enter policy number' },
      { id: 'claimNumber', label: 'Claim Number', type: 'text', required: true, placeholder: 'Enter claim reference' },
      { id: 'claimAmount', label: 'Claim Amount', type: 'text', required: true, placeholder: 'e.g., £5,000' },
      { id: 'denialReason', label: 'Reason Given for Denial', type: 'textarea', required: true, placeholder: 'Their stated reason' },
      { id: 'appealReason', label: 'Why You Disagree', type: 'textarea', required: true, placeholder: 'Explain why the denial is wrong' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally appeal the denial of my insurance claim.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Policy: {policyNumber}. Claim: {claimNumber}. Amount: {claimAmount}. You denied stating: {denialReason}. I appeal because: {appealReason}', placeholders: ['policyNumber', 'claimNumber', 'claimAmount', 'denialReason', 'appealReason'] },
      { id: 'request', name: 'Request', template: 'I request that you reconsider and approve this claim.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate to the Financial Ombudsman.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached additional supporting documentation.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'insurance-underpayment', slug: 'insurance-claim-underpayment', category: 'Insurance', title: 'Insurance Underpayment Dispute Letter',
    shortDescription: 'Dispute an insurance payout that is less than expected.',
    longDescription: 'Use this template when your insurance company has paid out less than you believe you are entitled to.',
    seoTitle: 'Insurance Underpayment Dispute Letter | Free Template', seoDescription: 'Dispute insurance underpayment.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'insurerName', label: 'Insurance Company', type: 'text', required: true, placeholder: 'Enter insurer name' },
      { id: 'policyNumber', label: 'Policy Number', type: 'text', required: true, placeholder: 'Enter policy number' },
      { id: 'claimNumber', label: 'Claim Number', type: 'text', required: true, placeholder: 'Enter claim reference' },
      { id: 'amountPaid', label: 'Amount They Paid', type: 'text', required: true, placeholder: 'e.g., £3,000' },
      { id: 'amountExpected', label: 'Amount You Expected', type: 'text', required: true, placeholder: 'e.g., £5,000' },
      { id: 'shortfallReason', label: 'Why You Deserve More', type: 'textarea', required: true, placeholder: 'Explain why payout is insufficient' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the settlement amount for my claim.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Policy: {policyNumber}. Claim: {claimNumber}. You paid {amountPaid} but I expected {amountExpected}. The shortfall is unjustified because: {shortfallReason}', placeholders: ['policyNumber', 'claimNumber', 'amountPaid', 'amountExpected', 'shortfallReason'] },
      { id: 'request', name: 'Request', template: 'I request that you review and increase the settlement.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate this dispute.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached evidence supporting the higher valuation.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
