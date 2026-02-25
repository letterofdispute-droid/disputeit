/**
 * LEGAL KNOWLEDGE DATABASE
 * ========================
 * 
 * Comprehensive statute and regulatory information by category and jurisdiction.
 * Used by AI letter generation to cite specific laws and escalation paths.
 * 
 * IMPORTANT: This database contains factual legal references only.
 * The AI uses this to ground its output in real statutes.
 */

export interface Statute {
  name: string;
  citation: string;
  relevantSections?: string[];
  consumerRights: string[];
  typicalViolations: string[];
}

export interface Agency {
  name: string;
  abbreviation: string;
  website: string;
  complaintUrl?: string;
  jurisdiction: 'federal' | 'state' | 'local';
}

export interface TimeframeRule {
  context: string;
  days: number;
  source: string;
}

export interface JurisdictionLegalInfo {
  federalStatutes: Statute[];
  stateStatuteNotes?: string;
  regulatoryAgencies: Agency[];
  timeframes: TimeframeRule[];
  escalationPaths: string[];
}

export interface CategoryLegalKnowledge {
  category: string;
  categoryId: string;
  description: string;
  jurisdictions: {
    US: JurisdictionLegalInfo;
    UK?: Partial<JurisdictionLegalInfo>;
    EU?: Partial<JurisdictionLegalInfo>;
  };
}

/**
 * Master legal knowledge database organized by category
 */
