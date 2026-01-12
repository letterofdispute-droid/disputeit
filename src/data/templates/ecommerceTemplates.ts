import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Consumer Rights Act 2015', approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'] },
  { code: 'EU', name: 'European Union', legalReference: 'EU Consumer Rights Directive', approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'] },
  { code: 'US', name: 'United States', legalReference: 'FTC Act', approvedPhrases: ['Under FTC regulations', 'In accordance with consumer protection laws'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable consumer protection standards'] },
];

export const ecommerceTemplates: LetterTemplate[] = [
  {
    id: 'marketplace-seller-complaint', slug: 'marketplace-seller-complaint', category: 'E-commerce', title: 'Marketplace Seller Complaint Letter',
    shortDescription: 'Complain about a seller on an online marketplace.',
    longDescription: 'Use this template to file a complaint with an online marketplace about a third-party seller.',
    seoTitle: 'Marketplace Seller Complaint Letter | Free Template', seoDescription: 'Complain about online marketplace sellers.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'marketplaceName', label: 'Marketplace Name', type: 'text', required: true, placeholder: 'e.g., Amazon, eBay' },
      { id: 'sellerName', label: 'Seller Name', type: 'text', required: true, placeholder: 'Name of the seller' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true, placeholder: 'Enter order reference' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'productDescription', label: 'Product Description', type: 'textarea', required: true, placeholder: 'What you ordered' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the problem' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true, placeholder: 'e.g., £50' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to file a formal complaint about a seller on your marketplace.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Order: {orderNumber}. Date: {orderDate}. Seller: {sellerName}. Product: {productDescription}. Amount: {amountPaid}. Complaint: {complaintDetails}', placeholders: ['orderNumber', 'orderDate', 'sellerName', 'productDescription', 'amountPaid', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request a full refund and action against this seller.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please resolve this within 14 days under your buyer protection policy.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I expect this seller to be held accountable.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'data-privacy-request', slug: 'data-privacy-request', category: 'E-commerce', title: 'Data Privacy Request Letter (GDPR/CCPA)',
    shortDescription: 'Request access to or deletion of your personal data.',
    longDescription: 'Use this template to exercise your data privacy rights.',
    seoTitle: 'Data Privacy Request Letter | GDPR CCPA Template', seoDescription: 'Exercise data privacy rights.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { id: 'requestType', label: 'Type of Request', type: 'text', required: true, placeholder: 'Access, Deletion, or Both' },
      { id: 'accountEmail', label: 'Account Email', type: 'text', required: true, placeholder: 'Email associated with your data' },
      { id: 'additionalInfo', label: 'Additional Information', type: 'textarea', required: false, placeholder: 'Other info to help locate your data' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to exercise my data protection rights under GDPR/CCPA.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'I am making a {requestType} request regarding data associated with: {accountEmail}. Additional info: {additionalInfo}', placeholders: ['requestType', 'accountEmail', 'additionalInfo'] },
      { id: 'request', name: 'Request', template: 'Please provide/delete all personal data you hold about me.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'You must respond within 30 days (GDPR) / 45 days (CCPA).', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please confirm completion in writing.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
