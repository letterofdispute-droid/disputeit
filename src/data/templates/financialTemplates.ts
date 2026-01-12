import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Financial Conduct Authority Rules', approvedPhrases: ['Under FCA regulations', 'In accordance with UK financial law'] },
  { code: 'EU', name: 'European Union', legalReference: 'Payment Services Directive', approvedPhrases: ['Under EU financial regulations', 'In accordance with my consumer rights'] },
  { code: 'US', name: 'United States', legalReference: 'Fair Credit Reporting Act', approvedPhrases: ['Under the FCRA', 'In accordance with applicable financial laws'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable financial regulations'] },
];

export const financialTemplates: LetterTemplate[] = [
  {
    id: 'bank-fee-dispute', slug: 'bank-fee-dispute', category: 'Financial', title: 'Bank Fee Dispute Letter',
    shortDescription: 'Dispute unfair or unexpected bank charges and fees.',
    longDescription: 'Use this template when your bank has charged fees you believe are unfair, unauthorized, or incorrectly applied.',
    seoTitle: 'Bank Fee Dispute Letter | Free Template', seoDescription: 'Dispute unfair bank charges and request refunds.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'bankName', label: 'Bank Name', type: 'text', required: true, placeholder: 'Enter bank name' },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: 'Enter account number' },
      { id: 'feeAmount', label: 'Fee Amount', type: 'text', required: true, placeholder: 'e.g., £35' },
      { id: 'feeDate', label: 'Date Fee Applied', type: 'date', required: true },
      { id: 'feeType', label: 'Type of Fee', type: 'text', required: true, placeholder: 'e.g., overdraft fee' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Explain why this fee is unfair' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute a fee applied to my account.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Account number: {accountNumber}. On {feeDate}, a {feeType} of {feeAmount} was applied. I dispute this because: {disputeReason}', placeholders: ['accountNumber', 'feeDate', 'feeType', 'feeAmount', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request that you refund this fee.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate to the Financial Ombudsman.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I look forward to your positive response.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'credit-card-dispute', slug: 'credit-card-dispute', category: 'Financial', title: 'Credit Card Dispute Letter',
    shortDescription: 'Dispute unauthorized or incorrect credit card charges.',
    longDescription: 'Use this template to dispute transactions on your credit card that you did not authorize or that are incorrect.',
    seoTitle: 'Credit Card Dispute Letter | Free Template', seoDescription: 'Dispute unauthorized credit card charges.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'cardIssuer', label: 'Card Issuer', type: 'text', required: true, placeholder: 'Enter credit card company' },
      { id: 'cardLast4', label: 'Last 4 Digits of Card', type: 'text', required: true, placeholder: 'e.g., 1234' },
      { id: 'transactionDate', label: 'Transaction Date', type: 'date', required: true },
      { id: 'merchantName', label: 'Merchant Name', type: 'text', required: true, placeholder: 'Name shown on statement' },
      { id: 'transactionAmount', label: 'Transaction Amount', type: 'text', required: true, placeholder: 'e.g., £150' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Explain why you dispute this charge' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally dispute a charge on my credit card.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Card ending in {cardLast4}. On {transactionDate}, a charge of {transactionAmount} from {merchantName} appeared. I dispute this because: {disputeReason}', placeholders: ['cardLast4', 'transactionDate', 'transactionAmount', 'merchantName', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request that you initiate a chargeback and credit my account.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please acknowledge this dispute within 10 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please keep me informed of the investigation progress.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'debt-collection-dispute', slug: 'debt-collection-dispute', category: 'Financial', title: 'Debt Collection Dispute Letter',
    shortDescription: 'Dispute a debt you do not owe or that contains errors.',
    longDescription: 'Use this template when a debt collector is pursuing you for a debt you dispute or do not recognize.',
    seoTitle: 'Debt Collection Dispute Letter | Free Template', seoDescription: 'Dispute debt collection claims.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'collectorName', label: 'Debt Collector Name', type: 'text', required: true, placeholder: 'Enter collector company name' },
      { id: 'referenceNumber', label: 'Reference Number', type: 'text', required: true, placeholder: 'Their reference for this debt' },
      { id: 'claimedAmount', label: 'Amount Claimed', type: 'text', required: true, placeholder: 'e.g., £2,500' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Why you dispute this debt' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the debt you are attempting to collect.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Your reference: {referenceNumber}. You claim I owe {claimedAmount}. I dispute this because: {disputeReason}', placeholders: ['referenceNumber', 'claimedAmount', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request full validation of this debt including the original credit agreement.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Cease all collection activity until you provide this validation.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'This letter should not be construed as acknowledgment of any debt.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'credit-report-error', slug: 'credit-report-error-dispute', category: 'Financial', title: 'Credit Report Error Dispute Letter',
    shortDescription: 'Dispute inaccurate information on your credit report.',
    longDescription: 'Use this template to formally dispute errors on your credit report with credit reference agencies.',
    seoTitle: 'Credit Report Error Dispute Letter | Free Template', seoDescription: 'Dispute credit report errors.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'creditAgency', label: 'Credit Reference Agency', type: 'text', required: true, placeholder: 'e.g., Experian, Equifax' },
      { id: 'errorDescription', label: 'Error Description', type: 'textarea', required: true, placeholder: 'Describe the incorrect information' },
      { id: 'correctInformation', label: 'Correct Information', type: 'textarea', required: true, placeholder: 'What the information should say' },
      { id: 'accountCreditor', label: 'Related Account/Creditor', type: 'text', required: true, placeholder: 'Name of account or creditor' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute inaccurate information on my credit report.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'The following information is incorrect: {errorDescription}. Related account: {accountCreditor}. Correct information: {correctInformation}', placeholders: ['errorDescription', 'accountCreditor', 'correctInformation'] },
      { id: 'request', name: 'Request', template: 'I request that you investigate and correct this error within 28 days.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please provide written confirmation when corrected.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached supporting documentation.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