export const legalKnowledgeDatabase: CategoryLegalKnowledge[] = [
  // ============================================================
  // CREDIT & DEBT DISPUTES
  // ============================================================
  {
    category: 'Credit Disputes',
    categoryId: 'financial',
    description: 'Credit reporting errors, identity theft, debt collection harassment',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Fair Credit Reporting Act',
            citation: '15 U.S.C. § 1681',
            relevantSections: ['§ 1681i - Procedure for disputed information', '§ 1681s-2 - Furnisher responsibilities'],
            consumerRights: [
              'Right to dispute inaccurate information',
              'Right to free annual credit report',
              'Right to know who accessed your report',
              'Right to sue for willful or negligent violations'
            ],
            typicalViolations: [
              'Failure to investigate dispute within 30 days',
              'Reinserting deleted information without notice',
              'Reporting obsolete negative information',
              'Mixing files of consumers with similar names'
            ]
          },
          {
            name: 'Fair Debt Collection Practices Act',
            citation: '15 U.S.C. § 1692',
            relevantSections: ['§ 1692c - Communication practices', '§ 1692d - Harassment', '§ 1692e - False representations', '§ 1692g - Validation of debts'],
            consumerRights: [
              'Right to request debt validation within 30 days',
              'Right to cease communication',
              'Right to sue for statutory damages up to $1,000',
              'Right to be free from harassment'
            ],
            typicalViolations: [
              'Calling before 8am or after 9pm',
              'Threatening arrest or legal action they cannot take',
              'Contacting third parties about the debt',
              'Failing to validate debt upon request'
            ]
          },
          {
            name: 'Fair and Accurate Credit Transactions Act',
            citation: '15 U.S.C. § 1681c-1 (FACTA)',
            consumerRights: [
              'Right to place fraud alerts',
              'Right to security freezes',
              'Right to one free report annually from each bureau'
            ],
            typicalViolations: [
              'Failure to place fraud alert within 1 business day',
              'Improper truncation of credit card numbers'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'Consumer Financial Protection Bureau',
            abbreviation: 'CFPB',
            website: 'https://www.consumerfinance.gov',
            complaintUrl: 'https://www.consumerfinance.gov/complaint/',
            jurisdiction: 'federal'
          },
          {
            name: 'Federal Trade Commission',
            abbreviation: 'FTC',
            website: 'https://www.ftc.gov',
            complaintUrl: 'https://reportfraud.ftc.gov',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Credit bureau investigation', days: 30, source: 'FCRA § 1681i(a)(1)' },
          { context: 'Furnisher response to dispute', days: 30, source: 'FCRA § 1681s-2(b)' },
          { context: 'Debt validation request window', days: 30, source: 'FDCPA § 1692g(b)' },
          { context: 'Fraud alert placement', days: 1, source: 'FACTA' }
        ],
        escalationPaths: [
          'File complaint with CFPB (companies must respond within 15 days)',
          'Report to FTC for pattern documentation',
          'File complaint with State Attorney General',
          'Pursue private legal action under FCRA (statutory damages $100-$1,000 per violation)'
        ]
      }
    }
  },

  // ============================================================
  // INSURANCE CLAIMS
  // ============================================================
  {
    category: 'Insurance Claims',
    categoryId: 'insurance',
    description: 'Claim denials, delays, bad faith practices',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'McCarran-Ferguson Act',
            citation: '15 U.S.C. §§ 1011-1015',
            consumerRights: [
              'Insurance primarily regulated at state level',
              'State unfair claims practices acts apply'
            ],
            typicalViolations: []
          }
        ],
        stateStatuteNotes: 'Each state has its own Insurance Code and Unfair Claims Settlement Practices Act. Common provisions include: prompt investigation (15-30 days), written denial explanations, good faith claim handling.',
        regulatoryAgencies: [
          {
            name: 'State Department of Insurance',
            abbreviation: 'DOI',
            website: 'https://content.naic.org/state-insurance-regulators',
            jurisdiction: 'state'
          },
          {
            name: 'National Association of Insurance Commissioners',
            abbreviation: 'NAIC',
            website: 'https://www.naic.org',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Acknowledge claim receipt (typical state requirement)', days: 15, source: 'Model Unfair Claims Settlement Practices Act' },
          { context: 'Affirm or deny claim (typical)', days: 30, source: 'State Insurance Codes' },
          { context: 'Respond to supplemental information', days: 15, source: 'State Insurance Codes' }
        ],
        escalationPaths: [
          'File complaint with State Department of Insurance',
          'Request internal appeal (required before external review for health insurance)',
          'File for external/independent review',
          'Pursue bad faith claim in court (may recover statutory damages + attorney fees)'
        ]
      }
    }
  },

  // ============================================================
  // VEHICLE & AUTO
  // ============================================================
  {
    category: 'Vehicle & Auto',
    categoryId: 'vehicle',
    description: 'Lemon law claims, dealer fraud, warranty disputes, repair issues',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Magnuson-Moss Warranty Act',
            citation: '15 U.S.C. §§ 2301-2312',
            relevantSections: ['§ 2304 - Federal minimum warranty standards', '§ 2310 - Remedies'],
            consumerRights: [
              'Right to choose between repair, replacement, or refund for major defects',
              'Right to sue in federal court for warranty violations',
              'Right to recover attorney fees if successful'
            ],
            typicalViolations: [
              'Voiding warranty for using third-party parts',
              'Failure to provide warranty terms in simple language',
              'Refusing repair within reasonable time'
            ]
          },
          {
            name: 'FTC Used Car Rule',
            citation: '16 CFR Part 455',
            consumerRights: [
              'Right to Buyers Guide disclosure on used vehicles',
              'Right to written warranty terms',
              'Right to know if sold "as is"'
            ],
            typicalViolations: [
              'Failure to display Buyers Guide',
              'Misrepresenting warranty coverage',
              'Deceptive "as is" disclosures'
            ]
          }
        ],
        stateStatuteNotes: 'All 50 states have Lemon Laws for new vehicles. Requirements vary but typically require 3-4 repair attempts or 30+ days out of service within warranty period. Some states include used vehicles.',
        regulatoryAgencies: [
          {
            name: 'Federal Trade Commission',
            abbreviation: 'FTC',
            website: 'https://www.ftc.gov',
            complaintUrl: 'https://reportfraud.ftc.gov',
            jurisdiction: 'federal'
          },
          {
            name: 'National Highway Traffic Safety Administration',
            abbreviation: 'NHTSA',
            website: 'https://www.nhtsa.gov',
            complaintUrl: 'https://www.nhtsa.gov/report-a-safety-problem',
            jurisdiction: 'federal'
          },
          {
            name: 'State Attorney General Consumer Protection Division',
            abbreviation: 'AG',
            website: 'https://www.naag.org/find-my-ag/',
            jurisdiction: 'state'
          }
        ],
        timeframes: [
          { context: 'Lemon law buyback demand response (typical)', days: 30, source: 'State Lemon Laws' },
          { context: 'Warranty repair completion (reasonable time)', days: 30, source: 'Magnuson-Moss' },
          { context: 'Written warranty claim response', days: 15, source: 'Industry standard' }
        ],
        escalationPaths: [
          'Invoke manufacturer dispute resolution program (if available)',
          'File complaint with State Attorney General',
          'Report safety defects to NHTSA',
          'Pursue Lemon Law arbitration or litigation',
          'File Magnuson-Moss claim in federal court'
        ]
      }
    }
  },

  // ============================================================
  // HOUSING & LANDLORD
  // ============================================================
  {
    category: 'Housing & Landlord',
    categoryId: 'housing',
    description: 'Repairs, security deposits, lease disputes, habitability issues',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Fair Housing Act',
            citation: '42 U.S.C. §§ 3601-3619',
            consumerRights: [
              'Right to be free from discrimination based on protected classes',
              'Right to reasonable accommodations for disabilities',
              'Right to file HUD complaint'
            ],
            typicalViolations: [
              'Discriminatory advertising',
              'Refusing reasonable accommodations',
              'Different terms based on protected class'
            ]
          }
        ],
        stateStatuteNotes: 'Landlord-tenant law is primarily state/local. Key protections include: implied warranty of habitability, security deposit limits (typically 1-2 months), repair-and-deduct remedies, anti-retaliation protections.',
        regulatoryAgencies: [
          {
            name: 'Department of Housing and Urban Development',
            abbreviation: 'HUD',
            website: 'https://www.hud.gov',
            complaintUrl: 'https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint',
            jurisdiction: 'federal'
          },
          {
            name: 'State/Local Housing Authority',
            abbreviation: 'LHA',
            website: 'Varies by location',
            jurisdiction: 'local'
          }
        ],
        timeframes: [
          { context: 'Security deposit return (typical state requirement)', days: 30, source: 'State Landlord-Tenant Laws' },
          { context: 'Emergency repair (health/safety)', days: 3, source: 'Implied warranty of habitability' },
          { context: 'Non-emergency repair after written notice', days: 14, source: 'State Landlord-Tenant Laws' }
        ],
        escalationPaths: [
          'Send written repair demand via certified mail',
          'File complaint with local housing authority or code enforcement',
          'Invoke repair-and-deduct (where permitted by state law)',
          'Pursue constructive eviction claim',
          'File small claims for security deposit recovery (2-3x damages in some states)',
          'File HUD complaint for discrimination'
        ]
      }
    }
  },

  // ============================================================
  // REFUNDS & PURCHASES
  // ============================================================
  {
    category: 'Refunds & Purchases',
    categoryId: 'refunds',
    description: 'Retail complaints, service refunds, billing disputes',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'FTC Act Section 5',
            citation: '15 U.S.C. § 45',
            consumerRights: [
              'Right to be free from unfair or deceptive practices',
              'Right to file FTC complaint'
            ],
            typicalViolations: [
              'False advertising',
              'Bait and switch tactics',
              'Failure to honor advertised prices'
            ]
          },
          {
            name: 'Fair Credit Billing Act',
            citation: '15 U.S.C. § 1666',
            relevantSections: ['§ 1666 - Billing error resolution'],
            consumerRights: [
              'Right to dispute billing errors within 60 days',
              'Right to withhold payment during dispute',
              'Creditor must respond within 30 days'
            ],
            typicalViolations: [
              'Failure to acknowledge billing dispute',
              'Reporting disputed amount as delinquent',
              'Not crediting payments properly'
            ]
          },
          {
            name: 'Mail, Internet, or Telephone Order Merchandise Rule',
            citation: '16 CFR Part 435',
            consumerRights: [
              'Right to receive goods within stated timeframe or 30 days',
              'Right to cancel for delay',
              'Right to prompt refund for cancelled orders'
            ],
            typicalViolations: [
              'Failure to ship within 30 days without notice',
              'Delay in processing refunds',
              'Not offering cancellation for delays'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'Federal Trade Commission',
            abbreviation: 'FTC',
            website: 'https://www.ftc.gov',
            complaintUrl: 'https://reportfraud.ftc.gov',
            jurisdiction: 'federal'
          },
          {
            name: 'Better Business Bureau',
            abbreviation: 'BBB',
            website: 'https://www.bbb.org',
            jurisdiction: 'local'
          },
          {
            name: 'State Attorney General Consumer Protection',
            abbreviation: 'AG',
            website: 'https://www.naag.org/find-my-ag/',
            jurisdiction: 'state'
          }
        ],
        timeframes: [
          { context: 'Billing error acknowledgment', days: 30, source: 'FCBA' },
          { context: 'Billing error resolution', days: 90, source: 'FCBA' },
          { context: 'Online order shipment (if no timeframe stated)', days: 30, source: 'FTC Mail Order Rule' },
          { context: 'Refund processing', days: 7, source: 'FTC guidance' }
        ],
        escalationPaths: [
          'Dispute charge with credit card issuer (chargeback)',
          'File complaint with FTC',
          'Report to State Attorney General',
          'File BBB complaint',
          'Pursue small claims court'
        ]
      }
    }
  },

  // ============================================================
  // TRAVEL & TRANSPORTATION
  // ============================================================
  {
    category: 'Travel & Transportation',
    categoryId: 'travel',
    description: 'Flight delays, cancellations, lost baggage, booking issues',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Airline Deregulation Act / DOT Regulations',
            citation: '49 U.S.C. § 41712; 14 CFR Part 259',
            consumerRights: [
              'Right to prompt refund for cancelled flights (7 days for credit card)',
              'Right to compensation for involuntary denied boarding',
              'Right to tarmac delay protocols',
              'Right to baggage fee refund if bag lost'
            ],
            typicalViolations: [
              'Refusal to refund cancelled flight',
              'Inadequate denied boarding compensation',
              'Holding passengers on tarmac over 3 hours',
              'Not returning baggage fees for delayed bags'
            ]
          }
        ],
        stateStatuteNotes: 'Federal law preempts most state regulation of airlines. However, some hotel/rental car issues may be covered by state consumer protection laws.',
        regulatoryAgencies: [
          {
            name: 'Department of Transportation Aviation Consumer Protection',
            abbreviation: 'DOT',
            website: 'https://www.transportation.gov/airconsumer',
            complaintUrl: 'https://www.transportation.gov/airconsumer/file-consumer-complaint',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Flight cancellation refund (credit card)', days: 7, source: '14 CFR § 259.5' },
          { context: 'Flight cancellation refund (cash/check)', days: 20, source: '14 CFR § 259.5' },
          { context: 'Baggage delay claim filing', days: 21, source: 'Montreal Convention' }
        ],
        escalationPaths: [
          'File formal complaint with DOT Aviation Consumer Protection',
          'Dispute charge with credit card issuer',
          'Pursue small claims for incidental expenses',
          'For international flights: invoke Montreal Convention'
        ]
      },
      EU: {
        federalStatutes: [
          {
            name: 'EU Regulation 261/2004',
            citation: 'EC 261/2004',
            consumerRights: [
              'Right to €250-€600 compensation for delays 3+ hours',
              'Right to meals/accommodation during long delays',
              'Right to refund or rerouting for cancellations',
              'Right to care during delays (meals, communication)'
            ],
            typicalViolations: [
              'Refusing compensation citing "extraordinary circumstances"',
              'Not providing care during delays',
              'Offering only vouchers instead of cash refund'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'National Enforcement Bodies (varies by country)',
            abbreviation: 'NEB',
            website: 'https://transport.ec.europa.eu/transport-themes/passenger-rights/national-enforcement-bodies_en',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Refund processing', days: 7, source: 'EU 261/2004 Article 8' }
        ],
        escalationPaths: [
          'File complaint with airline',
          'Escalate to National Enforcement Body',
          'Use European Consumer Centre for cross-border issues',
          'Pursue claim in European Small Claims Procedure'
        ]
      }
    }
  },

  // ============================================================
  // UTILITIES & TELECOMMUNICATIONS
  // ============================================================
  {
    category: 'Utilities & Telecommunications',
    categoryId: 'utilities',
    description: 'Billing disputes, service issues, contract problems',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Telecommunications Act',
            citation: '47 U.S.C. § 151 et seq.',
            consumerRights: [
              'Right to accurate billing',
              'Right to contract disclosure',
              'Right to service as advertised'
            ],
            typicalViolations: [
              'Cramming (unauthorized charges)',
              'Slamming (unauthorized service changes)',
              'Failure to disclose fees'
            ]
          },
          {
            name: 'Truth in Billing Rules',
            citation: '47 CFR § 64.2401',
            consumerRights: [
              'Right to clear, non-misleading bills',
              'Right to itemized charges'
            ],
            typicalViolations: [
              'Unclear fee descriptions',
              'Hidden charges'
            ]
          }
        ],
        stateStatuteNotes: 'State Public Utility Commissions regulate energy and water utilities. Telecommunications may be regulated at federal (FCC) and state levels.',
        regulatoryAgencies: [
          {
            name: 'Federal Communications Commission',
            abbreviation: 'FCC',
            website: 'https://www.fcc.gov',
            complaintUrl: 'https://consumercomplaints.fcc.gov',
            jurisdiction: 'federal'
          },
          {
            name: 'State Public Utility Commission',
            abbreviation: 'PUC',
            website: 'https://www.naruc.org/about-naruc/regulatory-commissions/',
            jurisdiction: 'state'
          }
        ],
        timeframes: [
          { context: 'Billing dispute response (typical)', days: 30, source: 'Industry standard' },
          { context: 'Service restoration after payment', days: 2, source: 'State PUC rules' }
        ],
        escalationPaths: [
          'File informal complaint with FCC (for telecom)',
          'File complaint with State Public Utility Commission',
          'Escalate to State Attorney General',
          'Invoke arbitration clause (review contract)'
        ]
      }
    }
  },

  // ============================================================
  // EMPLOYMENT & WORKPLACE
  // ============================================================
  {
    category: 'Employment & Workplace',
    categoryId: 'employment',
    description: 'Wages, discrimination, termination, workplace safety',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Fair Labor Standards Act',
            citation: '29 U.S.C. § 201 et seq.',
            relevantSections: ['§ 206 - Minimum wage', '§ 207 - Overtime'],
            consumerRights: [
              'Right to minimum wage',
              'Right to overtime pay (1.5x for 40+ hours)',
              'Right to file wage complaint',
              'Right to recover back pay + liquidated damages'
            ],
            typicalViolations: [
              'Misclassifying employees as exempt',
              'Not paying overtime',
              'Off-the-clock work requirements',
              'Tip credit violations'
            ]
          },
          {
            name: 'Title VII of the Civil Rights Act',
            citation: '42 U.S.C. § 2000e',
            consumerRights: [
              'Right to be free from discrimination based on race, color, religion, sex, national origin',
              'Right to file EEOC charge within 180-300 days',
              'Right to reasonable accommodations (religious)'
            ],
            typicalViolations: [
              'Discriminatory hiring/firing',
              'Hostile work environment',
              'Retaliation for complaints'
            ]
          },
          {
            name: 'Americans with Disabilities Act',
            citation: '42 U.S.C. § 12101 et seq.',
            consumerRights: [
              'Right to reasonable accommodations',
              'Right to be free from disability discrimination',
              'Right to file EEOC charge'
            ],
            typicalViolations: [
              'Failure to provide reasonable accommodations',
              'Discrimination based on disability',
              'Medical inquiry violations'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'Department of Labor Wage and Hour Division',
            abbreviation: 'DOL-WHD',
            website: 'https://www.dol.gov/agencies/whd',
            complaintUrl: 'https://www.dol.gov/agencies/whd/contact/complaints',
            jurisdiction: 'federal'
          },
          {
            name: 'Equal Employment Opportunity Commission',
            abbreviation: 'EEOC',
            website: 'https://www.eeoc.gov',
            complaintUrl: 'https://www.eeoc.gov/how-file-charge-employment-discrimination',
            jurisdiction: 'federal'
          },
          {
            name: 'Occupational Safety and Health Administration',
            abbreviation: 'OSHA',
            website: 'https://www.osha.gov',
            complaintUrl: 'https://www.osha.gov/workers/file-complaint',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Final paycheck (varies by state)', days: 14, source: 'State labor laws' },
          { context: 'EEOC charge filing deadline', days: 180, source: 'Title VII (300 with state agency)' },
          { context: 'FLSA back pay recovery', days: 730, source: 'FLSA (3 years for willful)' }
        ],
        escalationPaths: [
          'File wage complaint with DOL Wage and Hour Division',
          'File EEOC charge for discrimination',
          'File OSHA complaint for safety violations',
          'Contact State Labor Department',
          'Pursue private legal action (FLSA allows attorney fee recovery)'
        ]
      }
    }
  },

  // ============================================================
  // HEALTHCARE & MEDICAL BILLING
  // ============================================================
  {
    category: 'Healthcare & Medical Billing',
    categoryId: 'healthcare',
    description: 'Medical bills, insurance denials, coding errors, provider complaints',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'No Surprises Act',
            citation: 'Pub. L. 116-260, Division BB',
            consumerRights: [
              'Right to be free from surprise balance bills for emergency services',
              'Right to good faith cost estimate before service',
              'Right to dispute unexpected charges'
            ],
            typicalViolations: [
              'Balance billing for out-of-network emergency care',
              'Failure to provide good faith estimates to uninsured',
              'Surprise bills from out-of-network providers at in-network facilities'
            ]
          },
          {
            name: 'HIPAA',
            citation: '42 U.S.C. § 1320d et seq.',
            consumerRights: [
              'Right to access medical records',
              'Right to request corrections',
              'Right to file privacy complaints'
            ],
            typicalViolations: [
              'Unauthorized disclosure of medical information',
              'Denial of records access',
              'Failure to provide records within 30 days'
            ]
          },
          {
            name: 'Fair Debt Collection Practices Act (Medical Debt)',
            citation: '15 U.S.C. § 1692',
            consumerRights: [
              'Right to dispute medical debt',
              'Right to validation',
              'Protection from harassment'
            ],
            typicalViolations: [
              'Reporting medical debt to credit bureaus before 365 days',
              'Failure to provide itemized bills',
              'Harassment over medical debt'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'Centers for Medicare & Medicaid Services',
            abbreviation: 'CMS',
            website: 'https://www.cms.gov',
            jurisdiction: 'federal'
          },
          {
            name: 'State Department of Insurance',
            abbreviation: 'DOI',
            website: 'https://content.naic.org/state-insurance-regulators',
            jurisdiction: 'state'
          },
          {
            name: 'Office for Civil Rights (HIPAA)',
            abbreviation: 'OCR',
            website: 'https://www.hhs.gov/ocr',
            complaintUrl: 'https://www.hhs.gov/ocr/complaints/index.html',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Request itemized bill', days: 30, source: 'Best practice' },
          { context: 'Dispute surprise bill', days: 30, source: 'No Surprises Act' },
          { context: 'Appeal insurance denial (first level)', days: 60, source: 'ACA appeals process' }
        ],
        escalationPaths: [
          'Request itemized bill and verify CPT codes',
          'File internal appeal with insurance',
          'Request external review (guaranteed right under ACA)',
          'File complaint with State Insurance Commissioner',
          'Report No Surprises Act violations to CMS',
          'File HIPAA complaint with OCR'
        ]
      }
    }
  },

  // ============================================================
  // E-COMMERCE & ONLINE SERVICES
  // ============================================================
  {
    category: 'E-commerce & Online Services',
    categoryId: 'ecommerce',
    description: 'Marketplace disputes, digital purchases, subscription issues',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Electronic Fund Transfer Act',
            citation: '15 U.S.C. § 1693 et seq.',
            consumerRights: [
              'Right to dispute unauthorized electronic transactions',
              'Limited liability for unauthorized use ($50 if reported within 2 days)',
              'Right to error resolution within 45 days'
            ],
            typicalViolations: [
              'Not investigating dispute promptly',
              'Improper provisional credit procedures'
            ]
          },
          {
            name: 'Restore Online Shoppers Confidence Act',
            citation: '15 U.S.C. § 8401 et seq.',
            consumerRights: [
              'Right to clear disclosure of subscription terms',
              'Right to simple cancellation mechanism'
            ],
            typicalViolations: [
              'Negative option marketing (automatic subscriptions)',
              'Hidden cancellation procedures',
              'Post-transaction third-party charges'
            ]
          },
          {
            name: 'FTC Rule on Negative Option Marketing',
            citation: '16 CFR Part 425',
            consumerRights: [
              'Right to clear disclosure of offer terms',
              'Right to informed consent before charges'
            ],
            typicalViolations: [
              'Pre-checked subscription boxes',
              'Difficult cancellation processes'
            ]
          }
        ],
        regulatoryAgencies: [
          {
            name: 'Federal Trade Commission',
            abbreviation: 'FTC',
            website: 'https://www.ftc.gov',
            complaintUrl: 'https://reportfraud.ftc.gov',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Report unauthorized charge (EFT)', days: 60, source: 'EFTA' },
          { context: 'Financial institution investigation', days: 45, source: 'EFTA Reg E' }
        ],
        escalationPaths: [
          'Dispute with credit card (chargeback)',
          'File complaint with FTC',
          'Report to State Attorney General',
          'File BBB complaint',
          'Use platform dispute resolution (eBay, Amazon, etc.)'
        ]
      }
    }
  },

  // ============================================================
  // HOA & NEIGHBOR DISPUTES
  // ============================================================
  {
    category: 'HOA & Neighbor Disputes',
    categoryId: 'hoa',
    description: 'Fee disputes, rule enforcement, governance issues',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Fair Housing Act (applies to HOAs)',
            citation: '42 U.S.C. §§ 3601-3619',
            consumerRights: [
              'Right to be free from discriminatory enforcement',
              'Right to reasonable accommodations for disabilities'
            ],
            typicalViolations: [
              'Selective rule enforcement',
              'Denying reasonable accommodation requests'
            ]
          }
        ],
        stateStatuteNotes: 'HOA governance is primarily state-regulated. Many states have HOA Acts requiring: open board meetings, financial disclosure, dispute resolution procedures, and limitations on fines. Check state-specific laws (e.g., California Davis-Stirling Act, Florida HOA Act).',
        regulatoryAgencies: [
          {
            name: 'State Real Estate Division',
            abbreviation: 'DRE',
            website: 'Varies by state',
            jurisdiction: 'state'
          }
        ],
        timeframes: [
          { context: 'Fine appeal (typical CC&R requirement)', days: 30, source: 'CC&Rs / State law' },
          { context: 'Board response to written request', days: 30, source: 'State HOA Acts' }
        ],
        escalationPaths: [
          'Request formal hearing (required by most state HOA acts)',
          'Demand access to HOA records (homeowner right)',
          'File complaint with State Real Estate Division',
          'Pursue mediation/arbitration (often required before litigation)',
          'Small claims for improper fines or assessments',
          'File HUD complaint for discriminatory enforcement'
        ]
      }
    }
  },

  // ============================================================
  // CONTRACTORS & HOME IMPROVEMENT
  // ============================================================
  {
    category: 'Contractors & Home Improvement',
    categoryId: 'contractors',
    description: 'Poor workmanship, project abandonment, licensing issues',
    jurisdictions: {
      US: {
        federalStatutes: [],
        stateStatuteNotes: 'Contractor licensing and home improvement are regulated at the state level. Common protections include: contractor license bond requirements, home improvement contract requirements (written contracts, 3-day rescission right for certain sales), lien waiver requirements, and trust fund violations for misuse of payments.',
        regulatoryAgencies: [
          {
            name: 'State Contractor Licensing Board',
            abbreviation: 'CSLB',
            website: 'Varies by state',
            jurisdiction: 'state'
          },
          {
            name: 'State Attorney General Consumer Protection',
            abbreviation: 'AG',
            website: 'https://www.naag.org/find-my-ag/',
            jurisdiction: 'state'
          },
          {
            name: 'Better Business Bureau',
            abbreviation: 'BBB',
            website: 'https://www.bbb.org',
            jurisdiction: 'local'
          }
        ],
        timeframes: [
          { context: 'Home improvement contract rescission (door-to-door)', days: 3, source: 'FTC Cooling-Off Rule' },
          { context: 'Warranty claim (home improvements)', days: 365, source: 'State implied warranty' },
          { context: 'Mechanics lien filing deadline', days: 90, source: 'State lien laws (varies)' }
        ],
        escalationPaths: [
          'Send written cure demand via certified mail',
          'File complaint with State Contractor Licensing Board',
          'File bond claim against contractor license bond',
          'Report unlicensed work to licensing board',
          'File complaint with State Attorney General',
          'Pursue small claims or civil litigation',
          'Consider mechanics lien if subcontractor not paid'
        ]
      }
    }
  },

  // ============================================================
  // DAMAGED & DEFECTIVE GOODS
  // ============================================================
  {
    category: 'Damaged & Defective Goods',
    categoryId: 'damaged-goods',
    description: 'Defective products, shipping damage, warranty claims',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Magnuson-Moss Warranty Act',
            citation: '15 U.S.C. §§ 2301-2312',
            consumerRights: [
              'Right to clear warranty terms',
              'Right to repair, replacement, or refund for defects',
              'Right to sue for breach of warranty'
            ],
            typicalViolations: [
              'Voiding warranty for third-party repairs',
              'Deceptive warranty disclaimers',
              'Failure to honor written warranty'
            ]
          },
          {
            name: 'Consumer Product Safety Act',
            citation: '15 U.S.C. § 2051 et seq.',
            consumerRights: [
              'Right to safe products',
              'Right to report unsafe products',
              'Right to recall information'
            ],
            typicalViolations: [
              'Failing to report known hazards',
              'Selling recalled products'
            ]
          }
        ],
        stateStatuteNotes: 'UCC implied warranties (merchantability, fitness for purpose) apply to goods sales. State consumer protection acts provide additional remedies, often with treble damages.',
        regulatoryAgencies: [
          {
            name: 'Consumer Product Safety Commission',
            abbreviation: 'CPSC',
            website: 'https://www.cpsc.gov',
            complaintUrl: 'https://www.saferproducts.gov',
            jurisdiction: 'federal'
          },
          {
            name: 'Federal Trade Commission',
            abbreviation: 'FTC',
            website: 'https://www.ftc.gov',
            jurisdiction: 'federal'
          }
        ],
        timeframes: [
          { context: 'Reject defective goods (reasonable inspection)', days: 30, source: 'UCC § 2-602' },
          { context: 'Warranty claim response', days: 30, source: 'Industry standard' },
          { context: 'Product safety report response', days: 15, source: 'CPSC guidelines' }
        ],
        escalationPaths: [
          'Return/reject within reasonable time',
          'Demand cure from seller',
          'File chargeback with credit card',
          'Report unsafe products to CPSC',
          'File FTC complaint',
          'Pursue small claims for breach of warranty'
        ]
      }
    }
  },

  // ============================================================
  // REAL ESTATE & MORTGAGES
  // ============================================================
  {
    category: 'Real Estate & Mortgages',
    categoryId: 'mortgage',
    description: 'Mortgage servicing disputes, escrow errors, PMI removal, foreclosure defense, closing cost disputes',
    jurisdictions: {
      US: {
        federalStatutes: [
          {
            name: 'Real Estate Settlement Procedures Act',
            citation: '12 U.S.C. § 2601 (RESPA)',
            relevantSections: ['§ 2605 - Servicing of mortgage loans', '§ 2607 - Anti-kickback provisions', '§ 2609 - Escrow accounts'],
            consumerRights: [
              'Right to send Qualified Written Request (QWR) and receive response',
              'Right to accurate escrow accounting',
              'Right to be free from kickbacks and referral fees',
              'Right to Good Faith Estimate of settlement costs'
            ],
            typicalViolations: [
              'Failure to respond to QWR within 30 business days',
              'Misapplication of mortgage payments',
              'Excessive escrow cushion (over 2 months)',
              'Force-placed insurance without proper notice'
            ]
          },
          {
            name: 'Truth in Lending Act',
            citation: '15 U.S.C. § 1601 (TILA)',
            relevantSections: ['§ 1635 - Right of rescission', '§ 1639c - Minimum standards for mortgages'],
            consumerRights: [
              'Right to accurate disclosure of loan terms (APR, finance charges)',
              'Right to rescind certain transactions within 3 business days',
              'Right to sue for TILA violations'
            ],
            typicalViolations: [
              'Inaccurate APR disclosure',
              'Failure to provide required disclosures',
              'Improper denial of rescission rights'
            ]
          },
          {
            name: 'Homeowners Protection Act',
            citation: '12 U.S.C. § 4901 (HPA)',
            consumerRights: [
              'Right to request PMI cancellation at 80% LTV',
              'Right to automatic PMI termination at 78% LTV',
              'Right to final termination at amortization midpoint'
            ],
            typicalViolations: [
              'Failure to cancel PMI at 80% LTV upon request',
              'Failure to automatically terminate PMI at 78% LTV',
              'Imposing unreasonable conditions for PMI cancellation'
            ]
          },
          {
            name: 'Dodd-Frank Act - Mortgage Servicing Rules',
            citation: 'Pub. L. 111-203; 12 CFR Part 1024 (Regulation X)',
            consumerRights: [
              'Protection from dual tracking during loss mitigation review',
              'Right to complete loss mitigation evaluation',
              'Right to appeal modification denial',
              'Successor-in-interest notification rights'
            ],
            typicalViolations: [
              'Dual tracking (foreclosing while reviewing modification)',
              'Failure to evaluate for all available loss mitigation options',
              'Proceeding with foreclosure sale within 37 days of complete application'
            ]
          }
        ],
        stateStatuteNotes: 'Most states have additional foreclosure protections including judicial vs. non-judicial procedures, redemption periods, and mandatory mediation programs. Some states require loss mitigation conferences before foreclosure.',
        regulatoryAgencies: [
          {
            name: 'Consumer Financial Protection Bureau',
            abbreviation: 'CFPB',
            website: 'https://www.consumerfinance.gov',
            complaintUrl: 'https://www.consumerfinance.gov/complaint/',
            jurisdiction: 'federal'
          },
          {
            name: 'Department of Housing and Urban Development',
            abbreviation: 'HUD',
            website: 'https://www.hud.gov',
            complaintUrl: 'https://www.hud.gov/program_offices/housing/sfh/res/consfaq',
            jurisdiction: 'federal'
          },
          {
            name: 'State Banking/Financial Services Regulator',
            abbreviation: 'DFS',
            website: 'Varies by state',
            jurisdiction: 'state'
          }
        ],
        timeframes: [
          { context: 'Servicer acknowledgment of QWR', days: 5, source: 'RESPA § 2605(e)' },
          { context: 'Servicer substantive response to QWR', days: 30, source: 'RESPA § 2605(e)' },
          { context: 'PMI cancellation response', days: 30, source: 'HPA' },
          { context: 'Loss mitigation application review', days: 30, source: 'Regulation X § 1024.41' },
          { context: 'Notice before force-placing insurance', days: 45, source: 'Regulation X § 1024.37' }
        ],
        escalationPaths: [
          'Send Qualified Written Request (QWR) via certified mail',
          'File complaint with CFPB (companies must respond within 15 days)',
          'Contact HUD-approved housing counselor',
          'File complaint with State Banking Regulator',
          'Pursue RESPA/TILA litigation (actual damages, statutory damages, attorney fees)'
        ]
      }
    }
  }
];

