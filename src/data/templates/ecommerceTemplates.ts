import { LetterTemplate } from '../letterTemplates';
import { marketplaceTemplates } from './ecommerce/marketplaceTemplates';
import { subscriptionTemplates } from './ecommerce/subscriptionTemplates';
import { privacyDataTemplates } from './ecommerce/privacyDataTemplates';
import { deliveryShippingTemplates } from './ecommerce/deliveryShippingTemplates';
import { paymentRefundTemplates } from './ecommerce/paymentRefundTemplates';


const standardJurisdictions = [
  { code: 'US', name: 'United States', legalReference: 'FTC Act', approvedPhrases: ['Under FTC regulations', 'In accordance with consumer protection laws'] },
  { code: 'UK', name: 'United Kingdom', legalReference: 'Consumer Rights Act 2015', approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'] },
  { code: 'EU', name: 'European Union', legalReference: 'EU Consumer Rights Directive', approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'] },
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
      { id: 'marketplaceName', label: 'Marketplace Name', type: 'select', required: true, options: ['Amazon', 'eBay', 'Etsy', 'Walmart Marketplace', 'AliExpress', 'Wish', 'Other'], impactLevel: 'critical', helpText: 'Select the platform where you made the purchase' },
      { id: 'sellerName', label: 'Seller Name/Store Name', type: 'text', required: true, placeholder: 'Name of the seller or store', impactLevel: 'critical', evidenceHint: 'Find in your order confirmation or on the product listing page' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', required: true, placeholder: 'Enter order reference', impactLevel: 'critical', evidenceHint: 'Check your order confirmation email or account order history' },
      { id: 'orderDate', label: 'Order Date', type: 'date', required: true, impactLevel: 'critical' },
      { id: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Name of the product ordered', impactLevel: 'critical', evidenceHint: 'Include exact product title from the listing' },
      { id: 'complaintType', label: 'Complaint Type', type: 'select', required: true, options: ['Item not received', 'Item not as described', 'Counterfeit/fake item', 'Damaged item', 'Wrong item sent', 'Seller not responding', 'Refund not processed'], impactLevel: 'critical' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the problem in detail', impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Include dates, specifics, and how the product differs from listing' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', required: true, placeholder: 'e.g., £50.00', impactLevel: 'critical', validation: { format: 'currency' }, evidenceHint: 'Check your bank statement or order confirmation for exact amount' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to file a formal complaint about a seller on {marketplaceName} marketplace.', placeholders: ['marketplaceName'] },
      { id: 'facts', name: 'Details', template: 'Order number: {orderNumber}, placed on {orderDate}. Seller: {sellerName}. Product: {productName}. Amount paid: {amountPaid}. Issue type: {complaintType}. Details: {complaintDetails}', placeholders: ['orderNumber', 'orderDate', 'sellerName', 'productName', 'amountPaid', 'complaintType', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request a full refund of {amountPaid} and appropriate action against this seller.', placeholders: ['amountPaid'] },
      { id: 'deadline', name: 'Deadline', template: 'Please resolve this within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I expect this seller to be held accountable under your buyer protection policy.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'data-privacy-request', slug: 'data-privacy-request', category: 'E-commerce', title: 'Data Privacy Request Letter (GDPR/CCPA)',
    shortDescription: 'Request access to or deletion of your personal data.',
    longDescription: 'Use this template to exercise your data privacy rights under GDPR, CCPA, or similar regulations.',
    seoTitle: 'Data Privacy Request Letter | GDPR CCPA Template', seoDescription: 'Exercise data privacy rights.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name', impactLevel: 'critical', evidenceHint: 'Use the legal company name from their privacy policy' },
      { id: 'requestType', label: 'Type of Request', type: 'select', required: true, options: ['Access (copy of my data)', 'Deletion (right to be forgotten)', 'Both access and deletion', 'Correction of inaccurate data', 'Data portability', 'Opt-out of sale/sharing'], impactLevel: 'critical', helpText: 'Select what you want the company to do with your data' },
      { id: 'regulation', label: 'Applicable Regulation', type: 'select', required: true, options: ['GDPR (EU/UK)', 'CCPA/CPRA (California)', 'Other state privacy law', 'Not sure'], impactLevel: 'important', helpText: 'GDPR applies if you are in EU/UK, CCPA if in California' },
      { id: 'accountEmail', label: 'Account Email', type: 'text', required: true, placeholder: 'Email associated with your account', impactLevel: 'critical', validation: { format: 'email' }, evidenceHint: 'Use the exact email address on your account with this company' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to exercise my data protection rights under {regulation}.', placeholders: ['regulation'] },
      { id: 'facts', name: 'Details', template: 'I am making a {requestType} request regarding data associated with email: {accountEmail}', placeholders: ['requestType', 'accountEmail'] },
      { id: 'request', name: 'Request', template: 'Please provide/delete/correct all personal data you hold about me as specified.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Under {regulation}, you must respond within the statutory timeframe.', placeholders: ['regulation'] },
      { id: 'closing', name: 'Closing', template: 'Please confirm completion of this request in writing to {accountEmail}.', placeholders: ['accountEmail'] },
    ],
    jurisdictions: standardJurisdictions,
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
