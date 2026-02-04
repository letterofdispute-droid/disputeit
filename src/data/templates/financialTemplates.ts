import { LetterTemplate } from '../letterTemplates';
import { bankingDisputeTemplates } from './financial/bankingDisputeTemplates';
import { creditDisputeTemplates } from './financial/creditDisputeTemplates';
import { loanDisputeTemplates } from './financial/loanDisputeTemplates';
import { investmentDisputeTemplates } from './financial/investmentDisputeTemplates';
import { scamFraudTemplates } from './financial/scamFraudTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'US', name: 'United States', legalReference: 'Fair Credit Reporting Act, FDCPA', approvedPhrases: ['Under the FCRA', 'In accordance with applicable financial laws'] },
  { code: 'UK', name: 'United Kingdom', legalReference: 'Financial Conduct Authority Rules', approvedPhrases: ['Under FCA regulations', 'In accordance with UK financial law'] },
  { code: 'EU', name: 'European Union', legalReference: 'Payment Services Directive', approvedPhrases: ['Under EU financial regulations', 'In accordance with my consumer rights'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable financial regulations'] },
];

// Core financial templates (existing)
const coreFinancialTemplates: LetterTemplate[] = [
  {
    id: 'bank-fee-dispute', 
    slug: 'bank-fee-dispute', 
    category: 'Financial', 
    title: 'Bank Fee Dispute Letter',
    shortDescription: 'Dispute unfair or unexpected bank charges and fees.',
    longDescription: 'Use this template when your bank has charged fees you believe are unfair, unauthorized, or incorrectly applied.',
    seoTitle: 'Bank Fee Dispute Letter | Free Template', 
    seoDescription: 'Dispute unfair bank charges and request refunds.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'bankName', label: 'Bank Name', type: 'text', required: true, placeholder: 'Enter bank name' },
      { id: 'bankAddress', label: 'Bank Address', type: 'textarea', required: true, placeholder: 'Branch or head office address' },
      { id: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true, placeholder: 'Name on account' },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: 'Your account number' },
      { id: 'sortCode', label: 'Sort Code', type: 'text', required: false, placeholder: 'e.g., 12-34-56' },
      { id: 'accountType', label: 'Account Type', type: 'select', required: true, options: ['Current Account', 'Savings Account', 'Business Account', 'Credit Card', 'Other'] },
      { id: 'feeAmount', label: 'Fee Amount', type: 'text', required: true, placeholder: 'e.g., £35' },
      { id: 'feeDate', label: 'Date Fee Applied', type: 'date', required: true },
      { id: 'feeType', label: 'Type of Fee', type: 'text', required: true, placeholder: 'e.g., overdraft fee, maintenance fee' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Explain why this fee is unfair' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute a fee applied to my account.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Account holder: {accountHolderName}. Account number: {accountNumber} (Sort code: {sortCode}). Account type: {accountType}. On {feeDate}, a {feeType} of {feeAmount} was applied. I dispute this because: {disputeReason}', placeholders: ['accountHolderName', 'accountNumber', 'sortCode', 'accountType', 'feeDate', 'feeType', 'feeAmount', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request that you refund this fee of {feeAmount}.', placeholders: ['feeAmount'] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate to the Financial Ombudsman.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I look forward to your positive response.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, 
    pricing: standardPricing,
  },
  {
    id: 'credit-card-dispute', 
    slug: 'credit-card-dispute', 
    category: 'Financial', 
    title: 'Credit Card Dispute Letter',
    shortDescription: 'Dispute unauthorized or incorrect credit card charges.',
    longDescription: 'Use this template to dispute transactions on your credit card that you did not authorize or that are incorrect.',
    seoTitle: 'Credit Card Dispute Letter | Free Template', 
    seoDescription: 'Dispute unauthorized credit card charges.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'cardIssuer', label: 'Card Issuer/Bank', type: 'text', required: true, placeholder: 'Enter credit card company' },
      { id: 'cardIssuerAddress', label: 'Issuer Address', type: 'textarea', required: true, placeholder: 'Disputes department address' },
      { id: 'cardHolderName', label: 'Cardholder Name', type: 'text', required: true, placeholder: 'Name on card' },
      { id: 'cardLast4', label: 'Last 4 Digits of Card', type: 'text', required: true, placeholder: 'e.g., 1234' },
      { id: 'accountNumber', label: 'Account Number', type: 'text', required: false, placeholder: 'Credit card account number' },
      { id: 'transactionDate', label: 'Transaction Date', type: 'date', required: true },
      { id: 'merchantName', label: 'Merchant Name', type: 'text', required: true, placeholder: 'Name shown on statement' },
      { id: 'transactionAmount', label: 'Transaction Amount', type: 'text', required: true, placeholder: 'e.g., £150' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Explain why you dispute this charge' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally dispute a charge on my credit card.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Cardholder: {cardHolderName}. Card ending in {cardLast4}. On {transactionDate}, a charge of {transactionAmount} from {merchantName} appeared. I dispute this because: {disputeReason}', placeholders: ['cardHolderName', 'cardLast4', 'transactionDate', 'transactionAmount', 'merchantName', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request that you initiate a chargeback and credit {transactionAmount} to my account.', placeholders: ['transactionAmount'] },
      { id: 'deadline', name: 'Deadline', template: 'Please acknowledge this dispute within 10 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please keep me informed of the investigation progress.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, 
    pricing: standardPricing,
  },
  {
    id: 'debt-collection-dispute', 
    slug: 'debt-collection-dispute', 
    category: 'Financial', 
    title: 'Debt Collection Dispute Letter',
    shortDescription: 'Dispute a debt you do not owe or that contains errors.',
    longDescription: 'Use this template when a debt collector is pursuing you for a debt you dispute or do not recognize.',
    seoTitle: 'Debt Collection Dispute Letter | Free Template', 
    seoDescription: 'Dispute debt collection claims.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'collectorName', label: 'Debt Collector Name', type: 'text', required: true, placeholder: 'Enter collector company name' },
      { id: 'collectorAddress', label: 'Collector Address', type: 'textarea', required: true, placeholder: 'Full address' },
      { id: 'referenceNumber', label: 'Their Reference Number', type: 'text', required: true, placeholder: 'Their reference for this debt' },
      { id: 'originalCreditor', label: 'Original Creditor Name', type: 'text', required: false, placeholder: 'Who they claim the debt is from' },
      { id: 'claimedAmount', label: 'Amount Claimed', type: 'text', required: true, placeholder: 'e.g., £2,500' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Why you dispute this debt' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the debt you are attempting to collect.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Your reference: {referenceNumber}. Original creditor: {originalCreditor}. You claim I owe {claimedAmount}. I dispute this because: {disputeReason}', placeholders: ['referenceNumber', 'originalCreditor', 'claimedAmount', 'disputeReason'] },
      { id: 'request', name: 'Request', template: 'I request full validation of this debt including the original signed credit agreement.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Cease all collection activity until you provide this validation.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'This letter should not be construed as acknowledgment of any debt.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, 
    pricing: standardPricing,
  },
  {
    id: 'credit-report-error', 
    slug: 'credit-report-error-dispute', 
    category: 'Financial', 
    title: 'Credit Report Error Dispute Letter',
    shortDescription: 'Dispute inaccurate information on your credit report.',
    longDescription: 'Use this template to formally dispute errors on your credit report with credit reference agencies.',
    seoTitle: 'Credit Report Error Dispute Letter | Free Template', 
    seoDescription: 'Dispute credit report errors.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'creditAgency', label: 'Credit Reference Agency', type: 'select', required: true, options: ['Experian', 'Equifax', 'TransUnion', 'Other'] },
      { id: 'creditAgencyAddress', label: 'Agency Address', type: 'textarea', required: true, placeholder: 'Disputes department address' },
      { id: 'yourFullName', label: 'Your Full Name', type: 'text', required: true, placeholder: 'Name as it appears on report' },
      { id: 'yourAddress', label: 'Your Current Address', type: 'textarea', required: true, placeholder: 'Your full address' },
      { id: 'creditorName', label: 'Creditor Name', type: 'text', required: true, placeholder: 'Company reporting the error' },
      { id: 'errorDescription', label: 'Error Description', type: 'textarea', required: true, placeholder: 'Describe the incorrect information' },
      { id: 'correctInformation', label: 'Correct Information', type: 'textarea', required: true, placeholder: 'What the information should say' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute inaccurate information on my credit report.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'The following information is incorrect: {errorDescription}. Related creditor: {creditorName}. Correct information: {correctInformation}', placeholders: ['errorDescription', 'creditorName', 'correctInformation'] },
      { id: 'request', name: 'Request', template: 'I request that you investigate and correct this error within 28 days.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please provide written confirmation when corrected.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached supporting documentation.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, 
    pricing: standardPricing,
  },
];

// Combine all financial templates
export const financialTemplates: LetterTemplate[] = [
  ...coreFinancialTemplates,
  ...bankingDisputeTemplates,
  ...creditDisputeTemplates,
  ...loanDisputeTemplates,
  ...investmentDisputeTemplates,
  ...scamFraudTemplates,
];
