import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Consumer Rights Act 2015', approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'] },
  { code: 'EU', name: 'European Union', legalReference: 'Consumer Sales Directive', approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'] },
  { code: 'US', name: 'United States', legalReference: 'Magnuson-Moss Warranty Act', approvedPhrases: ['Under the Magnuson-Moss Warranty Act', 'In accordance with state lemon law'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable consumer protection standards'] },
];

export const vehicleTemplates: LetterTemplate[] = [
  {
    id: 'auto-dealer-complaint', slug: 'auto-dealer-complaint', category: 'Vehicle', title: 'Car Dealer Complaint Letter',
    shortDescription: 'Complain about issues with a car dealer or dealership.',
    longDescription: 'Use this template when you have problems with a car dealer regarding sales practices or service issues.',
    seoTitle: 'Car Dealer Complaint Letter | Free Template', seoDescription: 'Complain about car dealer issues.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'dealerName', label: 'Dealer Name', type: 'text', required: true, placeholder: 'Enter dealership name' },
      { id: 'vehicleDetails', label: 'Vehicle Details', type: 'text', required: true, placeholder: 'Make, model, registration' },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { id: 'purchasePrice', label: 'Purchase Price', type: 'text', required: true, placeholder: 'e.g., £15,000' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe your complaint' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally complain about my experience with your dealership.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'I purchased a {vehicleDetails} on {purchaseDate} for {purchasePrice}. My complaint is: {complaintDetails}', placeholders: ['vehicleDetails', 'purchaseDate', 'purchasePrice', 'complaintDetails'] },
      { id: 'request', name: 'Request', template: 'I request that you remedy this situation appropriately.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will escalate to Trading Standards.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I look forward to your response.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'parking-ticket-dispute', slug: 'parking-ticket-dispute', category: 'Vehicle', title: 'Parking Ticket Appeal Letter',
    shortDescription: 'Appeal an unfair or incorrect parking ticket.',
    longDescription: 'Use this template to formally appeal a parking penalty notice you believe was issued incorrectly.',
    seoTitle: 'Parking Ticket Appeal Letter | Free Template', seoDescription: 'Appeal parking tickets and penalties.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'issuingAuthority', label: 'Issuing Authority', type: 'text', required: true, placeholder: 'Council or company name' },
      { id: 'ticketNumber', label: 'Ticket/PCN Number', type: 'text', required: true, placeholder: 'Enter ticket reference' },
      { id: 'vehicleRegistration', label: 'Vehicle Registration', type: 'text', required: true, placeholder: 'Enter registration number' },
      { id: 'ticketDate', label: 'Date of Ticket', type: 'date', required: true },
      { id: 'location', label: 'Location', type: 'text', required: true, placeholder: 'Where ticket was issued' },
      { id: 'appealReason', label: 'Grounds for Appeal', type: 'textarea', required: true, placeholder: 'Why the ticket is unfair' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally appeal the parking penalty notice issued to my vehicle.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'PCN: {ticketNumber}. Vehicle: {vehicleRegistration}. Date: {ticketDate}. Location: {location}. I appeal because: {appealReason}', placeholders: ['ticketNumber', 'vehicleRegistration', 'ticketDate', 'location', 'appealReason'] },
      { id: 'request', name: 'Request', template: 'I request that this penalty be cancelled.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within the statutory timeframe.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have attached supporting evidence for this appeal.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
