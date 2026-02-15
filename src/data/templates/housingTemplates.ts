import { LetterTemplate } from '../letterTemplates';
import { repairMaintenanceTemplates } from './housing/repairMaintenanceTemplates';
import { tenancyDisputeTemplates } from './housing/tenancyDisputeTemplates';
import { safetyComplianceTemplates } from './housing/safetyComplianceTemplates';
import { lettingAgentTemplates } from './housing/lettingAgentTemplates';
import { neighborHousingDisputeTemplates } from './housing/neighborDisputeTemplates';


const standardJurisdictions = [
  { code: 'US', name: 'United States', legalReference: 'Fair Housing Act', approvedPhrases: ['Under the implied warranty of habitability', 'In accordance with applicable housing laws'] },
  { code: 'UK', name: 'United Kingdom', legalReference: 'Housing Act 2004', approvedPhrases: ['Under the Housing Act 2004', 'In accordance with UK housing law'] },
  { code: 'EU', name: 'European Union', legalReference: 'EU Consumer Rights Directive', approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'] },
  { code: 'INTL', name: 'International / Other', approvedPhrases: ['In accordance with applicable housing standards'] },
];

// Core housing templates (14 templates)
const coreHousingTemplates: LetterTemplate[] = [
  {
    id: 'landlord-repairs-general', slug: 'landlord-repairs-general', category: 'Housing', title: 'Landlord Repair Request Letter',
    shortDescription: 'Request your landlord to carry out necessary repairs to your rental property.',
    longDescription: 'Use this template when your landlord has failed to maintain the property in good repair.',
    seoTitle: 'Landlord Repair Request Letter Template | Free Generator', seoDescription: 'Generate a professional landlord repair request letter.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, placeholder: 'Enter landlord full name', impactLevel: 'important', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name (Tenant)', type: 'text', required: true, placeholder: 'Your full name', impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'Property City/Town', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyZipCode', label: 'Property ZIP Code', type: 'text', required: true, impactLevel: 'important' },
      { id: 'repairIssue', label: 'Repair Issue Description', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Describe location, severity, and impact on habitability' },
      { id: 'dateReported', label: 'Date First Reported', type: 'date', required: true, impactLevel: 'critical', evidenceHint: 'Check emails, texts, or call logs for first report date' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to formally request repairs at the above property.', placeholders: [] },
      { id: 'facts', name: 'Issue Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nRepair issue: {repairIssue}\nFirst reported: {dateReported}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'repairIssue', 'dateReported'] },
      { id: 'request', name: 'Request', template: 'I request that you arrange for these repairs within 14 days.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'If I do not receive a response, I may escalate to housing authorities.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I look forward to your prompt response.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'landlord-heating', slug: 'landlord-heating-complaint', category: 'Housing', title: 'Heating System Complaint Letter',
    shortDescription: 'Complain about broken or inadequate heating in your rental property.',
    longDescription: 'Use this template when your heating system is not working properly.',
    seoTitle: 'Heating Complaint Letter to Landlord | Free Template', seoDescription: 'Generate a heating complaint letter.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, impactLevel: 'important', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'City', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyPostcode', label: 'Postcode', type: 'text', required: true, impactLevel: 'important' },
      { id: 'heatingType', label: 'Heating System Type', type: 'select', options: ['Gas Central Heating', 'Electric Heating', 'Oil Heating', 'Heat Pump', 'Other'], required: true, impactLevel: 'important' },
      { id: 'heatingIssue', label: 'Heating Problem', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Note temperature readings, error codes, or symptoms' },
      { id: 'dateStarted', label: 'When Did Issue Start', type: 'date', required: true, impactLevel: 'critical', evidenceHint: 'Essential for urgent repairs in cold weather' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to urgently request repair of the heating system.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nHeating type: {heatingType}\nProblem: {heatingIssue}\nStarted: {dateStarted}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'heatingType', 'heatingIssue', 'dateStarted'] },
      { id: 'request', name: 'Request', template: 'I require the heating to be repaired within 48 hours.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Failure to address this may result in contacting environmental health.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please contact me immediately.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'deposit-return', slug: 'deposit-return-request', category: 'Housing', title: 'Deposit Return Request Letter',
    shortDescription: 'Request the return of your tenancy deposit.',
    longDescription: 'Use this template when your landlord has not returned your deposit.',
    seoTitle: 'Deposit Return Request Letter | Free Template', seoDescription: 'Demand your tenancy deposit back.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, impactLevel: 'important', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'City', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyPostcode', label: 'Postcode', type: 'text', required: true, impactLevel: 'important' },
      { id: 'depositAmount', label: 'Deposit Amount', type: 'text', required: true, impactLevel: 'critical', validation: { format: 'currency' }, evidenceHint: 'Check tenancy agreement or deposit protection certificate' },
      { id: 'tenancyEndDate', label: 'Tenancy End Date', type: 'date', required: true, impactLevel: 'critical' },
      { id: 'keysReturnedDate', label: 'Date Keys Returned', type: 'date', required: true, impactLevel: 'critical', evidenceHint: 'Get written confirmation when returning keys' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to request the return of my tenancy deposit.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nDeposit: {depositAmount}\nTenancy ended: {tenancyEndDate}\nKeys returned: {keysReturnedDate}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'depositAmount', 'tenancyEndDate', 'keysReturnedDate'] },
      { id: 'request', name: 'Request', template: 'Please return my deposit in full within 14 days.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'If not returned, I will pursue adjudication through the deposit scheme.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'Please confirm when the deposit will be returned.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'deposit-deduction-dispute', slug: 'deposit-deduction-dispute', category: 'Housing', title: 'Deposit Deduction Dispute Letter',
    shortDescription: 'Dispute unfair deductions from your tenancy deposit.',
    longDescription: 'Use this template when your landlord has made unfair deductions.',
    seoTitle: 'Deposit Deduction Dispute Letter | Free Template', seoDescription: 'Challenge unfair deposit deductions.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, impactLevel: 'important', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'City', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyPostcode', label: 'Postcode', type: 'text', required: true, impactLevel: 'important' },
      { id: 'totalDeposit', label: 'Total Deposit', type: 'text', required: true, impactLevel: 'critical', validation: { format: 'currency' } },
      { id: 'amountDeducted', label: 'Amount Deducted', type: 'text', required: true, impactLevel: 'critical', validation: { format: 'currency' }, evidenceHint: 'Get itemized breakdown from landlord' },
      { id: 'deductionReasons', label: 'Stated Reasons', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true },
      { id: 'disputeReasons', label: 'Why You Dispute', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Reference check-in inventory and dated photos' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the deductions from my deposit.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nDeposit: {totalDeposit}\nDeducted: {amountDeducted}\n\nReasons given: {deductionReasons}\n\nI dispute because: {disputeReasons}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'totalDeposit', 'amountDeducted', 'deductionReasons', 'disputeReasons'] },
      { id: 'request', name: 'Request', template: 'I request return of the disputed amount.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'If not resolved, I will escalate to the deposit scheme.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have photographic evidence to support my dispute.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'rent-increase-dispute', slug: 'rent-increase-dispute', category: 'Housing', title: 'Rent Increase Dispute Letter',
    shortDescription: 'Challenge an unfair or improper rent increase.',
    longDescription: 'Use this template when you believe a rent increase is unreasonable.',
    seoTitle: 'Rent Increase Dispute Letter | Free Template', seoDescription: 'Challenge unfair rent increases.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, impactLevel: 'important', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'City', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyPostcode', label: 'Postcode', type: 'text', required: true, impactLevel: 'important' },
      { id: 'currentRent', label: 'Current Rent', type: 'text', required: true, impactLevel: 'critical', validation: { format: 'currency' } },
      { id: 'proposedRent', label: 'Proposed New Rent', type: 'text', required: true, impactLevel: 'critical', validation: { format: 'currency' }, evidenceHint: 'Check the notice for effective date' },
      { id: 'disputeReasons', label: 'Reasons for Dispute', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Research comparable rents in the area' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to dispute the proposed rent increase.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nCurrent rent: {currentRent}\nProposed: {proposedRent}\n\nI dispute because: {disputeReasons}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'currentRent', 'proposedRent', 'disputeReasons'] },
      { id: 'request', name: 'Request', template: 'I request you reconsider this increase.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'Please respond within 14 days.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I am open to reasonable discussion.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
  {
    id: 'landlord-harassment', slug: 'landlord-harassment-complaint', category: 'Housing', title: 'Landlord Harassment Complaint Letter',
    shortDescription: 'Report harassment or intimidation by your landlord.',
    longDescription: 'Use this template when your landlord is engaging in harassment.',
    seoTitle: 'Landlord Harassment Complaint Letter | Free Template', seoDescription: 'Report landlord harassment.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord Name', type: 'text', required: true, impactLevel: 'critical', aiEnhanced: true },
      { id: 'tenantName', label: 'Your Name', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyAddressLine1', label: 'Property Address', type: 'text', required: true, impactLevel: 'critical' },
      { id: 'propertyCity', label: 'City', type: 'text', required: true, impactLevel: 'important' },
      { id: 'propertyPostcode', label: 'Postcode', type: 'text', required: true, impactLevel: 'important' },
      { id: 'harassmentType', label: 'Type of Harassment', type: 'select', options: ['Unlawful entry', 'Verbal abuse', 'Threats', 'Utility interference', 'Intimidation', 'Other'], required: true, impactLevel: 'critical' },
      { id: 'harassmentDescription', label: 'Description', type: 'textarea', required: true, impactLevel: 'critical', aiEnhanced: true, evidenceHint: 'Include dates, times, witnesses, and exact words used' },
      { id: 'incidentDates', label: 'Dates of Incidents', type: 'text', required: true, impactLevel: 'critical', evidenceHint: 'Keep a diary of all incidents with times' },
    ],
    sections: [
      { id: 'introduction', name: 'Introduction', template: 'I am writing to complain about harassment I have experienced.', placeholders: [] },
      { id: 'facts', name: 'Details', template: 'Tenant: {tenantName}\nProperty: {propertyAddressLine1}, {propertyCity}, {propertyPostcode}\n\nHarassment type: {harassmentType}\n\nIncidents: {harassmentDescription}\nDates: {incidentDates}', placeholders: ['tenantName', 'propertyAddressLine1', 'propertyCity', 'propertyPostcode', 'harassmentType', 'harassmentDescription', 'incidentDates'] },
      { id: 'request', name: 'Request', template: 'I demand this behavior cease immediately.', placeholders: [] },
      { id: 'deadline', name: 'Deadline', template: 'If this continues, I will report to police and housing authority.', placeholders: [] },
      { id: 'closing', name: 'Closing', template: 'I have kept records of all incidents.', placeholders: [] },
    ],
    jurisdictions: standardJurisdictions,
  },
];

// Combine all housing templates (50 total)
export const housingTemplates: LetterTemplate[] = [
  ...coreHousingTemplates,
  ...repairMaintenanceTemplates,
  ...tenancyDisputeTemplates,
  ...safetyComplianceTemplates,
  ...lettingAgentTemplates,
  ...neighborHousingDisputeTemplates,
];
