// ============= Field Validation Types =============

export type ValidationFormat = 
  | 'email' | 'phone' | 'date' | 'currency' 
  // Travel
  | 'pir' | 'pnr' | 'iata' | 'flightNumber' | 'bagTag' | 'worldTracer'
  // Insurance
  | 'policyNumber' | 'claimNumber'
  // Vehicle
  | 'vin' | 'licensePlate'
  // Financial
  | 'accountLast4' | 'sortCode' | 'iban'
  // Housing
  | 'tenancyRef'
  // Healthcare
  | 'npiNumber' | 'rxNumber'
  // Contractors
  | 'licenseNumber' | 'permitNumber';

export interface FieldValidation {
  pattern?: string;               // Regex pattern as string
  patternMessage?: string;        // "Must be 6 letters/numbers"
  minLength?: number;
  maxLength?: number;
  format?: ValidationFormat;      // Named format for pre-built validators
  customValidator?: string;       // Named validator function
}

// ============= Template Interfaces =============

export interface LetterTemplate {
  id: string;
  slug: string;
  category: string;
  subcategory?: string;        // Human-readable: "Plumbing", "Electrical"
  subcategorySlug?: string;    // URL-friendly: "plumbing", "electrical"
  title: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  tones: ('neutral' | 'firm' | 'final')[];
  fields: TemplateField[];
  sections: TemplateSection[];
  jurisdictions: JurisdictionConfig[];
  pricing?: any[]; // Legacy - unused, being removed from template files
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number';
  placeholder?: string;
  required: boolean;
  helpText?: string;
  options?: string[];
  
  // Smart enhancement properties
  validation?: FieldValidation;
  aiEnhanced?: boolean;           // Enable AI suggestions for this field
  evidenceHint?: string;          // "Have your boarding pass handy"
  formatHint?: string;            // "Format: ABC123 (6 characters)"
  commonMistakes?: string[];      // ["Don't include spaces", "Use capitals"]
  impactLevel?: 'critical' | 'important' | 'helpful';
}

export interface TemplateSection {
  id: string;
  name: string;
  template: string;
  placeholders: string[];
}

export interface JurisdictionConfig {
  code: string;
  name: string;
  legalReference?: string;
  approvedPhrases: string[];
}


