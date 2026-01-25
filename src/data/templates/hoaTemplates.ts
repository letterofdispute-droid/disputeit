import { LetterTemplate } from '../letterTemplates';
import { feeDisputeTemplates } from './hoa/feeDisputeTemplates';
import { neighborDisputeTemplates } from './hoa/neighborDisputeTemplates';
import { governanceTemplates } from './hoa/governanceTemplates';
import { maintenanceTemplates } from './hoa/maintenanceTemplates';
import { violationTemplates } from './hoa/violationTemplates';

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

// Core HOA templates
const coreHoaTemplates: LetterTemplate[] = [
  {
    id: 'hoa-complaint', slug: 'hoa-complaint-letter', category: 'HOA & Property', title: 'HOA/Management Complaint Letter',
    shortDescription: 'Complain to your HOA or property management about issues.',
    longDescription: 'Use this template to formally complain to your homeowners association or property management company.',
    seoTitle: 'HOA Complaint Letter | Property Management Template', seoDescription: 'Complain to your HOA or management company.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'hoaName', label: 'HOA/Management Company Name', type: 'text', required: true, placeholder: 'Enter HOA or management company name' },
      { id: 'memberName', label: 'Your Name (as registered)', type: 'text', required: true, placeholder: 'Your name as it appears on HOA records' },
      { id: 'memberId', label: 'Member/Account ID', type: 'text', required: false, placeholder: 'Your HOA member or account number' },
      { id: 'unitNumber', label: 'Unit/Lot Number', type: 'text', required: true, placeholder: 'e.g., Unit 5, Lot 23' },
      { id: 'complaintType', label: 'Type of Complaint', type: 'select', required: true, options: ['Maintenance/repairs', 'Noise/nuisance', 'Parking issues', 'Common area problems', 'Rule enforcement', 'Communication issues', 'Financial/billing', 'Other'] },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the issue in detail' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing as {memberName} (Member ID: {memberId}) to formally complain about an issue.', placeholders: ['memberName', 'memberId'] },
      { id: 'facts', name: 'Details', template: 'Property: {unitNumber}. Issue: {complaintType}. Details: {complaintDetails}', placeholders: ['unitNumber', 'complaintType', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request that you investigate and address this issue promptly.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I expect this matter to be resolved promptly.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'hoa-architectural-request', slug: 'hoa-architectural-request', category: 'HOA & Property', title: 'HOA Architectural Change Request',
    shortDescription: 'Request approval for home modifications or improvements.',
    longDescription: 'Use this template to formally request HOA approval for architectural changes.',
    seoTitle: 'HOA Architectural Request Letter | Free Template', seoDescription: 'Request HOA approval for home modifications.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'hoaName', label: 'HOA Name', type: 'text', required: true, placeholder: 'Enter HOA name' },
      { id: 'memberName', label: 'Your Name', type: 'text', required: true, placeholder: 'Your name' },
      { id: 'memberId', label: 'Member ID', type: 'text', required: true, placeholder: 'Your member number' },
      { id: 'unitNumber', label: 'Unit/Lot Number', type: 'text', required: true, placeholder: 'e.g., Lot 15' },
      { id: 'modificationType', label: 'Type of Modification', type: 'select', required: true, options: ['Exterior paint', 'Fencing', 'Landscaping', 'Deck/patio', 'Solar panels', 'Roof', 'Windows/doors', 'Addition', 'Other'] },
      { id: 'modificationDescription', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the proposed changes' },
      { id: 'proposedStartDate', label: 'Proposed Start Date', type: 'date', required: true },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing as {memberName} (Member ID: {memberId}) to request approval for an architectural modification.', placeholders: ['memberName', 'memberId'] },
      { id: 'facts', name: 'Details', template: 'Property: {unitNumber}. Type: {modificationType}. Description: {modificationDescription}. Start date: {proposedStartDate}', placeholders: ['unitNumber', 'modificationType', 'modificationDescription', 'proposedStartDate'] },
      { id: 'request', name: 'Request', template: 'I request written approval for this project.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 30 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I am committed to completing this in compliance with HOA guidelines.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];

// Combine all HOA templates
export const hoaTemplates: LetterTemplate[] = [
  ...coreHoaTemplates,
  ...feeDisputeTemplates,
  ...neighborDisputeTemplates,
  ...governanceTemplates,
  ...maintenanceTemplates,
  ...violationTemplates,
];
