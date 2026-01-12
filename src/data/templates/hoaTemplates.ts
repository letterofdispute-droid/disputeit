import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { tier: 'basic' as const, price: 0, name: 'Basic', features: ['Standard letter format', 'Email delivery'] },
  { tier: 'standard' as const, price: 9.99, name: 'Standard', features: ['Professional formatting', 'Priority support', 'PDF download'] },
  { tier: 'premium' as const, price: 19.99, name: 'Premium', features: ['Legal review', 'Tracked delivery', 'Follow-up template', 'Phone support'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReferences: ['Leasehold Reform Act', 'Commonhold and Leasehold Reform Act'], approvedPhrases: ['pursuant to leasehold regulations', 'under the terms of our lease'] },
  { code: 'EU', name: 'European Union', legalReferences: ['Property Law Principles', 'Local Housing Regulations'], approvedPhrases: ['under applicable property law', 'pursuant to community regulations'] },
  { code: 'US', name: 'United States', legalReferences: ['State HOA Laws', 'CC&Rs', 'Fair Housing Act'], approvedPhrases: ['pursuant to state HOA regulations', 'under our community CC&Rs'] },
];

export const hoaTemplates: LetterTemplate[] = [
  {
    id: 'hoa-complaint',
    slug: 'hoa-complaint-letter',
    category: 'hoa',
    title: 'HOA/Management Complaint Letter',
    shortDescription: 'Complain to your HOA or property management about issues.',
    longDescription: 'Use this template to formally complain to your homeowners association or property management company about service issues, rules enforcement, or management problems.',
    seoTitle: 'HOA Complaint Letter | Property Management Template',
    seoDescription: 'Complain to your HOA or management company. Address community issues formally.',
    tones: ['formal', 'assertive', 'professional'],
    fields: [
      { id: 'hoaName', label: 'HOA/Management Company', type: 'text', required: true, placeholder: 'Enter HOA or management name' },
      { id: 'propertyAddress', label: 'Your Property Address', type: 'textarea', required: true, placeholder: 'Your unit/home address' },
      { id: 'complaintType', label: 'Type of Complaint', type: 'text', required: true, placeholder: 'e.g., maintenance, noise, parking' },
      { id: 'complaintDetails', label: 'Complaint Details', type: 'textarea', required: true, placeholder: 'Describe the issue in detail' },
      { id: 'previousAttempts', label: 'Previous Attempts to Resolve', type: 'textarea', required: false, placeholder: 'What you have already tried' },
    ],
    sections: [
      { id: 'intro', title: 'Introduction', content: 'I am writing to formally complain about an issue affecting my property.', placeholders: [] },
      { id: 'facts', title: 'Details', content: 'Property: {{propertyAddress}}. Issue type: {{complaintType}}. Details: {{complaintDetails}}. I have previously attempted: {{previousAttempts}}', placeholders: ['propertyAddress', 'complaintType', 'complaintDetails', 'previousAttempts'] },
      { id: 'request', title: 'Request', content: 'I request that you address this issue and provide a written response with your plan of action.', placeholders: [] },
      { id: 'deadline', title: 'Deadline', content: 'Please respond within 14 days. If unresolved, I will escalate to the relevant housing ombudsman.', placeholders: [] },
      { id: 'closing', title: 'Closing', content: 'I expect this matter to be taken seriously and resolved promptly.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
    pricing: standardPricing,
  },
  {
    id: 'hoa-fee-dispute',
    slug: 'hoa-fee-dispute',
    category: 'hoa',
    title: 'HOA Fee Dispute Letter',
    shortDescription: 'Dispute HOA fees, fines, or special assessments.',
    longDescription: 'Use this template to dispute fees, fines, or special assessments from your HOA that you believe are unfair or incorrect.',
    seoTitle: 'HOA Fee Dispute Letter | Free Template',
    seoDescription: 'Dispute HOA fees and fines. Challenge unfair charges from your HOA.',
    tones: ['formal', 'assertive', 'professional'],
    fields: [
      { id: 'hoaName', label: 'HOA/Management Company', type: 'text', required: true, placeholder: 'Enter HOA name' },
      { id: 'propertyAddress', label: 'Your Property Address', type: 'textarea', required: true, placeholder: 'Your unit/home address' },
      { id: 'feeType', label: 'Type of Fee/Fine', type: 'text', required: true, placeholder: 'e.g., late fee, violation fine, assessment' },
      { id: 'feeAmount', label: 'Amount Disputed', type: 'text', required: true, placeholder: 'e.g., £200' },
      { id: 'disputeReason', label: 'Reason for Dispute', type: 'textarea', required: true, placeholder: 'Why this charge is wrong' },
    ],
    sections: [
      { id: 'intro', title: 'Introduction', content: 'I am writing to dispute a fee that has been charged to my account.', placeholders: [] },
      { id: 'facts', title: 'Details', content: 'Property: {{propertyAddress}}. You have charged a {{feeType}} of {{feeAmount}}. I dispute this because: {{disputeReason}}', placeholders: ['propertyAddress', 'feeType', 'feeAmount', 'disputeReason'] },
      { id: 'request', title: 'Request', content: 'I request that you remove this charge from my account and provide a corrected statement.', placeholders: [] },
      { id: 'deadline', title: 'Deadline', content: 'Please respond within 14 days. I will not pay this disputed amount until resolved.', placeholders: [] },
      { id: 'closing', title: 'Closing', content: 'I am prepared to attend a hearing if necessary to dispute this charge.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
    pricing: standardPricing,
  },
  {
    id: 'neighbor-dispute',
    slug: 'neighbor-dispute-letter',
    category: 'hoa',
    title: 'Neighbor Dispute Letter',
    shortDescription: 'Address issues with a neighbor in a formal letter.',
    longDescription: 'Use this template to formally address ongoing issues with a neighbor, such as noise, property boundaries, or other disputes.',
    seoTitle: 'Neighbor Dispute Letter | Free Template',
    seoDescription: 'Address neighbor disputes formally. Document issues with neighbors.',
    tones: ['formal', 'polite', 'professional'],
    fields: [
      { id: 'neighborName', label: 'Neighbor Name', type: 'text', required: true, placeholder: 'Neighbor name or "Occupant"' },
      { id: 'neighborAddress', label: 'Neighbor Address', type: 'textarea', required: true, placeholder: 'Neighbor property address' },
      { id: 'issueType', label: 'Type of Issue', type: 'text', required: true, placeholder: 'e.g., noise, parking, property' },
      { id: 'issueDetails', label: 'Issue Details', type: 'textarea', required: true, placeholder: 'Describe the problem' },
      { id: 'incidentDates', label: 'Dates of Incidents', type: 'text', required: true, placeholder: 'When this has occurred' },
    ],
    sections: [
      { id: 'intro', title: 'Introduction', content: 'I am writing to address an ongoing issue that is affecting my enjoyment of my property.', placeholders: [] },
      { id: 'facts', title: 'Details', content: 'The issue concerns: {{issueType}}. Specifically: {{issueDetails}}. This has occurred on: {{incidentDates}}.', placeholders: ['issueType', 'issueDetails', 'incidentDates'] },
      { id: 'request', title: 'Request', content: 'I would appreciate if we could resolve this matter amicably. I request that you address this issue going forward.', placeholders: [] },
      { id: 'deadline', title: 'Deadline', content: 'If this continues, I may need to involve the HOA, local council, or seek legal advice.', placeholders: [] },
      { id: 'closing', title: 'Closing', content: 'I hope we can maintain a good neighborly relationship and resolve this cooperatively.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
    pricing: standardPricing,
  },
];