// Master Templates - Human-written, legally cautious
export const letterTemplates: LetterTemplate[] = [
  {
    id: 'refund-request',
    slug: 'refund',
    category: 'Consumer Rights',
    title: 'Refund Request Letter',
    shortDescription: 'Request a refund for products or services that did not meet expectations.',
    longDescription: `A refund request letter is a formal written document sent to a business or service provider requesting the return of money paid for goods or services. This letter serves as an official record of your request and clearly communicates your expectations.

When to use this letter:
- Product arrived damaged or defective
- Service was not delivered as promised
- Item does not match the description
- You received the wrong item
- Quality significantly below expectations

This template helps you communicate professionally and increases your chances of a successful resolution.`,
    seoTitle: 'Refund Request Letter – Free Template & Generator',
    seoDescription: 'Create a professional refund request letter in minutes. Free template with customizable options for damaged goods, wrong items, or unsatisfactory services.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g., ABC Electronics Ltd', required: true, impactLevel: 'critical' },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address of the company', required: true, impactLevel: 'important' },
      { id: 'orderNumber', label: 'Order/Reference Number', type: 'text', placeholder: 'e.g., ORD-123456', required: false, helpText: 'If applicable', evidenceHint: 'Check your order confirmation email or receipt', impactLevel: 'important' },
      { id: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true, impactLevel: 'critical' },
      { id: 'productDescription', label: 'Product/Service Description', type: 'textarea', placeholder: 'Describe the item or service purchased', required: true, aiEnhanced: true, evidenceHint: 'Include model numbers, sizes, or specific details for stronger identification', impactLevel: 'critical' },
      { id: 'amountPaid', label: 'Amount Paid', type: 'text', placeholder: 'e.g., €99.99', required: true, validation: { format: 'currency' }, evidenceHint: 'Check your bank statement or receipt for exact amount', impactLevel: 'critical' },
      { id: 'issueDescription', label: 'Describe the Issue', type: 'textarea', placeholder: 'Explain what went wrong with the product or service', required: true, aiEnhanced: true, evidenceHint: 'Be specific and factual. Include dates, observations, and impact on you.', impactLevel: 'critical' },
      { id: 'previousContact', label: 'Previous Contact Attempts', type: 'textarea', placeholder: 'Any previous emails, calls, or visits', required: false, aiEnhanced: true, evidenceHint: 'Include dates and names of representatives you spoke with', impactLevel: 'helpful' },
    ],
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        template: 'I am writing to formally request a refund for {productDescription}, purchased on {purchaseDate} for {amountPaid}.',
        placeholders: ['productDescription', 'purchaseDate', 'amountPaid'],
      },
      {
        id: 'facts',
        name: 'Facts of the Matter',
        template: '{issueDescription}',
        placeholders: ['issueDescription'],
      },
      {
        id: 'request',
        name: 'Request',
        template: 'I am requesting a full refund of {amountPaid} to the original payment method.',
        placeholders: ['amountPaid'],
      },
      {
        id: 'deadline',
        name: 'Response Expected',
        template: 'I kindly request a response within 14 days of receipt of this letter.',
        placeholders: [],
      },
      {
        id: 'closing',
        name: 'Closing',
        template: 'I trust this matter can be resolved amicably. I look forward to your prompt response.',
        placeholders: [],
      },
    ],
    jurisdictions: [
      {
        code: 'EU',
        name: 'European Union',
        legalReference: 'consumer protection regulations',
        approvedPhrases: ['Under EU consumer protection regulations', 'In accordance with my consumer rights'],
      },
      {
        code: 'UK',
        name: 'United Kingdom',
        legalReference: 'Consumer Rights Act 2015',
        approvedPhrases: ['Under the Consumer Rights Act 2015', 'In accordance with UK consumer law'],
      },
      {
        code: 'US',
        name: 'United States',
        approvedPhrases: ['Under applicable consumer protection laws', 'In accordance with my consumer rights'],
      },
      {
        code: 'INTL',
        name: 'International / Other',
        approvedPhrases: ['In accordance with applicable consumer protection standards'],
      },
    ],
  },
  {
    id: 'landlord-repairs',
    slug: 'landlord-repairs',
    category: 'Housing',
    title: 'Landlord Repair Request Letter',
    shortDescription: 'Formally request your landlord to carry out necessary repairs to your rental property.',
    longDescription: `A landlord repair request letter is a formal written notice sent to your landlord or property manager requesting that necessary repairs be made to your rental property. This creates an official record of your request.

When to use this letter:
- Heating or plumbing issues
- Structural problems
- Mold or damp conditions
- Broken appliances (if landlord-provided)
- Security concerns (locks, windows)
- General maintenance issues

Documenting your repair requests in writing is essential for protecting your rights as a tenant.`,
    seoTitle: 'Landlord Repair Request Letter – Free Template & Generator',
    seoDescription: 'Create a professional letter requesting repairs from your landlord. Free template for heating, plumbing, mold, and maintenance issues.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'landlordName', label: 'Landlord/Agent Name', type: 'text', placeholder: 'e.g., Mr. John Smith', required: true, impactLevel: 'critical' },
      { id: 'landlordAddress', label: 'Landlord Address', type: 'textarea', placeholder: 'Full address', required: true, impactLevel: 'important' },
      { id: 'propertyAddress', label: 'Your Rental Property Address', type: 'textarea', placeholder: 'The property requiring repairs', required: true, impactLevel: 'critical' },
      { id: 'tenancyStart', label: 'Tenancy Start Date', type: 'date', required: false, impactLevel: 'helpful' },
      { id: 'repairDescription', label: 'Describe the Repair Needed', type: 'textarea', placeholder: 'Be specific about what needs to be fixed', required: true, aiEnhanced: true, evidenceHint: 'Take photos/videos of the issue. Note any safety hazards.', impactLevel: 'critical' },
      { id: 'issueDate', label: 'When Did the Issue Start?', type: 'date', required: true, impactLevel: 'critical' },
      { id: 'impact', label: 'How Does This Affect You?', type: 'textarea', placeholder: 'e.g., Unable to use heating, health concerns', required: true, aiEnhanced: true, evidenceHint: 'Mention health impacts, safety risks, or inability to use parts of your home', impactLevel: 'critical' },
      { id: 'previousReports', label: 'Previous Reports of This Issue', type: 'textarea', placeholder: 'Any previous notifications', required: false, aiEnhanced: true, evidenceHint: 'Include dates and methods of previous reports (emails, calls, texts)', impactLevel: 'important' },
    ],
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        template: 'I am writing to formally notify you of a repair issue at {propertyAddress} that requires your urgent attention.',
        placeholders: ['propertyAddress'],
      },
      {
        id: 'facts',
        name: 'Description of Issue',
        template: '{repairDescription}\n\nThis issue first occurred on {issueDate}. {impact}',
        placeholders: ['repairDescription', 'issueDate', 'impact'],
      },
      {
        id: 'request',
        name: 'Request',
        template: 'I am requesting that you arrange for this repair to be carried out as soon as possible.',
        placeholders: [],
      },
      {
        id: 'deadline',
        name: 'Response Expected',
        template: 'Please respond within 14 days to confirm when the repair will be completed.',
        placeholders: [],
      },
      {
        id: 'closing',
        name: 'Closing',
        template: 'Thank you for your attention to this matter. I look forward to your response.',
        placeholders: [],
      },
    ],
    jurisdictions: [
      {
        code: 'EU',
        name: 'European Union',
        approvedPhrases: ['As my landlord, you have a responsibility to maintain the property in good condition'],
      },
      {
        code: 'UK',
        name: 'United Kingdom',
        legalReference: 'Landlord and Tenant Act',
        approvedPhrases: ['Under your obligations as a landlord', 'In accordance with housing standards'],
      },
      {
        code: 'US',
        name: 'United States',
        approvedPhrases: ['Under the implied warranty of habitability', 'As required by local housing codes'],
      },
      {
        code: 'INTL',
        name: 'International / Other',
        approvedPhrases: ['Under your responsibilities as landlord'],
      },
    ],
  },
  {
    id: 'damaged-goods',
    slug: 'damaged-goods',
    category: 'Consumer Rights',
    title: 'Damaged Goods Complaint Letter',
    shortDescription: 'File a formal complaint about goods that arrived damaged or were damaged during delivery.',
    longDescription: `A damaged goods complaint letter is a formal written document sent to a retailer, manufacturer, or delivery company when products arrive in a damaged condition. This letter documents the damage and requests appropriate resolution.

When to use this letter:
- Package arrived visibly damaged
- Product was broken inside the packaging
- Items were damaged during shipping
- Multiple items in order were affected
- Fragile items not properly protected

Always document damage with photographs before contacting the seller.`,
    seoTitle: 'Damaged Goods Complaint Letter – Free Template & Generator',
    seoDescription: 'Create a professional complaint letter for damaged deliveries. Free template for broken, defective, or improperly shipped items.',
    tones: ['neutral', 'firm', 'final'],
    fields: [
      { id: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Retailer or shipping company', required: true, impactLevel: 'critical' },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', placeholder: 'Full address', required: true, impactLevel: 'important' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', placeholder: 'e.g., ORD-123456', required: true, evidenceHint: 'Find in your order confirmation email', impactLevel: 'critical' },
      { id: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true, impactLevel: 'critical' },
      { id: 'productDescription', label: 'Product Description', type: 'textarea', placeholder: 'What items were ordered', required: true, aiEnhanced: true, evidenceHint: 'Include product names, SKUs, and quantities', impactLevel: 'critical' },
      { id: 'damageDescription', label: 'Describe the Damage', type: 'textarea', placeholder: 'Be specific about the damage observed', required: true, aiEnhanced: true, evidenceHint: 'Photograph damage immediately upon delivery, before moving items', impactLevel: 'critical' },
      { id: 'hasPhotos', label: 'Do you have photos of the damage?', type: 'select', options: ['Yes', 'No'], required: true, impactLevel: 'important' },
      { id: 'resolution', label: 'Preferred Resolution', type: 'select', options: ['Full refund', 'Replacement item', 'Partial refund'], required: true, impactLevel: 'critical' },
    ],
    sections: [
      {
        id: 'introduction',
        name: 'Introduction',
        template: 'I am writing to formally complain about damaged goods received in order {orderNumber}, delivered on {deliveryDate}.',
        placeholders: ['orderNumber', 'deliveryDate'],
      },
      {
        id: 'facts',
        name: 'Details of Damage',
        template: 'I ordered: {productDescription}\n\nUpon receipt, I discovered the following damage: {damageDescription}',
        placeholders: ['productDescription', 'damageDescription'],
      },
      {
        id: 'request',
        name: 'Resolution Requested',
        template: 'I am requesting a {resolution} for the damaged items.',
        placeholders: ['resolution'],
      },
      {
        id: 'deadline',
        name: 'Response Expected',
        template: 'I request a response within 14 days of receipt of this letter.',
        placeholders: [],
      },
      {
        id: 'closing',
        name: 'Closing',
        template: 'I have retained photographic evidence of the damage. I trust this matter will be resolved promptly.',
        placeholders: [],
      },
    ],
    jurisdictions: [
      {
        code: 'EU',
        name: 'European Union',
        legalReference: 'consumer protection regulations',
        approvedPhrases: ['Under EU consumer protection regulations, goods must be delivered in satisfactory condition'],
      },
      {
        code: 'UK',
        name: 'United Kingdom',
        legalReference: 'Consumer Rights Act 2015',
        approvedPhrases: ['Under the Consumer Rights Act 2015, goods must be of satisfactory quality'],
      },
      {
        code: 'US',
        name: 'United States',
        approvedPhrases: ['Goods must be delivered in the condition promised at the time of sale'],
      },
      {
        code: 'INTL',
        name: 'International / Other',
        approvedPhrases: ['Products should be delivered in satisfactory condition'],
      },
    ],
  },
];

export function getTemplateBySlug(slug: string): LetterTemplate | undefined {
  return letterTemplates.find(t => t.slug === slug);
}

export function getAllTemplates(): LetterTemplate[] {
  return letterTemplates;
}
