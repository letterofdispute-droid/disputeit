// Consumer rights educational content organized by dispute category

export interface RightItem {
  title: string;
  description: string;
}

export interface CategoryGuide {
  categoryId: string;
  title: string;
  subtitle: string;
  introduction: string;
  keyRights: RightItem[];
  commonIssues: string[];
  actionSteps: string[];
  importantDeadlines?: string[];
  usefulLinks?: { title: string; description: string }[];
}

export const consumerRightsGuides: CategoryGuide[] = [
  {
    categoryId: 'refunds',
    title: 'Your Rights When Seeking Refunds',
    subtitle: 'Understanding consumer protection laws for purchases',
    introduction: 'When you buy goods or services that don\'t meet expectations, you have legal rights to seek refunds, repairs, or replacements. These protections vary by jurisdiction but generally cover situations where products are faulty, not as described, or services are not performed with reasonable care.',
    keyRights: [
      { title: 'Right to a Refund for Faulty Goods', description: 'If a product is defective or doesn\'t match its description, you\'re entitled to a full refund within a reasonable time.' },
      { title: 'Right to Repair or Replacement', description: 'For minor defects, sellers may offer repair or replacement as an alternative to refund.' },
      { title: 'Cooling-Off Periods', description: 'For online and distance purchases, you typically have 14-30 days to return items for any reason.' },
      { title: 'Credit Card Chargeback Rights', description: 'If a seller won\'t cooperate, your credit card company may reverse the charge under consumer protection rules.' },
    ],
    commonIssues: [
      'Product doesn\'t match the online description',
      'Item arrived damaged or defective',
      'Service not performed as promised',
      'Seller refuses to honor return policy',
      'Delayed or missing refunds',
    ],
    actionSteps: [
      'Document the issue with photos and keep all receipts',
      'Contact the seller in writing first',
      'Reference specific consumer protection laws',
      'Set a clear deadline for resolution',
      'Escalate to your credit card company or consumer agency if needed',
    ],
    importantDeadlines: [
      '14-30 days for cooling-off period returns',
      '30 days for short-term right to reject (faulty goods)',
      '6 months presumption period (defect presumed to exist at time of sale)',
      '120 days for credit card chargeback claims',
    ],
  },
  {
    categoryId: 'housing',
    title: 'Tenant Rights & Housing Protections',
    subtitle: 'Know your rights as a renter',
    introduction: 'Tenants have significant legal protections covering everything from the condition of the property to how deposits are handled. Understanding these rights helps you advocate effectively when issues arise with landlords or property managers.',
    keyRights: [
      { title: 'Right to a Habitable Home', description: 'Landlords must maintain properties in a condition fit for living, including working heating, plumbing, and structural safety.' },
      { title: 'Security Deposit Protections', description: 'Deposits must be returned within legally specified timeframes, and deductions must be itemized and reasonable.' },
      { title: 'Right to Quiet Enjoyment', description: 'Landlords cannot unreasonably disturb your peaceful use of the property or enter without proper notice.' },
      { title: 'Protection from Retaliation', description: 'Landlords cannot evict or harass tenants for exercising their legal rights, such as reporting code violations.' },
    ],
    commonIssues: [
      'Unreturned or unfairly deducted security deposits',
      'Landlord failing to make necessary repairs',
      'Harassment or illegal entry by landlord',
      'Rent increases without proper notice',
      'Unfair eviction attempts',
    ],
    actionSteps: [
      'Always document property conditions with dated photos',
      'Put all repair requests in writing',
      'Know your local tenant protection laws',
      'Keep copies of all correspondence',
      'Contact local housing authority for serious violations',
    ],
    importantDeadlines: [
      '14-45 days for deposit return (varies by state)',
      '24-48 hours minimum notice for landlord entry',
      '30-60 days notice for rent increases',
      'Varies for repair deadlines based on urgency',
    ],
  },
  {
    categoryId: 'travel',
    title: 'Air Passenger & Travel Rights',
    subtitle: 'Compensation for delays, cancellations, and lost baggage',
    introduction: 'Air passengers and travelers have robust protections, especially in the EU under EC 261/2004 and similar regulations elsewhere. These cover flight delays, cancellations, denied boarding, and lost or damaged luggage.',
    keyRights: [
      { title: 'Compensation for Long Delays', description: 'Flights delayed 3+ hours may entitle you to €250-600 compensation depending on distance.' },
      { title: 'Right to Care During Delays', description: 'Airlines must provide meals, refreshments, and accommodation for significant delays.' },
      { title: 'Full Refund for Cancellations', description: 'If your flight is cancelled, you\'re entitled to a full refund or alternative routing.' },
      { title: 'Baggage Liability', description: 'Airlines are liable for lost, delayed, or damaged baggage up to approximately €1,300 under the Montreal Convention.' },
    ],
    commonIssues: [
      'Flight cancelled with no compensation offered',
      'Long delays with no assistance provided',
      'Denied boarding due to overbooking',
      'Lost or delayed baggage',
      'Booking cancellation refund refused',
    ],
    actionSteps: [
      'Keep all boarding passes, receipts, and documentation',
      'Get written confirmation of delay/cancellation reason',
      'File claims within required timeframes',
      'Request EU261 compensation using standard letters',
      'Escalate to aviation authority if airline doesn\'t respond',
    ],
    importantDeadlines: [
      '7 days for written baggage damage report',
      '21 days for delayed baggage claims',
      '2-6 years for EU261 compensation claims (varies by country)',
      'Check airline policies for booking cancellation deadlines',
    ],
  },
  {
    categoryId: 'damaged-goods',
    title: 'Rights for Defective Products',
    subtitle: 'What to do when items arrive damaged or don\'t work',
    introduction: 'When products are damaged, defective, or not as described, consumer protection laws provide strong remedies. Sellers are responsible for delivering goods that match their description and are of satisfactory quality.',
    keyRights: [
      { title: 'Goods Must Match Description', description: 'Products must match any description given by the seller, including online listings and advertisements.' },
      { title: 'Satisfactory Quality Standard', description: 'Items must be free from defects, safe, durable, and fit for their intended purpose.' },
      { title: 'Manufacturer Warranty Rights', description: 'Warranties provide additional protections beyond statutory rights and must be honored.' },
      { title: 'Delivery Damage Liability', description: 'Sellers are responsible for goods until they reach you, including any transit damage.' },
    ],
    commonIssues: [
      'Product arrived broken or damaged',
      'Item doesn\'t match online photos or description',
      'Defect appeared shortly after purchase',
      'Seller blaming shipping company',
      'Warranty claim denied unfairly',
    ],
    actionSteps: [
      'Photograph damage immediately upon delivery',
      'Report issues to seller within 48 hours',
      'Keep original packaging if possible',
      'Request repair, replacement, or refund in writing',
      'Cite specific consumer protection statutes',
    ],
  },
  {
    categoryId: 'utilities',
    title: 'Utility & Telecom Consumer Rights',
    subtitle: 'Protections for essential services',
    introduction: 'Utility and telecommunications companies must follow strict regulations regarding billing, service quality, and contract terms. Consumers have rights to accurate billing, service continuity, and fair treatment.',
    keyRights: [
      { title: 'Accurate Billing', description: 'Companies must provide clear, itemized bills and correct errors promptly.' },
      { title: 'Service Standards', description: 'Providers must meet minimum service quality standards and address outages.' },
      { title: 'Contract Transparency', description: 'Terms must be clear, and changes require proper notice.' },
      { title: 'Switching Rights', description: 'You have the right to switch providers without unreasonable penalties.' },
    ],
    commonIssues: [
      'Unexplained charges on bills',
      'Poor service quality or frequent outages',
      'Early termination fee disputes',
      'Difficulty cancelling services',
      'Incorrect meter readings',
    ],
    actionSteps: [
      'Review bills carefully each month',
      'Document service outages with dates and times',
      'Request itemized breakdowns of charges',
      'File complaints with industry regulator',
      'Know your cooling-off period for new contracts',
    ],
  },
  {
    categoryId: 'financial',
    title: 'Financial Consumer Rights',
    subtitle: 'Protections for banking, credit, and financial services',
    introduction: 'Financial consumers have extensive protections covering credit reporting, banking practices, debt collection, and access to their financial data. Understanding these rights helps you challenge errors and unfair practices.',
    keyRights: [
      { title: 'Accurate Credit Reporting', description: 'Credit bureaus must investigate and correct inaccurate information within 30 days.' },
      { title: 'Protection from Unfair Debt Collection', description: 'Collectors cannot harass, mislead, or use unfair practices to collect debts.' },
      { title: 'Right to Dispute Transactions', description: 'You can dispute unauthorized or incorrect charges on cards and accounts.' },
      { title: 'Data Access Rights', description: 'You have the right to access your financial data and understand how it\'s used.' },
    ],
    commonIssues: [
      'Errors on credit report',
      'Unauthorized account charges',
      'Aggressive debt collector tactics',
      'Unfair bank fees',
      'Identity theft impacts',
    ],
    actionSteps: [
      'Check credit reports from all bureaus annually',
      'Dispute errors in writing with documentation',
      'Keep records of all debt collection contacts',
      'Report unauthorized transactions immediately',
      'File complaints with CFPB or financial regulators',
    ],
    importantDeadlines: [
      '60 days to dispute credit card charges',
      '30 days for credit bureau investigation',
      '7 years for most negative items on credit reports',
      'Promptly report identity theft',
    ],
  },
  {
    categoryId: 'insurance',
    title: 'Insurance Claim Rights',
    subtitle: 'Understanding your policy protections',
    introduction: 'Insurance policyholders have rights when filing claims, including fair investigation, timely decisions, and proper explanations for denials. Knowing these rights helps you challenge wrongful claim denials.',
    keyRights: [
      { title: 'Good Faith Handling', description: 'Insurers must handle claims fairly and not unreasonably delay or deny valid claims.' },
      { title: 'Clear Denial Explanations', description: 'If a claim is denied, insurers must provide specific, written reasons.' },
      { title: 'Right to Appeal', description: 'You can appeal claim decisions through internal and external review processes.' },
      { title: 'Timely Processing', description: 'Claims must be acknowledged, investigated, and decided within regulatory timeframes.' },
    ],
    commonIssues: [
      'Claim denied without clear explanation',
      'Lowball settlement offers',
      'Unreasonable delays in processing',
      'Policy cancellation disputes',
      'Coverage interpretation disagreements',
    ],
    actionSteps: [
      'Document everything related to your claim',
      'Request denials in writing with specific reasons',
      'Review your policy language carefully',
      'File internal appeals first',
      'Contact state insurance commissioner for unresolved issues',
    ],
  },
  {
    categoryId: 'vehicle',
    title: 'Vehicle Buyer & Owner Rights',
    subtitle: 'Protections for car purchases and repairs',
    introduction: 'Vehicle buyers have protections against undisclosed defects, odometer fraud, and unfair dealer practices. Lemon laws provide remedies for persistently defective new vehicles.',
    keyRights: [
      { title: 'Lemon Law Protections', description: 'New vehicles with repeated, unfixable defects may qualify for refund or replacement.' },
      { title: 'Disclosure Requirements', description: 'Dealers must disclose known defects, accident history, and accurate mileage.' },
      { title: 'Warranty Enforcement', description: 'Manufacturer and dealer warranties must be honored as written.' },
      { title: 'Repair Estimate Rights', description: 'Repair shops must provide written estimates and get approval for additional work.' },
    ],
    commonIssues: [
      'Undisclosed prior damage or accidents',
      'Odometer rollback fraud',
      'Warranty claim denied',
      'Persistent mechanical problems',
      'Unauthorized repair charges',
    ],
    actionSteps: [
      'Get vehicle history reports before buying',
      'Keep all repair records and receipts',
      'Document recurring problems thoroughly',
      'Send written lemon law notice to manufacturer',
      'Consult state attorney general for dealer fraud',
    ],
  },
  {
    categoryId: 'healthcare',
    title: 'Medical Billing & Healthcare Rights',
    subtitle: 'Navigating medical bills and insurance denials',
    introduction: 'Patients have rights to understand their medical bills, dispute errors, and appeal insurance denials. Healthcare pricing transparency laws and surprise billing protections provide additional safeguards.',
    keyRights: [
      { title: 'Itemized Bill Access', description: 'You can request detailed, itemized bills showing every charge.' },
      { title: 'Right to Dispute Errors', description: 'Billing errors must be investigated and corrected.' },
      { title: 'Insurance Appeal Rights', description: 'You can appeal denied claims through internal and external review.' },
      { title: 'Surprise Billing Protection', description: 'Protections limit unexpected out-of-network charges in emergency situations.' },
    ],
    commonIssues: [
      'Unexplained medical charges',
      'Balance billing for emergency care',
      'Insurance claim denials',
      'Medical debt collection harassment',
      'Coding errors on bills',
    ],
    actionSteps: [
      'Request itemized bills for every service',
      'Compare charges to explanation of benefits (EOB)',
      'Appeal insurance denials in writing',
      'Ask about financial assistance programs',
      'Negotiate payment plans before involving collections',
    ],
  },
  {
    categoryId: 'employment',
    title: 'Employee Rights in the Workplace',
    subtitle: 'Protections for wages, safety, and fair treatment',
    introduction: 'Employees have fundamental rights regarding wages, working conditions, and protection from discrimination. Understanding these rights helps you address workplace issues effectively.',
    keyRights: [
      { title: 'Right to Earned Wages', description: 'Employers must pay all earned wages on time, including overtime.' },
      { title: 'Safe Working Conditions', description: 'Employers must provide a workplace free from recognized hazards.' },
      { title: 'Protection from Discrimination', description: 'Employment decisions cannot be based on protected characteristics.' },
      { title: 'Whistleblower Protection', description: 'Employees are protected from retaliation for reporting violations.' },
    ],
    commonIssues: [
      'Unpaid wages or overtime',
      'Wrongful termination',
      'Workplace harassment or discrimination',
      'Unsafe working conditions',
      'Misclassification as independent contractor',
    ],
    actionSteps: [
      'Keep records of hours worked and pay received',
      'Document all incidents in writing with dates',
      'Report safety violations to OSHA',
      'File wage claims with labor department',
      'Consider EEOC complaint for discrimination',
    ],
  },
  {
    categoryId: 'ecommerce',
    title: 'Online Shopping Rights',
    subtitle: 'Protections for digital purchases',
    introduction: 'Online shoppers have specific protections including cooling-off periods, delivery guarantees, and privacy rights. Platform policies provide additional remedies through buyer protection programs.',
    keyRights: [
      { title: 'Cooling-Off Period', description: 'You can return most online purchases within 14-30 days for any reason.' },
      { title: 'Delivery Guarantees', description: 'Items must arrive within stated timeframes or you\'re entitled to cancel.' },
      { title: 'Data Privacy Rights', description: 'Companies must protect your personal data and disclose how it\'s used.' },
      { title: 'Platform Buyer Protection', description: 'Marketplace platforms offer additional dispute resolution and refund programs.' },
    ],
    commonIssues: [
      'Item never delivered',
      'Product significantly different from listing',
      'Seller unresponsive to complaints',
      'Subscription difficult to cancel',
      'Unauthorized data sharing',
    ],
    actionSteps: [
      'Screenshot product listings before purchasing',
      'Track all deliveries',
      'Use platform dispute resolution first',
      'Pay with credit card for chargeback rights',
      'Report scam sellers to platform and FTC',
    ],
  },
  {
    categoryId: 'hoa',
    title: 'Homeowner Association Rights',
    subtitle: 'Understanding HOA rules and owner protections',
    introduction: 'Homeowners in associations have rights to fair treatment, transparency in governance, and due process before fines or enforcement. State laws provide baseline protections.',
    keyRights: [
      { title: 'Access to Records', description: 'Homeowners can inspect HOA financial records and meeting minutes.' },
      { title: 'Due Process for Violations', description: 'HOAs must provide notice and hearing before imposing fines.' },
      { title: 'Voting Rights', description: 'Members have the right to vote on major decisions and board elections.' },
      { title: 'Fair Enforcement', description: 'Rules must be applied consistently to all homeowners.' },
    ],
    commonIssues: [
      'Arbitrary fine assessments',
      'Selective enforcement of rules',
      'Special assessments without proper vote',
      'Board transparency issues',
      'Neighbor disputes escalated to HOA',
    ],
    actionSteps: [
      'Review your CC&Rs and bylaws thoroughly',
      'Attend board meetings regularly',
      'Request records access in writing',
      'Challenge fines through proper procedures',
      'Consider mediation for neighbor disputes',
    ],
  },
  {
    categoryId: 'contractors',
    title: 'Home Improvement Contract Rights',
    subtitle: 'Protections when hiring contractors',
    introduction: 'Homeowners hiring contractors have rights to written contracts, proper licensing verification, and quality workmanship. Many states require specific disclosures and provide remedies for poor work.',
    keyRights: [
      { title: 'Written Contract Requirement', description: 'Contractors must provide detailed written contracts for significant projects.' },
      { title: 'License Verification', description: 'You can verify contractor licenses and check complaint histories.' },
      { title: 'Mechanic\'s Lien Notice', description: 'Contractors must provide preliminary notices before placing liens.' },
      { title: 'Right to Withhold Final Payment', description: 'You can withhold payment for incomplete or defective work.' },
    ],
    commonIssues: [
      'Substandard or incomplete work',
      'Project abandonment',
      'Cost overruns without authorization',
      'Unlicensed contractor problems',
      'Damage to property during work',
    ],
    actionSteps: [
      'Verify licenses before hiring',
      'Get detailed written contracts',
      'Document all work with photos',
      'Never pay in full upfront',
      'File complaints with contractor licensing board',
    ],
    importantDeadlines: [
      '3-day right to cancel home solicitation contracts',
      'Statute of limitations for construction defects (varies by state)',
      'Prompt notice to contractor of defects',
    ],
  },
];

export function getGuideByCategory(categoryId: string): CategoryGuide | undefined {
  return consumerRightsGuides.find(g => g.categoryId === categoryId);
}
