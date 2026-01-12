import { LetterTemplate } from '../letterTemplates';

const standardPricing = [
  { id: 'basic', name: 'Basic Letter', price: 9.99, currency: 'EUR', features: ['Professional formatting', 'Editable document', 'PDF download'] },
  { id: 'legal', name: 'With Legal References', price: 19.99, currency: 'EUR', features: ['Everything in Basic', 'Jurisdiction-specific references', 'Stronger legal standing'], popular: true },
  { id: 'final', name: 'Final Notice', price: 29.99, currency: 'EUR', features: ['Everything in Legal', 'Escalation language', 'Deadline enforcement'] },
];

const standardJurisdictions = [
  { code: 'UK', name: 'United Kingdom', legalReference: 'Employment Rights Act 1996', approvedPhrases: ['Under the Employment Rights Act', 'In accordance with UK employment law'] },
  { code: 'EU', name: 'European Union', legalReference: 'Working Time Directive', approvedPhrases: ['Under EU employment law', 'In accordance with workers rights'] },
  { code: 'US', name: 'United States', legalReference: 'Fair Labor Standards Act', approvedPhrases: ['Under the FLSA', 'In accordance with federal employment law'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable employment standards'] },
];

export const employmentTemplates: LetterTemplate[] = [
  {
    id: 'final-paycheck-demand', slug: 'final-paycheck-demand', category: 'Employment', title: 'Final Paycheck Demand Letter',
    shortDescription: 'Demand payment of wages owed after leaving a job.',
    longDescription: 'Use this template when your former employer has not paid your final wages.',
    seoTitle: 'Final Paycheck Demand Letter | Free Template', seoDescription: 'Demand your final paycheck.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'employerName', label: 'Employer Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { id: 'employmentEndDate', label: 'Last Day of Employment', type: 'date', required: true },
      { id: 'amountOwed', label: 'Amount Owed', type: 'text', required: true, placeholder: 'e.g., £2,500' },
      { id: 'wagesBreakdown', label: 'Breakdown of Wages Owed', type: 'textarea', required: true, placeholder: 'List what is owed' },
      { id: 'jobTitle', label: 'Your Job Title', type: 'text', required: true, placeholder: 'Your position' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to demand immediate payment of wages owed to me.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'I was employed as {jobTitle}. Employment ended on {employmentEndDate}. I am owed {amountOwed}: {wagesBreakdown}', placeholders: ['jobTitle', 'employmentEndDate', 'amountOwed', 'wagesBreakdown'] },
      { id: 'request', name: 'Request', template: 'I demand payment within 7 days.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'If not received, I will file a claim with the employment tribunal.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please send payment immediately.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
  {
    id: 'wrongful-termination', slug: 'wrongful-termination-complaint', category: 'Employment', title: 'Wrongful Termination Complaint Letter',
    shortDescription: 'Challenge an unfair or illegal dismissal.',
    longDescription: 'Use this template when you believe you were fired illegally or unfairly.',
    seoTitle: 'Wrongful Termination Complaint Letter | Free Template', seoDescription: 'Challenge wrongful termination.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'employerName', label: 'Employer Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { id: 'terminationDate', label: 'Termination Date', type: 'date', required: true },
      { id: 'reasonGiven', label: 'Reason Given for Termination', type: 'textarea', required: true, placeholder: 'What they said' },
      { id: 'whyWrongful', label: 'Why Termination Was Wrong', type: 'textarea', required: true, placeholder: 'Why it was illegal/unfair' },
      { id: 'yearsEmployed', label: 'Years Employed', type: 'text', required: true, placeholder: 'e.g., 5 years' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally dispute my termination which I believe was wrongful.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Employed for {yearsEmployed}, terminated on {terminationDate}. Reason given: {reasonGiven}. This was wrongful because: {whyWrongful}', placeholders: ['yearsEmployed', 'terminationDate', 'reasonGiven', 'whyWrongful'] },
      { id: 'request', name: 'Request', template: 'I demand reinstatement or appropriate compensation.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days or I will file a tribunal claim.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have sought legal advice and will pursue all available remedies.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions, pricing: standardPricing,
  },
];
