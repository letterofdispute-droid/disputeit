// ============= Category Knowledge Base =============
// Domain expertise for AI-powered form assistance

export interface CategoryRegulation {
  name: string;
  description: string;
  jurisdiction: string;
  keyPoints?: string[];
}

export interface EvidenceRequirement {
  item: string;
  importance: 'essential' | 'recommended' | 'helpful';
  tip?: string;
}

export interface CommonDenialReason {
  reason: string;
  howToCounter: string;
}

export interface SubcategoryKnowledge {
  regulations?: CategoryRegulation[];
  requiredEvidence: EvidenceRequirement[];
  commonDenialReasons?: CommonDenialReason[];
  successTips: string[];
  typicalTimeline?: string;
  escalationPath?: string[];
}

export interface CategoryKnowledgeEntry {
  description: string;
  subcategories: Record<string, SubcategoryKnowledge>;
  generalTips: string[];
  regulatoryBodies?: { name: string; jurisdiction: string; website?: string }[];
}

// ============= Complete Category Knowledge =============

export const categoryKnowledge: Record<string, CategoryKnowledgeEntry> = {
  // ============= TRAVEL =============
  Travel: {
    description: 'Flight delays, cancellations, lost baggage, and travel service disputes',
    generalTips: [
      'Document everything with photos and keep all receipts',
      'Note times, dates, and names of airline staff you speak with',
      'Check if your travel insurance covers the situation',
      'Submit claims within the airline\'s deadline (usually 7-21 days)',
    ],
    regulatoryBodies: [
      { name: 'US Department of Transportation (DOT)', jurisdiction: 'US', website: 'https://www.transportation.gov' },
      { name: 'Federal Aviation Administration (FAA)', jurisdiction: 'US', website: 'https://www.faa.gov' },
      { name: 'UK Civil Aviation Authority (CAA)', jurisdiction: 'UK', website: 'https://www.caa.co.uk' },
      { name: 'European Consumer Centre', jurisdiction: 'EU', website: 'https://ec.europa.eu/consumers' },
    ],
    subcategories: {
      'Flight Delays & Cancellations': {
        regulations: [
          {
            name: 'EU261/2004',
            description: 'EU regulation for flight delays, cancellations, and denied boarding',
            jurisdiction: 'EU',
            keyPoints: [
              'Applies to all flights departing from EU airports',
              'Applies to EU carrier flights arriving in EU',
              'Compensation: €250 (short), €400 (medium), €600 (long haul)',
              'Delay threshold: 3+ hours at final destination',
              'Cancelled flights: compensation + choice of refund or re-routing',
            ],
          },
          {
            name: 'Montreal Convention',
            description: 'International treaty governing airline liability',
            jurisdiction: 'International',
            keyPoints: [
              'Covers delays, baggage, and passenger injury',
              'Maximum liability limits apply',
              'Applies to international flights between signatory countries',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Booking confirmation', importance: 'essential', tip: 'Screenshot or PDF of original booking' },
          { item: 'Boarding pass(es)', importance: 'essential', tip: 'Keep both outbound and return if applicable' },
          { item: 'Delay/cancellation notification', importance: 'essential', tip: 'Screenshot airline app or email notification' },
          { item: 'Expense receipts', importance: 'recommended', tip: 'Meals, transport, accommodation if stranded' },
          { item: 'Flight tracking data', importance: 'helpful', tip: 'Screenshot from FlightAware or similar showing actual times' },
        ],
        commonDenialReasons: [
          { reason: 'Extraordinary circumstances (weather)', howToCounter: 'Check if other airlines operated normally. Weather rarely affects all flights.' },
          { reason: 'Technical issues beyond control', howToCounter: 'Most technical issues are NOT extraordinary circumstances per ECJ rulings.' },
          { reason: 'Claim submitted too late', howToCounter: 'EU261 claims valid for 6 years (UK) or 2-3 years (most EU countries).' },
        ],
        successTips: [
          'Calculate your exact compensation using flight distance',
          'Include the specific delay duration at your final destination',
          'Mention if you were not offered care (meals, accommodation) during delay',
          'Reference specific EU261 articles for stronger claims',
        ],
        typicalTimeline: '4-8 weeks for initial response, up to 6 months if escalated',
        escalationPath: ['Airline customer service', 'Department of Transportation complaint', 'Credit card chargeback', 'Small claims court'],
      },
      'Lost/Delayed Baggage': {
        regulations: [
          {
            name: 'Montreal Convention',
            description: 'Sets liability limits for lost/delayed baggage',
            jurisdiction: 'International',
            keyPoints: [
              'Maximum liability ~1,288 SDR (~€1,500) for checked bags',
              'Applies to international flights',
              'Report within 7 days (damage) or 21 days (delay)',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'PIR (Property Irregularity Report)', importance: 'essential', tip: 'Get this at the airport before leaving' },
          { item: 'Bag tags/receipts', importance: 'essential', tip: 'The sticker attached to your boarding pass' },
          { item: 'Contents list with values', importance: 'essential', tip: 'Be thorough - include clothing, toiletries, everything' },
          { item: 'Receipts for essentials purchased', importance: 'essential', tip: 'Keep all receipts for items bought while waiting' },
          { item: 'Original purchase receipts for valuables', importance: 'recommended', tip: 'Helps prove value of expensive items' },
          { item: 'WorldTracer reference', importance: 'recommended', tip: 'Online tracking reference for your bag' },
        ],
        commonDenialReasons: [
          { reason: 'Claim exceeds liability limit', howToCounter: 'Check if you declared excess value at check-in. Travel insurance may cover the rest.' },
          { reason: 'Items not proven', howToCounter: 'Provide photos of items if possible, or credit card statements showing purchases.' },
          { reason: 'Filed too late', howToCounter: 'You have 21 days from bag delivery to report issues. Keep proof of when bag arrived.' },
        ],
        successTips: [
          'Report missing baggage BEFORE leaving the airport',
          'Get written confirmation with a reference number',
          'Keep all receipts for replacement essentials',
          'Follow up within 48 hours if no update received',
        ],
        typicalTimeline: '3-7 days for delayed bags, 21+ days before considered lost',
        escalationPath: ['Airline baggage services', 'Airline customer relations', 'Travel insurance', 'Small claims court'],
      },
    },
  },

  // ============= INSURANCE =============
  Insurance: {
    description: 'Insurance claim disputes for auto, home, health, life, and travel policies',
    generalTips: [
      'Always read your policy document thoroughly before filing',
      'Document damage immediately with dated photos and videos',
      'Keep copies of all correspondence with your insurer',
      'Note the names of everyone you speak with and when',
    ],
    regulatoryBodies: [
      { name: 'State Insurance Commissioner', jurisdiction: 'US' },
      { name: 'National Association of Insurance Commissioners (NAIC)', jurisdiction: 'US', website: 'https://www.naic.org' },
      { name: 'Financial Ombudsman Service', jurisdiction: 'UK', website: 'https://www.financial-ombudsman.org.uk' },
      { name: 'EIOPA', jurisdiction: 'EU' },
    ],
    subcategories: {
      'Auto Insurance': {
        requiredEvidence: [
          { item: 'Policy document', importance: 'essential', tip: 'Specifically the declarations page showing coverages' },
          { item: 'Police report', importance: 'essential', tip: 'Required for accidents, theft, vandalism' },
          { item: 'Photos of damage', importance: 'essential', tip: 'Take from multiple angles, include VIN plate' },
          { item: 'Repair estimates', importance: 'essential', tip: 'Get 2-3 quotes from licensed repair shops' },
          { item: 'Dashcam footage', importance: 'helpful', tip: 'If available, can prove fault clearly' },
          { item: 'Witness contact information', importance: 'recommended', tip: 'Names and phone numbers of any witnesses' },
        ],
        commonDenialReasons: [
          { reason: 'Pre-existing damage', howToCounter: 'Provide dated photos showing vehicle condition before incident.' },
          { reason: 'Excluded driver', howToCounter: 'Review policy - some allow occasional drivers not listed.' },
          { reason: 'Coverage lapsed', howToCounter: 'Check payment records and grace period terms in your policy.' },
          { reason: 'Failure to report timely', howToCounter: 'Most policies allow "reasonable" time - document any delays.' },
        ],
        successTips: [
          'Report accidents within 24-48 hours',
          'Never admit fault at the scene',
          'Get independent repair estimates, not just insurer\'s preferred shop',
          'Document diminished value if applicable',
        ],
        typicalTimeline: '2-4 weeks for straightforward claims, 1-3 months for disputed claims',
        escalationPath: ['Claims adjuster', 'Claims supervisor', 'Internal appeals', 'State insurance department', 'Legal action'],
      },
      'Home Insurance': {
        requiredEvidence: [
          { item: 'Policy document', importance: 'essential', tip: 'Know your coverage limits and deductibles' },
          { item: 'Photos/videos of damage', importance: 'essential', tip: 'Before AND during cleanup if possible' },
          { item: 'Home inventory list', importance: 'essential', tip: 'List all damaged/lost items with values' },
          { item: 'Contractor repair estimates', importance: 'essential', tip: 'Get multiple written quotes' },
          { item: 'Receipts for damaged items', importance: 'recommended', tip: 'Helps prove replacement value' },
          { item: 'Proof of temporary living expenses', importance: 'helpful', tip: 'If displaced, keep all receipts' },
        ],
        commonDenialReasons: [
          { reason: 'Flood damage (not covered)', howToCounter: 'Review cause - water damage from burst pipes IS usually covered.' },
          { reason: 'Maintenance issue', howToCounter: 'Distinguish between sudden damage and gradual wear.' },
          { reason: 'Underinsurance', howToCounter: 'Review policy limits and consider invoking replacement cost coverage.' },
        ],
        successTips: [
          'Don\'t throw away damaged items until adjuster has seen them',
          'Make temporary repairs to prevent further damage (document these)',
          'Keep receipts for ALL expenses related to the claim',
          'Consider hiring a public adjuster for large claims',
        ],
        typicalTimeline: '30-60 days for claim decision, longer for complex claims',
      },
      'Health Insurance': {
        requiredEvidence: [
          { item: 'Explanation of Benefits (EOB)', importance: 'essential', tip: 'Shows what was billed and denied' },
          { item: 'Itemized medical bills', importance: 'essential', tip: 'Request from provider if not received' },
          { item: 'Medical records', importance: 'essential', tip: 'Supports medical necessity' },
          { item: 'Prior authorization (if obtained)', importance: 'essential', tip: 'Proof you followed procedures' },
          { item: 'Letter of medical necessity from doctor', importance: 'recommended', tip: 'Critical for experimental/specialized treatments' },
        ],
        commonDenialReasons: [
          { reason: 'Not medically necessary', howToCounter: 'Get detailed letter from physician explaining necessity.' },
          { reason: 'Out of network', howToCounter: 'Check if emergency exception applies or if no in-network option exists.' },
          { reason: 'Prior authorization not obtained', howToCounter: 'Document if emergency or if insurer delayed authorization.' },
          { reason: 'Experimental treatment', howToCounter: 'Provide clinical studies and physician recommendations.' },
        ],
        successTips: [
          'Appeal EVERY denial - many are reversed on appeal',
          'Request an external review if internal appeal fails',
          'Ask your doctor to call the insurer\'s medical director',
          'Check if your state has consumer assistance programs',
        ],
        typicalTimeline: 'Internal appeal: 30-60 days. External review: 45 days.',
        escalationPath: ['Internal appeal', 'Second-level appeal', 'External review', 'State insurance commissioner'],
      },
    },
  },

  // ============= HOUSING =============
  Housing: {
    description: 'Landlord disputes, repairs, deposits, evictions, and tenant rights',
    generalTips: [
      'Always communicate in writing (email or letter) for a paper trail',
      'Take dated photos when you move in and out',
      'Know your local tenant rights - they vary by location',
      'Keep copies of your lease and all amendments',
    ],
    regulatoryBodies: [
      { name: 'Local Housing Authority', jurisdiction: 'US' },
      { name: 'HUD (Department of Housing and Urban Development)', jurisdiction: 'US', website: 'https://www.hud.gov' },
      { name: 'Housing Ombudsman', jurisdiction: 'UK' },
      { name: 'Tenancy Deposit Scheme', jurisdiction: 'UK' },
    ],
    subcategories: {
      'Repairs & Maintenance': {
        regulations: [
          {
            name: 'Implied Warranty of Habitability',
            description: 'US doctrine requiring livable conditions',
            jurisdiction: 'US',
            keyPoints: [
              'Property must be fit for human habitation',
              'Includes working plumbing, heating, electricity',
              'Tenants may have rent withholding rights if violated',
              'Varies by state - some require written notice first',
            ],
          },
          {
            name: 'Landlord and Tenant Act 1985',
            description: 'Sets landlord repair obligations in UK',
            jurisdiction: 'UK',
            keyPoints: [
              'Landlord must keep structure and exterior in repair',
              'Must maintain heating, water, and sanitation',
              'Must respond in reasonable time once notified',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Written repair requests (dated)', importance: 'essential', tip: 'Email creates automatic timestamp' },
          { item: 'Photos/videos of the issue', importance: 'essential', tip: 'Include date stamps if possible' },
          { item: 'Tenancy agreement', importance: 'essential', tip: 'Shows landlord\'s obligations' },
          { item: 'Records of previous reports', importance: 'recommended', tip: 'Proves pattern of neglect' },
          { item: 'Expert assessment', importance: 'helpful', tip: 'For serious issues like damp or structural problems' },
        ],
        commonDenialReasons: [
          { reason: 'Tenant caused damage', howToCounter: 'Document condition at move-in and any witnesses.' },
          { reason: 'Not landlord responsibility', howToCounter: 'Check lease and statutory obligations carefully.' },
          { reason: 'Not notified properly', howToCounter: 'Provide dated copies of all notifications.' },
        ],
        successTips: [
          'Report issues in writing immediately',
          'Allow reasonable time for repairs (usually 14-28 days for non-urgent)',
          'For urgent issues (no heating in winter), expect faster response',
          'Document impact on your health or daily life',
        ],
        typicalTimeline: 'Urgent repairs: 24-48 hours. Non-urgent: 14-28 days.',
        escalationPath: ['Written request to landlord', 'Local code enforcement', 'State tenant rights organization', 'Housing authority', 'Small claims court'],
      },
      'Deposit Disputes': {
        requiredEvidence: [
          { item: 'Tenancy agreement', importance: 'essential', tip: 'Shows deposit amount and terms' },
          { item: 'Deposit protection certificate', importance: 'essential', tip: 'Required in UK for AST tenancies' },
          { item: 'Inventory at move-in', importance: 'essential', tip: 'Signed by both parties ideally' },
          { item: 'Check-out inventory', importance: 'essential', tip: 'Document condition when leaving' },
          { item: 'Photos at move-in AND move-out', importance: 'essential', tip: 'Side-by-side comparisons are powerful' },
          { item: 'Cleaning receipts', importance: 'recommended', tip: 'Proof you left property clean' },
        ],
        successTips: [
          'Check your deposit is protected within 30 days of payment (UK)',
          'Conduct thorough check-in inventory with photos',
          'Clean professionally before moving out',
          'Request itemized deduction list if any money withheld',
        ],
        escalationPath: ['Negotiate with landlord', 'Deposit scheme dispute resolution', 'Small claims court'],
      },
    },
  },

  // ============= CONTRACTORS =============
  Contractors: {
    description: 'Construction, renovation, and home improvement disputes',
    generalTips: [
      'Always get written contracts before work begins',
      'Never pay more than 10-30% upfront',
      'Document work progress with photos',
      'Get multiple quotes for comparison',
    ],
    subcategories: {
      'Poor Workmanship': {
        requiredEvidence: [
          { item: 'Written contract/quote', importance: 'essential', tip: 'Shows agreed scope and standards' },
          { item: 'Photos of defects', importance: 'essential', tip: 'Before any remediation attempts' },
          { item: 'Payment records', importance: 'essential', tip: 'Shows what you\'ve already paid' },
          { item: 'Independent expert assessment', importance: 'recommended', tip: 'Another contractor\'s written opinion' },
          { item: 'Communications with contractor', importance: 'recommended', tip: 'Emails, texts about the issues' },
          { item: 'Rectification quotes', importance: 'recommended', tip: 'Cost to fix the problems' },
        ],
        commonDenialReasons: [
          { reason: 'Work meets acceptable standards', howToCounter: 'Get independent expert opinion on building code compliance.' },
          { reason: 'You approved the work', howToCounter: 'Final payment doesn\'t waive claims for hidden defects.' },
          { reason: 'Outside warranty period', howToCounter: 'Check consumer protection laws - may extend beyond warranty.' },
        ],
        successTips: [
          'Don\'t make final payment until work is inspected',
          'Get defects in writing before the contractor leaves',
          'Check if contractor is licensed and insured',
          'Consider mediation before legal action',
        ],
        escalationPath: ['Direct negotiation', 'State contractor licensing board', 'Better Business Bureau', 'Mediation', 'Small claims court'],
      },
      'Abandoned Work': {
        requiredEvidence: [
          { item: 'Contract with timeline', importance: 'essential' },
          { item: 'Payment records', importance: 'essential' },
          { item: 'Photos of incomplete work', importance: 'essential' },
          { item: 'Communications requesting completion', importance: 'essential' },
          { item: 'Quotes to complete work', importance: 'recommended' },
        ],
        successTips: [
          'Send formal written notice demanding completion within 14 days',
          'Document the state of work when abandoned',
          'Get quotes from other contractors to complete',
          'Report to licensing board if applicable',
        ],
      },
    },
  },

  // ============= FINANCIAL =============
  Financial: {
    description: 'Banking, credit, debt collection, and financial service disputes',
    generalTips: [
      'Keep records of all transactions and statements',
      'Know your rights under consumer credit laws',
      'Report fraud immediately',
      'Check your credit report regularly',
    ],
    regulatoryBodies: [
      { name: 'Consumer Financial Protection Bureau', jurisdiction: 'US' },
      { name: 'Federal Trade Commission', jurisdiction: 'US' },
      { name: 'Financial Conduct Authority', jurisdiction: 'UK' },
      { name: 'Financial Ombudsman Service', jurisdiction: 'UK' },
    ],
    subcategories: {
      'Unauthorized Transactions': {
        regulations: [
          {
            name: 'Payment Services Regulations',
            description: 'UK rules on unauthorized payments',
            jurisdiction: 'UK',
            keyPoints: [
              'Banks must refund unauthorized transactions immediately',
              'Maximum liability £35-50 if you were grossly negligent',
              'Bank must prove you authorized or were negligent',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Bank statements showing transactions', importance: 'essential' },
          { item: 'Timeline of when you noticed fraud', importance: 'essential' },
          { item: 'Police report (for significant fraud)', importance: 'recommended' },
          { item: 'Any correspondence with merchant', importance: 'helpful' },
        ],
        successTips: [
          'Report unauthorized transactions within 13 months',
          'Check if card was used with PIN (may affect liability)',
          'Request provisional credit while investigation ongoing',
          'Keep your bank informed of any new information',
        ],
      },
      'Credit Report Errors': {
        regulations: [
          {
            name: 'Fair Credit Reporting Act (FCRA)',
            description: 'US law governing credit reporting accuracy',
            jurisdiction: 'US',
            keyPoints: [
              'Credit agencies must investigate disputes within 30 days',
              'Inaccurate information must be removed or corrected',
              'You can add a statement to your credit file',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Copy of credit report showing error', importance: 'essential' },
          { item: 'Documents proving correct information', importance: 'essential' },
          { item: 'Previous dispute correspondence', importance: 'recommended' },
        ],
        successTips: [
          'Dispute with all three credit bureaus separately',
          'Dispute directly with the data furnisher too',
          'Send disputes via certified mail for proof',
          'Follow up if no response within 30 days',
        ],
      },
      'Debt Collection': {
        regulations: [
          {
            name: 'Fair Debt Collection Practices Act (FDCPA)',
            description: 'US law limiting debt collector behavior',
            jurisdiction: 'US',
            keyPoints: [
              'Collectors cannot harass, threaten, or deceive',
              'Must validate debt within 5 days of contact',
              'Must stop contact if you request in writing',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Original credit agreement', importance: 'essential' },
          { item: 'Collection letters received', importance: 'essential' },
          { item: 'Record of collection calls', importance: 'recommended' },
          { item: 'Proof of payments made', importance: 'essential' },
        ],
        successTips: [
          'Request debt validation in writing within 30 days',
          'Check if debt is time-barred (statute of limitations)',
          'Never acknowledge old debt verbally - can restart clock',
          'Negotiate settlements in writing only',
        ],
      },
    },
  },

  // ============= HEALTHCARE =============
  Healthcare: {
    description: 'Medical billing, treatment disputes, and healthcare access issues',
    generalTips: [
      'Request itemized bills for all services',
      'Check for billing errors before paying',
      'Know your insurance coverage details',
      'Keep copies of all medical records',
    ],
    subcategories: {
      'Medical Billing Disputes': {
        requiredEvidence: [
          { item: 'Itemized bill', importance: 'essential', tip: 'Not just the summary statement' },
          { item: 'Explanation of Benefits (EOB)', importance: 'essential' },
          { item: 'Insurance policy details', importance: 'essential' },
          { item: 'Medical records for the service', importance: 'recommended' },
          { item: 'Written quotes if applicable', importance: 'helpful' },
        ],
        commonDenialReasons: [
          { reason: 'Service not covered', howToCounter: 'Review policy carefully - many "not covered" claims are errors.' },
          { reason: 'Out of network', howToCounter: 'Check if emergency exception applies.' },
          { reason: 'Already paid by insurance', howToCounter: 'Request coordination of benefits review.' },
        ],
        successTips: [
          'Check for duplicate charges',
          'Verify correct procedure codes were used',
          'Ask about charity care or payment plans',
          'Negotiate cash-pay rates if uninsured',
        ],
      },
    },
  },

  // ============= E-COMMERCE =============
  'E-commerce': {
    description: 'Online shopping disputes, delivery issues, and digital purchases',
    generalTips: [
      'Always pay by credit card for extra protection',
      'Screenshot prices and descriptions before ordering',
      'Check return policies before purchasing',
      'Keep all order confirmations and receipts',
    ],
    subcategories: {
      'Non-Delivery': {
        requiredEvidence: [
          { item: 'Order confirmation', importance: 'essential' },
          { item: 'Payment proof', importance: 'essential' },
          { item: 'Tracking information', importance: 'essential' },
          { item: 'Communication with seller', importance: 'recommended' },
        ],
        successTips: [
          'Contact seller first before initiating dispute',
          'Use platform dispute resolution if available',
          'Initiate chargeback within 120 days if needed',
          'Report seller to platform for pattern of non-delivery',
        ],
      },
      'Item Not as Described': {
        requiredEvidence: [
          { item: 'Original listing/description', importance: 'essential', tip: 'Screenshot before it changes' },
          { item: 'Photos of received item', importance: 'essential' },
          { item: 'Order confirmation', importance: 'essential' },
          { item: 'Size/measurement comparisons', importance: 'recommended' },
        ],
        successTips: [
          'Document differences clearly with photos',
          'Quote exact description from listing',
          'Request return if within return window',
          'Escalate to platform if seller unresponsive',
        ],
      },
    },
  },

  // ============= VEHICLE =============
  Vehicle: {
    description: 'Car purchases, repairs, warranties, and dealer disputes',
    generalTips: [
      'Get everything in writing before agreeing',
      'Research vehicle history before buying used',
      'Understand warranty terms completely',
      'Keep all service records',
    ],
    subcategories: {
      'Lemon Law': {
        requiredEvidence: [
          { item: 'Purchase contract', importance: 'essential' },
          { item: 'Repair orders/invoices', importance: 'essential', tip: 'Shows repair attempts' },
          { item: 'Warranty documents', importance: 'essential' },
          { item: 'Timeline of issues', importance: 'essential' },
          { item: 'Days out of service', importance: 'recommended' },
        ],
        successTips: [
          'Document each repair attempt in writing',
          'Note total days vehicle was unusable',
          'Keep records of rental car expenses',
          'Check your state\'s specific lemon law requirements',
        ],
      },
      'Repair Disputes': {
        requiredEvidence: [
          { item: 'Written estimate', importance: 'essential' },
          { item: 'Final invoice', importance: 'essential' },
          { item: 'Authorization for work', importance: 'essential' },
          { item: 'Photos before/after', importance: 'recommended' },
        ],
        successTips: [
          'Always get written estimate before authorizing work',
          'Shops must get approval for additional work',
          'Keep old parts if major repairs done',
          'Get second opinion for major repairs',
        ],
      },
    },
  },

  // ============= UTILITIES =============
  Utilities: {
    description: 'Energy, water, telecom, and utility service disputes',
    generalTips: [
      'Keep records of all meter readings',
      'Document outages with times and duration',
      'Know your contract end dates to avoid fees',
      'Compare prices regularly and switch if better deal available',
    ],
    regulatoryBodies: [
      { name: 'Federal Communications Commission (FCC)', jurisdiction: 'US', website: 'https://www.fcc.gov' },
      { name: 'State Public Utilities Commission', jurisdiction: 'US' },
      { name: 'Ofgem', jurisdiction: 'UK' },
      { name: 'Ofcom', jurisdiction: 'UK' },
      { name: 'Energy Ombudsman', jurisdiction: 'UK' },
    ],
    subcategories: {
      'Billing Disputes': {
        requiredEvidence: [
          { item: 'Bills showing disputed charges', importance: 'essential' },
          { item: 'Meter readings', importance: 'essential' },
          { item: 'Contract terms', importance: 'essential' },
          { item: 'Payment history', importance: 'recommended' },
        ],
        successTips: [
          'Submit meter readings regularly to avoid estimates',
          'Request bill recalculation if estimates seem high',
          'Check for account credits you may have missed',
          'Ask about hardship funds if struggling to pay',
        ],
      },
    },
  },

  // ============= HOA =============
  HOA: {
    description: 'Homeowners association disputes, fees, and governance issues',
    generalTips: [
      'Know your CC&Rs (Covenants, Conditions, and Restrictions)',
      'Attend HOA meetings when possible',
      'Request all communications in writing',
      'Review your rights in state HOA laws',
    ],
    subcategories: {
      'Fee Disputes': {
        requiredEvidence: [
          { item: 'CC&Rs and bylaws', importance: 'essential' },
          { item: 'Assessment notices', importance: 'essential' },
          { item: 'Payment history', importance: 'essential' },
          { item: 'Board meeting minutes', importance: 'recommended' },
        ],
        successTips: [
          'Check if special assessment followed proper procedures',
          'Request detailed breakdown of how fees are used',
          'Verify fee increases comply with CC&Rs limits',
          'Organize with other homeowners if issue is widespread',
        ],
      },
      'Violation Disputes': {
        requiredEvidence: [
          { item: 'Violation notice', importance: 'essential' },
          { item: 'CC&Rs section cited', importance: 'essential' },
          { item: 'Photos of alleged violation', importance: 'recommended' },
          { item: 'Photos showing compliance or context', importance: 'recommended' },
        ],
        successTips: [
          'Respond to violations in writing within deadline',
          'Request hearing before fines are assessed',
          'Document selective enforcement if applicable',
          'Check if rule was properly adopted',
        ],
      },
    },
  },

  // ============= EMPLOYMENT =============
  Employment: {
    description: 'Workplace disputes, wages, discrimination, and termination issues',
    generalTips: [
      'Document everything in writing',
      'Keep copies of your employment contract and handbook',
      'Know your statutory rights',
      'Seek legal advice for serious issues',
    ],
    regulatoryBodies: [
      { name: 'Equal Employment Opportunity Commission (EEOC)', jurisdiction: 'US', website: 'https://www.eeoc.gov' },
      { name: 'Department of Labor (DOL)', jurisdiction: 'US', website: 'https://www.dol.gov' },
      { name: 'National Labor Relations Board (NLRB)', jurisdiction: 'US', website: 'https://www.nlrb.gov' },
      { name: 'ACAS', jurisdiction: 'UK' },
      { name: 'Employment Tribunal', jurisdiction: 'UK' },
    ],
    subcategories: {
      'Unpaid Wages': {
        requiredEvidence: [
          { item: 'Employment contract', importance: 'essential' },
          { item: 'Pay stubs/records', importance: 'essential' },
          { item: 'Timesheets/work records', importance: 'essential' },
          { item: 'Bank statements', importance: 'recommended' },
          { item: 'Written requests for payment', importance: 'recommended' },
        ],
        successTips: [
          'Calculate exact amounts owed with dates',
          'Include any statutory interest if applicable',
          'Reference specific contract terms or legal requirements',
          'Set clear deadline for payment',
        ],
        escalationPath: ['Written request to employer', 'State labor department', 'Department of Labor Wage and Hour Division', 'EEOC (if discrimination)', 'Small claims court'],
      },
    },
  },

  // ============= REFUNDS =============
  Refunds: {
    description: 'Retail refunds, service cancellations, and consumer rights disputes',
    generalTips: [
      'Know the difference between store policies and legal rights',
      'Faulty goods have different rights than changed minds',
      'Keep receipts and packaging',
      'Pay by credit card for extra protection',
    ],
    subcategories: {
      'Faulty Goods': {
        regulations: [
          {
            name: 'Magnuson-Moss Warranty Act',
            description: 'US federal law governing warranties',
            jurisdiction: 'US',
            keyPoints: [
              'Requires clear disclosure of warranty terms',
              'Allows consumers to sue for breach of warranty',
              'Covers both express and implied warranties',
              'Attorney fees may be recoverable',
            ],
          },
          {
            name: 'State Consumer Protection Laws',
            description: 'State laws providing additional consumer protections',
            jurisdiction: 'US',
            keyPoints: [
              'Many states have implied warranty of merchantability',
              'Products must be fit for ordinary purpose',
              'Remedies vary by state',
            ],
          },
          {
            name: 'Consumer Rights Act 2015',
            description: 'UK law on goods quality and remedies',
            jurisdiction: 'UK',
            keyPoints: [
              'Goods must be of satisfactory quality',
              'Must be fit for purpose and as described',
              '30 days for full refund (short-term right to reject)',
              '6 months for repair/replacement/refund',
            ],
          },
        ],
        requiredEvidence: [
          { item: 'Proof of purchase', importance: 'essential' },
          { item: 'Photos/videos of fault', importance: 'essential' },
          { item: 'Product details', importance: 'essential' },
          { item: 'Expert report (for complex faults)', importance: 'helpful' },
        ],
        successTips: [
          'Report faults within 30 days for easiest refund',
          'Don\'t accept repair if you prefer refund (within 30 days)',
          'After 30 days, give one chance to repair/replace',
          'If repair fails, you can reject for refund',
        ],
      },
    },
  },

  // ============= DAMAGED GOODS =============
  'Damaged Goods': {
    description: 'Products damaged in transit, defective items, and quality issues',
    generalTips: [
      'Photograph damage before moving or opening items further',
      'Report damage immediately - don\'t wait',
      'Keep all packaging as evidence',
      'Note condition of packaging when delivered',
    ],
    subcategories: {
      'Delivery Damage': {
        requiredEvidence: [
          { item: 'Photos of damaged packaging', importance: 'essential' },
          { item: 'Photos of damaged item', importance: 'essential' },
          { item: 'Delivery confirmation', importance: 'essential' },
          { item: 'Order details', importance: 'essential' },
        ],
        successTips: [
          'Note damage on delivery receipt if possible',
          'Report to seller AND delivery company',
          'Don\'t refuse delivery unless obviously destroyed',
          'Keep packaging until claim resolved',
        ],
      },
    },
  },
};

// ============= Helper Functions =============

export function getCategoryKnowledge(category: string): CategoryKnowledgeEntry | undefined {
  return categoryKnowledge[category];
}

export function getSubcategoryKnowledge(category: string, subcategory: string): SubcategoryKnowledge | undefined {
  const cat = categoryKnowledge[category];
  if (!cat) return undefined;
  return cat.subcategories[subcategory];
}

export function getRequiredEvidence(category: string, subcategory?: string): EvidenceRequirement[] {
  if (subcategory) {
    const subKnowledge = getSubcategoryKnowledge(category, subcategory);
    if (subKnowledge) return subKnowledge.requiredEvidence;
  }
  
  // Return first subcategory's evidence if no match
  const cat = categoryKnowledge[category];
  if (cat && Object.keys(cat.subcategories).length > 0) {
    const firstSub = Object.values(cat.subcategories)[0];
    return firstSub.requiredEvidence;
  }
  
  return [];
}

export function getCategoryRegulations(category: string, subcategory?: string, jurisdiction?: string): CategoryRegulation[] {
  const subKnowledge = subcategory ? getSubcategoryKnowledge(category, subcategory) : undefined;
  if (!subKnowledge?.regulations) return [];
  
  if (jurisdiction) {
    return subKnowledge.regulations.filter(r => 
      r.jurisdiction === jurisdiction || r.jurisdiction === 'International'
    );
  }
  
  return subKnowledge.regulations;
}
