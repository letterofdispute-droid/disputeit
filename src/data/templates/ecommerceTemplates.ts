import { LetterTemplate } from '../letterTemplates';
import { marketplaceTemplates } from './ecommerce/marketplaceTemplates';
import { subscriptionTemplates } from './ecommerce/subscriptionTemplates';
import { privacyDataTemplates } from './ecommerce/privacyDataTemplates';
import { deliveryShippingTemplates } from './ecommerce/deliveryShippingTemplates';
import { paymentRefundTemplates } from './ecommerce/paymentRefundTemplates';

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

// Core e-commerce templates
const coreEcommerceTemplates: LetterTemplate[] = [
  {
    id: 'marketplace-seller-complaint', slug: 'marketplace-seller-complaint', category: 'E-commerce', title: 'Marketplace Seller Complaint Letter',
    shortDescription: 'Complain about a seller on an online marketplace.',
    longDescription: 'Use this template to file a complaint with an online marketplace about a third-party seller.',
    seoTitle: 'Marketplace Seller Complaint Letter | Free Template', seoDescription: 'Complain about online marketplace sellers.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'marketplaceName', label: 'Marketplace Name', type: 'select', required: true, options: ['Amazon', 'eBay', 'Etsy', 'Walmart Marketplace', 'AliExpress', 'Wish', 'Other'] },
      { id: 'sellerName', label: 'Seller Name/Store Name', type: 'text', required: true, placeholder: 'Name of the seller or store' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true, placeholder: 'Enter order reference' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { id: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Name of the product ordered' },
      { id: 'complaintType', label: 'Complaint Type', type: 'select', required: true, options: ['Item not received', 'Item not as described', 'Counterfeit/fake item', 'Damaged item', 'Wrong item sent', 'Seller not responding', 'Refund not processed'] },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the problem in detail' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true, placeholder: 'e.g., £50.00' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to file a formal complaint about a seller on {marketplaceName} marketplace.', placeholders: ['marketplaceName'] },
      { id: 'facts', name: 'Details', template: 'Order number: {orderNumber}, placed on {orderDate}. Seller: {sellerName}. Product: {productName}. Amount paid: {amountPaid}. Issue type: {complaintType}. Details: {complaintDetails}', placeholders: ['orderNumber', 'orderDate', 'sellerName', 'productName', 'amountPaid', 'complaintType', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request a full refund of {amountPaid} and appropriate action against this seller.', placeholders: ['amountPaid'] },
      { id: 'deadline', name: 'Deadline', template: 'Please resolve this within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I expect this seller to be held accountable under your buyer protection policy.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'data-privacy-request', slug: 'data-privacy-request', category: 'E-commerce', title: 'Data Privacy Request Letter (GDPR/CCPA)',
    shortDescription: 'Request access to or deletion of your personal data.',
    longDescription: 'Use this template to exercise your data privacy rights under GDPR, CCPA, or similar regulations.',
    seoTitle: 'Data Privacy Request Letter | GDPR CCPA Template', seoDescription: 'Exercise data privacy rights.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { id: 'requestType', label: 'Type of Request', type: 'select', required: true, options: ['Access (copy of my data)', 'Deletion (right to be forgotten)', 'Both access and deletion', 'Correction of inaccurate data', 'Data portability', 'Opt-out of sale/sharing'] },
      { id: 'regulation', label: 'Applicable Regulation', type: 'select', required: true, options: ['GDPR (EU/UK)', 'CCPA/CPRA (California)', 'Other state privacy law', 'Not sure'] },
      { id: 'accountEmail', label: 'Account Email', type: 'text', required: true, placeholder: 'Email associated with your account' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to exercise my data protection rights under {regulation}.', placeholders: ['regulation'] },
      { id: 'facts', name: 'Details', template: 'I am making a {requestType} request regarding data associated with email: {accountEmail}', placeholders: ['requestType', 'accountEmail'] },
      { id: 'request', name: 'Request', template: 'Please provide/delete/correct all personal data you hold about me as specified.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Under {regulation}, you must respond within the statutory timeframe.', placeholders: ['regulation'] },
      { id: 'closing', name: 'Closing', template: 'Please confirm completion of this request in writing to {accountEmail}.', placeholders: ['accountEmail'] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];

// Combine all e-commerce templates
export const ecommerceTemplates: LetterTemplate[] = [
  ...coreEcommerceTemplates,
  ...marketplaceTemplates,
  ...subscriptionTemplates,
  ...privacyDataTemplates,
  ...deliveryShippingTemplates,
  ...paymentRefundTemplates,
];
