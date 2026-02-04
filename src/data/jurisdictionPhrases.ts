/**
 * Pre-approved Legal Phrases by Jurisdiction
 * 
 * These phrases are carefully crafted to be factually accurate and legally cautious.
 * They reference actual legislation without making guarantees or legal claims.
 * 
 * IMPORTANT: These phrases are the ONLY legal language the AI is permitted to use.
 * No AI-generated legal language is allowed.
 */

export interface JurisdictionPhrase {
  code: string;
  name: string;
  flagEmoji: string;
  categories: Record<string, JurisdictionCategoryPhrases>;
}

export interface JurisdictionCategoryPhrases {
  legalReference?: string;
  timeframes: {
    standard: string;
    urgent: string;
  };
  phrases: {
    neutral: string[];
    firm: string[];
    final: string[];
  };
  escalationPaths: string[];
}

export const jurisdictions: JurisdictionPhrase[] = [
  {
    code: 'US',
    name: 'United States',
    flagEmoji: '🇺🇸',
    categories: {
      consumer: {
        legalReference: 'FTC Act, state consumer protection laws',
        timeframes: {
          standard: '30 days',
          urgent: '10 days',
        },
        phrases: {
          neutral: [
            'I am writing to request a resolution regarding my purchase.',
            'Under applicable consumer protection laws, I believe I am entitled to a remedy.',
            'Please address this matter promptly.',
          ],
          firm: [
            'I am formally notifying you of this issue and requesting appropriate action.',
            'I expect this matter to be resolved in accordance with your stated policies and applicable law.',
            'Please provide a written response within a reasonable timeframe.',
          ],
          final: [
            'If this matter is not resolved within 30 days, I will consider filing a complaint with the appropriate agencies.',
            'I may file complaints with the FTC, state Attorney General, and/or Better Business Bureau.',
            'This is my final attempt to resolve this matter before pursuing external remedies.',
          ],
        },
        escalationPaths: [
          'Federal Trade Commission (FTC)',
          'State Attorney General Consumer Protection Division',
          'Better Business Bureau (BBB)',
          'Small Claims Court',
        ],
      },
      housing: {
        legalReference: 'Implied warranty of habitability, state landlord-tenant laws',
        timeframes: {
          standard: '14-30 days (varies by state)',
          urgent: '24-72 hours for emergencies',
        },
        phrases: {
          neutral: [
            'I am writing to request repairs at my rental property.',
            'Under the implied warranty of habitability, the property must be maintained in livable condition.',
            'Please arrange for these repairs to be completed.',
          ],
          firm: [
            'The current condition of the property may constitute a breach of habitability standards.',
            'I am formally documenting this repair request and the date of notice.',
            'Please confirm when repairs will be completed.',
          ],
          final: [
            'If repairs are not made within the legally required timeframe, I may exercise remedies available under state law.',
            'I may contact local housing authorities or pursue other remedies.',
            'This is formal written notice as may be required by law before pursuing further action.',
          ],
        },
        escalationPaths: [
          'Local housing authority / code enforcement',
          'State tenant rights organization',
          'Legal aid society',
          'Small Claims Court',
        ],
      },
      travel: {
        legalReference: 'DOT regulations, airline Contract of Carriage',
        timeframes: {
          standard: '60 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing regarding disruption to my flight.',
            'Please process my request for compensation or reimbursement.',
            'I am requesting a resolution in accordance with your policies.',
          ],
          firm: [
            'Under DOT regulations, airlines have certain obligations to passengers.',
            'I am formally requesting compensation for this disruption.',
            'Please respond to this claim within a reasonable timeframe.',
          ],
          final: [
            'If this matter is not resolved, I will file a complaint with the Department of Transportation.',
            'I may also pursue the matter through other available channels.',
            'This is my final attempt to resolve this matter directly with the airline.',
          ],
        },
        escalationPaths: [
          'Department of Transportation (DOT) consumer complaint',
          'Credit card chargeback',
          'Small Claims Court',
        ],
      },
      financial: {
        legalReference: 'Fair Credit Reporting Act (FCRA), Fair Debt Collection Practices Act (FDCPA)',
        timeframes: {
          standard: '30-45 days',
          urgent: '10 days for billing disputes',
        },
        phrases: {
          neutral: [
            'I am writing to dispute information on my account.',
            'Please investigate this matter and provide a response.',
            'I believe there may be an error that needs correction.',
          ],
          firm: [
            'Under the Fair Credit Reporting Act, I am entitled to accurate reporting.',
            'I am formally disputing this information and request investigation.',
            'Please provide written confirmation of the results of your investigation.',
          ],
          final: [
            'If this matter is not resolved, I will file complaints with the CFPB and FTC.',
            'I am prepared to pursue all remedies available under federal law.',
            'This serves as formal notice under applicable consumer protection statutes.',
          ],
        },
        escalationPaths: [
          'Consumer Financial Protection Bureau (CFPB)',
          'Federal Trade Commission (FTC)',
          'State Attorney General',
          'State banking regulator',
        ],
      },
      insurance: {
        legalReference: 'State insurance regulations',
        timeframes: {
          standard: '30-45 days (varies by state)',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to appeal the decision on my insurance claim.',
            'I believe this claim warrants reconsideration.',
            'Please review my claim with the additional information provided.',
          ],
          firm: [
            'I am formally disputing this claim denial.',
            'Please provide a detailed explanation of the basis for this decision.',
            'I request a complete review of my claim file.',
          ],
          final: [
            'If this matter is not resolved, I will file a complaint with the state insurance commissioner.',
            'I am prepared to pursue all available remedies.',
            'This is my final appeal before seeking external resolution.',
          ],
        },
        escalationPaths: [
          'State Insurance Commissioner / Department of Insurance',
          'State Attorney General',
          'Legal counsel for bad faith claims',
        ],
      },
      debtCollection: {
        legalReference: 'Fair Debt Collection Practices Act (FDCPA)',
        timeframes: {
          standard: '30 days for debt validation',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to request validation of this debt.',
            'Please provide documentation supporting this claim.',
            'I am exercising my rights under the FDCPA.',
          ],
          firm: [
            'Under the Fair Debt Collection Practices Act, I am entitled to debt validation.',
            'Please cease collection activities until validation is provided.',
            'I am formally disputing this debt.',
          ],
          final: [
            'If validation is not provided, I request that all collection activities cease.',
            'I will report FDCPA violations to the FTC and CFPB.',
            'This constitutes formal written notice under the FDCPA.',
          ],
        },
        escalationPaths: [
          'Consumer Financial Protection Bureau (CFPB)',
          'Federal Trade Commission (FTC)',
          'State Attorney General',
        ],
      },
    },
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flagEmoji: '🇬🇧',
    categories: {
      consumer: {
        legalReference: 'Consumer Rights Act 2015',
        timeframes: {
          standard: '14 days',
          urgent: '7 days',
        },
        phrases: {
          neutral: [
            'Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose, and as described.',
            'I am writing to request a resolution in accordance with my consumer rights.',
            'I understand that I may be entitled to a repair, replacement, or refund.',
          ],
          firm: [
            'The Consumer Rights Act 2015 provides that goods which do not meet the statutory standards may be rejected.',
            'I am formally notifying you of the breach and requesting an appropriate remedy.',
            'Should this matter remain unresolved, I reserve the right to pursue further action.',
          ],
          final: [
            'This is my final attempt to resolve this matter directly before escalating to external bodies.',
            'If I do not receive a satisfactory response within the timeframe specified, I will consider referring this matter to Trading Standards or pursuing the matter through the small claims court.',
            'I am providing you with a final opportunity to resolve this dispute.',
          ],
        },
        escalationPaths: [
          'Citizens Advice Consumer Service',
          'Trading Standards',
          'Small Claims Court (Money Claims Online)',
          'Alternative Dispute Resolution (ADR)',
        ],
      },
      housing: {
        legalReference: 'Landlord and Tenant Act 1985, Housing Act 2004',
        timeframes: {
          standard: '14-28 days',
          urgent: '24-48 hours for emergencies',
        },
        phrases: {
          neutral: [
            'I am writing to formally notify you of a repair issue at the property.',
            'Under your obligations as landlord, you have a responsibility to maintain the property in good repair.',
            'I request that you arrange for this matter to be addressed at your earliest convenience.',
          ],
          firm: [
            'The Landlord and Tenant Act 1985 requires landlords to keep the property in repair.',
            'The ongoing failure to address this issue may constitute a breach of the covenant to repair.',
            'I am formally documenting this request and the date on which notice was given.',
          ],
          final: [
            'If repairs are not completed within the specified timeframe, I may contact the local council Environmental Health department.',
            'I am aware that tenants may have remedies available including reporting to the local housing authority.',
            'This is a final request before I consider my options for external resolution.',
          ],
        },
        escalationPaths: [
          'Local Council Environmental Health',
          'Housing Ombudsman (social housing)',
          'First-tier Tribunal (Property Chamber)',
          'Shelter advice line',
        ],
      },
      travel: {
        legalReference: 'UK261 (retained EU Regulation 261/2004)',
        timeframes: {
          standard: '28 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to claim compensation under UK261 for flight disruption.',
            'Under the retained EU Regulation 261/2004, passengers may be entitled to compensation for delays and cancellations.',
            'Please process this claim in accordance with the applicable regulations.',
          ],
          firm: [
            'The flight disruption meets the criteria for compensation under UK261.',
            'I am formally requesting the statutory compensation amount.',
            'Please confirm receipt of this claim and provide a timeframe for resolution.',
          ],
          final: [
            'If this claim is not resolved within 28 days, I will escalate to the Civil Aviation Authority or relevant ADR scheme.',
            'This is my final attempt to resolve this matter before seeking external resolution.',
            'I reserve my right to pursue this claim through all available channels.',
          ],
        },
        escalationPaths: [
          'Civil Aviation Authority (CAA)',
          'Alternative Dispute Resolution (ADR)',
          'Small Claims Court',
        ],
      },
      financial: {
        legalReference: 'Financial Conduct Authority regulations',
        timeframes: {
          standard: '8 weeks',
          urgent: '15 days for payment issues',
        },
        phrases: {
          neutral: [
            'I am writing to dispute charges on my account.',
            'I believe there may have been an error and request a review.',
            'Please investigate this matter and provide a written response.',
          ],
          firm: [
            'I am formally raising a complaint under your complaints procedure.',
            'I request that you investigate this matter and provide a full written response.',
            'Please provide a final response within the required timeframe.',
          ],
          final: [
            'If I do not receive a satisfactory final response within 8 weeks, I will refer this complaint to the Financial Ombudsman Service.',
            'This is my final attempt to resolve this matter before escalating to the FOS.',
            'I am aware of my right to refer unresolved complaints to the Financial Ombudsman.',
          ],
        },
        escalationPaths: [
          'Financial Ombudsman Service (FOS)',
          'Financial Conduct Authority (report only)',
        ],
      },
      insurance: {
        legalReference: 'Insurance Act 2015, FCA Insurance Conduct of Business',
        timeframes: {
          standard: '8 weeks',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to appeal the decision on my insurance claim.',
            'I believe the claim was declined in error and request a review.',
            'Please reconsider this decision in light of the information provided.',
          ],
          firm: [
            'I am formally disputing the claim decision and request a full review.',
            'The reasons given for declining this claim do not appear consistent with my policy terms.',
            'I request a detailed written explanation of how this decision was reached.',
          ],
          final: [
            'If I do not receive a satisfactory response within 8 weeks, I will escalate to the Financial Ombudsman Service.',
            'This is a final request for reconsideration before seeking external resolution.',
            'I am prepared to pursue this matter through all available channels.',
          ],
        },
        escalationPaths: [
          'Financial Ombudsman Service (FOS)',
          'Insurance company internal appeals',
        ],
      },
    },
  },
  {
    code: 'EU',
    name: 'European Union',
    flagEmoji: '🇪🇺',
    categories: {
      consumer: {
        legalReference: 'Consumer Rights Directive 2011/83/EU, Consumer Sales Directive',
        timeframes: {
          standard: '14 days',
          urgent: '7 days',
        },
        phrases: {
          neutral: [
            'Under EU consumer protection regulations, I am entitled to goods that conform to the contract.',
            'I am exercising my consumer rights as provided under EU law.',
            'Please address this matter in accordance with applicable consumer protection standards.',
          ],
          firm: [
            'The Consumer Sales Directive provides remedies for goods that do not conform to the contract.',
            'I am formally notifying you of the non-conformity and requesting an appropriate remedy.',
            'I expect this matter to be resolved within the timeframe provided by law.',
          ],
          final: [
            'If this matter is not resolved, I will consider filing a complaint with the relevant consumer protection authority.',
            'I am prepared to use the European Consumer Centre network if necessary.',
            'This is my final attempt to resolve this matter amicably.',
          ],
        },
        escalationPaths: [
          'European Consumer Centre (ECC-Net)',
          'National consumer protection authority',
          'Online Dispute Resolution (ODR) platform',
        ],
      },
      housing: {
        timeframes: {
          standard: '30 days',
          urgent: '48-72 hours for emergencies',
        },
        phrases: {
          neutral: [
            'I am writing to request repairs to the rental property.',
            'As landlord, you have obligations to maintain the property in habitable condition.',
            'Please arrange for this matter to be addressed promptly.',
          ],
          firm: [
            'The ongoing disrepair affects the habitability of the property.',
            'I am formally documenting this repair request and the date of notification.',
            'Please confirm when repairs will be completed.',
          ],
          final: [
            'If repairs are not completed within the specified timeframe, I will consider my options under local law.',
            'I may seek assistance from local housing authorities or tenant protection organizations.',
            'This is a final request before pursuing external remedies.',
          ],
        },
        escalationPaths: [
          'Local tenant protection organization',
          'Municipal housing authority',
          'Civil courts',
        ],
      },
      travel: {
        legalReference: 'Regulation (EC) No 261/2004',
        timeframes: {
          standard: '28 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am claiming compensation under EU Regulation 261/2004 for flight disruption.',
            'Under EU air passenger rights, I may be entitled to compensation.',
            'Please process this claim in accordance with the applicable regulations.',
          ],
          firm: [
            'EU Regulation 261/2004 provides for fixed compensation amounts for qualifying delays and cancellations.',
            'This disruption meets the criteria for compensation under the regulation.',
            'I request prompt processing of this claim.',
          ],
          final: [
            'If this claim is not resolved within 6 weeks, I will escalate to the relevant National Enforcement Body.',
            'I am prepared to use the EU Online Dispute Resolution platform.',
            'This is my final attempt to resolve this matter before seeking external assistance.',
          ],
        },
        escalationPaths: [
          'National Enforcement Body (NEB)',
          'European Consumer Centre (ECC-Net)',
          'EU Online Dispute Resolution (ODR)',
        ],
      },
      financial: {
        legalReference: 'Payment Services Directive (PSD2)',
        timeframes: {
          standard: '15 business days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to dispute a transaction on my account.',
            'Please investigate this matter and provide a response.',
            'I believe there may have been an error requiring correction.',
          ],
          firm: [
            'I am formally raising a complaint regarding this matter.',
            'Please investigate and provide a written response within the required timeframe.',
            'I request a full explanation of how this situation will be resolved.',
          ],
          final: [
            'If not resolved satisfactorily, I will escalate to the relevant financial supervision authority.',
            'I am prepared to file a complaint with the appropriate regulatory body.',
            'This is my final attempt to resolve this matter directly.',
          ],
        },
        escalationPaths: [
          'National financial supervision authority',
          'European Consumer Centre (ECC-Net)',
        ],
      },
      insurance: {
        legalReference: 'Insurance Distribution Directive',
        timeframes: {
          standard: '30 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to appeal the decision regarding my insurance claim.',
            'I believe this matter warrants reconsideration.',
            'Please review my claim in light of the enclosed documentation.',
          ],
          firm: [
            'I am formally disputing this claim decision.',
            'Please provide a detailed explanation of the basis for this decision.',
            'I request a full review of my claim.',
          ],
          final: [
            'If this matter is not resolved, I will escalate to the insurance ombudsman or regulator.',
            'This is my final request before seeking external resolution.',
            'I reserve my rights to pursue all available remedies.',
          ],
        },
        escalationPaths: [
          'Insurance ombudsman (where available)',
          'National insurance supervision authority',
        ],
      },
    },
  },
  {
    code: 'INTL',
    name: 'International / Other',
    flagEmoji: '🌍',
    categories: {
      consumer: {
        timeframes: {
          standard: '30 days',
          urgent: '14 days',
        },
        phrases: {
          neutral: [
            'I am writing to request a resolution regarding my purchase.',
            'In accordance with applicable consumer protection standards, I believe I am entitled to a remedy.',
            'Please address this matter at your earliest convenience.',
          ],
          firm: [
            'I am formally requesting that you address this issue.',
            'I expect a response and resolution within a reasonable timeframe.',
            'Please confirm how you intend to resolve this matter.',
          ],
          final: [
            'If this matter is not resolved, I will consider pursuing further action through appropriate channels.',
            'This is my final attempt to resolve this matter directly.',
            'I reserve my rights to seek external resolution.',
          ],
        },
        escalationPaths: [
          'Local consumer protection agency',
          'Credit card chargeback',
          'Civil courts',
        ],
      },
      housing: {
        timeframes: {
          standard: '30 days',
          urgent: '48-72 hours for emergencies',
        },
        phrases: {
          neutral: [
            'I am writing to request repairs to the property.',
            'As landlord, you have responsibilities to maintain the property.',
            'Please arrange for these matters to be addressed.',
          ],
          firm: [
            'I am formally documenting this repair request.',
            'Please confirm when repairs will be completed.',
            'The current condition affects the habitability of the property.',
          ],
          final: [
            'If repairs are not completed, I will consider my options under local law.',
            'This is formal notice before seeking external assistance.',
            'I am prepared to pursue available remedies.',
          ],
        },
        escalationPaths: [
          'Local housing authority',
          'Tenant advocacy organization',
          'Civil courts',
        ],
      },
      travel: {
        timeframes: {
          standard: '30-60 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing regarding disruption to my travel arrangements.',
            'Please process my request for resolution.',
            'I am seeking an appropriate remedy for this situation.',
          ],
          firm: [
            'I am formally requesting compensation for this disruption.',
            'Please respond to this claim promptly.',
            'I expect this matter to be addressed.',
          ],
          final: [
            'If not resolved, I will pursue further action through available channels.',
            'This is my final attempt to resolve this matter directly.',
            'I reserve my rights to seek external resolution.',
          ],
        },
        escalationPaths: [
          'Credit card chargeback',
          'Local consumer protection agency',
          'Civil courts',
        ],
      },
      financial: {
        timeframes: {
          standard: '30 days',
          urgent: '15 days',
        },
        phrases: {
          neutral: [
            'I am writing to dispute this matter.',
            'Please investigate and provide a response.',
            'I believe there may be an error requiring correction.',
          ],
          firm: [
            'I am formally raising a complaint.',
            'Please investigate and respond in writing.',
            'I expect this matter to be addressed promptly.',
          ],
          final: [
            'If not resolved, I will escalate to the appropriate regulatory body.',
            'This is my final attempt to resolve this matter directly.',
            'I am prepared to pursue external remedies.',
          ],
        },
        escalationPaths: [
          'Financial regulatory authority',
          'Consumer protection agency',
        ],
      },
      insurance: {
        timeframes: {
          standard: '30 days',
          urgent: 'N/A',
        },
        phrases: {
          neutral: [
            'I am writing to appeal the decision on my claim.',
            'Please reconsider in light of the information provided.',
            'I request a review of this decision.',
          ],
          firm: [
            'I am formally disputing this claim decision.',
            'Please provide a detailed explanation.',
            'I request a full review.',
          ],
          final: [
            'If not resolved, I will escalate to the insurance regulator.',
            'This is my final request before external escalation.',
            'I reserve my rights to pursue all remedies.',
          ],
        },
        escalationPaths: [
          'Insurance regulatory authority',
          'Consumer protection agency',
        ],
      },
    },
  },
];

export function getJurisdictionByCode(code: string): JurisdictionPhrase | undefined {
  return jurisdictions.find(j => j.code === code);
}

export function getPhrasesForCategory(
  jurisdictionCode: string, 
  category: string, 
  tone: 'neutral' | 'firm' | 'final'
): string[] {
  const jurisdiction = getJurisdictionByCode(jurisdictionCode);
  if (!jurisdiction) return [];
  
  const categoryPhrases = jurisdiction.categories[category];
  if (!categoryPhrases) return [];
  
  return categoryPhrases.phrases[tone] || [];
}

export function getEscalationPaths(jurisdictionCode: string, category: string): string[] {
  const jurisdiction = getJurisdictionByCode(jurisdictionCode);
  if (!jurisdiction) return [];
  
  const categoryPhrases = jurisdiction.categories[category];
  return categoryPhrases?.escalationPaths || [];
}