/**
 * Get legal knowledge for a specific category
 */
export function getLegalKnowledgeByCategory(categoryId: string): CategoryLegalKnowledge | undefined {
  return legalKnowledgeDatabase.find(k => k.categoryId === categoryId);
}

/**
 * Get all statutes applicable to a category and jurisdiction
 */
export function getStatutesForCategory(categoryId: string, jurisdiction: 'US' | 'UK' | 'EU' = 'US'): Statute[] {
  const knowledge = getLegalKnowledgeByCategory(categoryId);
  if (!knowledge) return [];
  
  const jurisdictionInfo = knowledge.jurisdictions[jurisdiction];
  return jurisdictionInfo?.federalStatutes || [];
}

/**
 * Get regulatory agencies for a category
 */
export function getAgenciesForCategory(categoryId: string, jurisdiction: 'US' | 'UK' | 'EU' = 'US'): Agency[] {
  const knowledge = getLegalKnowledgeByCategory(categoryId);
  if (!knowledge) return [];
  
  const jurisdictionInfo = knowledge.jurisdictions[jurisdiction];
  return jurisdictionInfo?.regulatoryAgencies || [];
}

/**
 * Get escalation paths for a category
 */
export function getEscalationPaths(categoryId: string, jurisdiction: 'US' | 'UK' | 'EU' = 'US'): string[] {
  const knowledge = getLegalKnowledgeByCategory(categoryId);
  if (!knowledge) return [];
  
  const jurisdictionInfo = knowledge.jurisdictions[jurisdiction];
  return jurisdictionInfo?.escalationPaths || [];
}

/**
 * Get timeframe rules for a category
 */
export function getTimeframes(categoryId: string, jurisdiction: 'US' | 'UK' | 'EU' = 'US'): TimeframeRule[] {
  const knowledge = getLegalKnowledgeByCategory(categoryId);
  if (!knowledge) return [];
  
  const jurisdictionInfo = knowledge.jurisdictions[jurisdiction];
  return jurisdictionInfo?.timeframes || [];
}

/**
 * Format statute citation for letter
 */
export function formatStatuteCitation(statute: Statute): string {
  return `${statute.name} (${statute.citation})`;
}

/**
 * Get all escalation agencies formatted for letter
 */
export function formatEscalationAgencies(categoryId: string, jurisdiction: 'US' | 'UK' | 'EU' = 'US'): string {
  const agencies = getAgenciesForCategory(categoryId, jurisdiction);
  return agencies.map(a => `${a.name} (${a.abbreviation})`).join(', ');
}
