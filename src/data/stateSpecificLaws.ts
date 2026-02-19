/**
 * STATE-SPECIFIC LAW CITATIONS
 * =============================
 * 
 * Maps each US state + dispute category to specific statutes.
 * Used by the generate-legal-letter edge function to inject
 * precise state-level citations alongside federal laws.
 * 
 * Sources: State consumer protection statutes, AG offices, legal databases.
 * Last reviewed: February 2026
 */

export interface StateStatute {
  name: string;
  citation: string;
  summary: string;
}

export interface StateLawEntry {
  consumerProtection: StateStatute;
  lemonLaw?: StateStatute;
  landlordTenant?: StateStatute;
  insurance?: StateStatute;
  debtCollection?: StateStatute;
  homeImprovement?: StateStatute;
  agOffice: string;
  agWebsite: string;
}

export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
] as const;

export type StateCode = typeof US_STATES[number]['code'];

/**
 * Comprehensive state-by-state law database
 */
export const stateSpecificLaws: Record<string, StateLawEntry> = {
  AL: {
    consumerProtection: { name: 'Alabama Deceptive Trade Practices Act', citation: 'Ala. Code § 8-19-1 et seq.', summary: 'Prohibits unconscionable, deceptive, or fraudulent practices in trade or commerce' },
    lemonLaw: { name: 'Alabama Lemon Law', citation: 'Ala. Code § 8-20A-1 et seq.', summary: 'Covers new vehicles with substantial defects within first 24 months or 24,000 miles' },
    landlordTenant: { name: 'Alabama Uniform Residential Landlord and Tenant Act', citation: 'Ala. Code § 35-9A-101 et seq.', summary: 'Requires landlord to maintain habitable premises; 14-day notice for repairs' },
    insurance: { name: 'Alabama Insurance Code', citation: 'Ala. Code § 27-1-1 et seq.', summary: 'Regulates claim handling and unfair settlement practices' },
    debtCollection: { name: 'Alabama Mini-FTC Act', citation: 'Ala. Code § 8-19-5', summary: 'Prohibits deceptive collection practices at the state level' },
    agOffice: 'Alabama Attorney General',
    agWebsite: 'https://www.alabamaag.gov',
  },
  AK: {
    consumerProtection: { name: 'Alaska Unfair Trade Practices and Consumer Protection Act', citation: 'Alaska Stat. § 45.50.471 et seq.', summary: 'Prohibits unfair methods of competition and unfair or deceptive acts' },
    lemonLaw: { name: 'Alaska Lemon Law', citation: 'Alaska Stat. § 45.45.300 et seq.', summary: 'Applies to new vehicles with defects not repaired after reasonable attempts' },
    landlordTenant: { name: 'Alaska Uniform Residential Landlord and Tenant Act', citation: 'Alaska Stat. § 34.03.010 et seq.', summary: 'Requires habitable premises; security deposit return within 14 days' },
    agOffice: 'Alaska Attorney General',
    agWebsite: 'https://law.alaska.gov',
  },
  AZ: {
    consumerProtection: { name: 'Arizona Consumer Fraud Act', citation: 'Ariz. Rev. Stat. § 44-1521 et seq.', summary: 'Prohibits deception, fraud, misrepresentation in sale of goods or services' },
    lemonLaw: { name: 'Arizona Lemon Law', citation: 'Ariz. Rev. Stat. § 44-1261 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; requires 4 repair attempts' },
    landlordTenant: { name: 'Arizona Residential Landlord and Tenant Act', citation: 'Ariz. Rev. Stat. § 33-1301 et seq.', summary: 'Landlord must maintain fit premises; 10-day repair notice for non-emergencies' },
    agOffice: 'Arizona Attorney General',
    agWebsite: 'https://www.azag.gov',
  },
  AR: {
    consumerProtection: { name: 'Arkansas Deceptive Trade Practices Act', citation: 'Ark. Code § 4-88-101 et seq.', summary: 'Provides civil remedies for deceptive and unconscionable trade practices' },
    lemonLaw: { name: 'Arkansas New Motor Vehicle Quality Assurance Act', citation: 'Ark. Code § 4-90-401 et seq.', summary: 'Covers new vehicles within 24 months; requires manufacturer notification' },
    landlordTenant: { name: 'Arkansas Residential Landlord-Tenant Act', citation: 'Ark. Code § 18-17-101 et seq.', summary: 'Provides basic tenant protections; security deposit return within 60 days' },
    agOffice: 'Arkansas Attorney General',
    agWebsite: 'https://arkansasag.gov',
  },
  CA: {
    consumerProtection: { name: 'California Consumer Legal Remedies Act', citation: 'Cal. Civ. Code § 1750 et seq.', summary: 'Strong consumer protections with actual damages, punitive damages, and attorney fees' },
    lemonLaw: { name: 'California Song-Beverly Consumer Warranty Act', citation: 'Cal. Civ. Code § 1790 et seq.', summary: 'One of the strongest lemon laws; covers new and used certified vehicles; 2x damages for willful violations' },
    landlordTenant: { name: 'California Civil Code - Landlord-Tenant', citation: 'Cal. Civ. Code § 1940 et seq.', summary: 'Extensive tenant protections; rent control in many cities; 21-day deposit return; repair-and-deduct rights' },
    insurance: { name: 'California Insurance Code - Fair Claims Settlement', citation: 'Cal. Ins. Code § 790.03', summary: 'Detailed unfair claims practices act; 15-day acknowledgment, 40-day decision requirements' },
    debtCollection: { name: 'Rosenthal Fair Debt Collection Practices Act', citation: 'Cal. Civ. Code § 1788 et seq.', summary: 'Extends FDCPA protections to original creditors, not just third-party collectors' },
    homeImprovement: { name: 'Contractors State License Law', citation: 'Cal. Bus. & Prof. Code § 7000 et seq.', summary: 'Requires contractor licensing; homeowners can recover from Contractors State License Board guarantee fund' },
    agOffice: 'California Attorney General',
    agWebsite: 'https://oag.ca.gov',
  },
  CO: {
    consumerProtection: { name: 'Colorado Consumer Protection Act', citation: 'Colo. Rev. Stat. § 6-1-101 et seq.', summary: 'Prohibits deceptive trade practices; treble damages available' },
    lemonLaw: { name: 'Colorado Lemon Law', citation: 'Colo. Rev. Stat. § 42-10-101 et seq.', summary: 'Applies within 1 year; requires 4 repair attempts or 30+ business days out of service' },
    landlordTenant: { name: 'Colorado Warranty of Habitability', citation: 'Colo. Rev. Stat. § 38-12-501 et seq.', summary: 'Landlord must maintain habitable conditions; tenant may withhold rent for violations' },
    agOffice: 'Colorado Attorney General',
    agWebsite: 'https://coag.gov',
  },
  CT: {
    consumerProtection: { name: 'Connecticut Unfair Trade Practices Act (CUTPA)', citation: 'Conn. Gen. Stat. § 42-110a et seq.', summary: 'Broad prohibition on unfair or deceptive practices; punitive damages available' },
    lemonLaw: { name: 'Connecticut Lemon Law', citation: 'Conn. Gen. Stat. § 42-179', summary: 'Covers new vehicles within 2 years or 24,000 miles; includes used cars under separate statute' },
    landlordTenant: { name: 'Connecticut Landlord-Tenant Act', citation: 'Conn. Gen. Stat. § 47a-1 et seq.', summary: 'Strong tenant protections; 30-day deposit return; implied warranty of habitability' },
    homeImprovement: { name: 'Connecticut Home Improvement Act', citation: 'Conn. Gen. Stat. § 20-418 et seq.', summary: 'Requires written contracts for work over $200; 3-day right of rescission' },
    agOffice: 'Connecticut Attorney General',
    agWebsite: 'https://portal.ct.gov/AG',
  },
  DE: {
    consumerProtection: { name: 'Delaware Consumer Fraud Act', citation: 'Del. Code tit. 6, § 2511 et seq.', summary: 'Prohibits deception in sale of goods and services; treble damages available' },
    lemonLaw: { name: 'Delaware Lemon Law', citation: 'Del. Code tit. 6, § 5001 et seq.', summary: 'Covers new vehicles within 1 year or 12,000 miles' },
    landlordTenant: { name: 'Delaware Residential Landlord-Tenant Code', citation: 'Del. Code tit. 25, § 5101 et seq.', summary: 'Landlord must maintain premises; 20-day deposit return' },
    agOffice: 'Delaware Attorney General',
    agWebsite: 'https://attorneygeneral.delaware.gov',
  },
  FL: {
    consumerProtection: { name: 'Florida Deceptive and Unfair Trade Practices Act (FDUTPA)', citation: 'Fla. Stat. § 501.201 et seq.', summary: 'Prohibits unfair and deceptive practices; actual damages plus attorney fees' },
    lemonLaw: { name: 'Florida Lemon Law', citation: 'Fla. Stat. § 681.10 et seq.', summary: 'Covers new vehicles within 24 months; includes leased vehicles; free arbitration program' },
    landlordTenant: { name: 'Florida Residential Landlord and Tenant Act', citation: 'Fla. Stat. § 83.40 et seq.', summary: 'Landlord has 7 days for urgent repairs; 15-30 day deposit return; no rent control' },
    insurance: { name: 'Florida Insurance Code - Claims Handling', citation: 'Fla. Stat. § 626.9541', summary: 'Unfair claim settlement practices; 14-day acknowledgment; 90-day decision' },
    agOffice: 'Florida Attorney General',
    agWebsite: 'https://www.myfloridalegal.com',
  },
  GA: {
    consumerProtection: { name: 'Georgia Fair Business Practices Act', citation: 'Ga. Code § 10-1-390 et seq.', summary: 'Prohibits unfair or deceptive practices; provides for injunctive relief and damages' },
    lemonLaw: { name: 'Georgia Lemon Law', citation: 'Ga. Code § 10-1-780 et seq.', summary: 'Covers new vehicles within 24 months or 24,000 miles; requires 3 repair attempts' },
    landlordTenant: { name: 'Georgia Landlord-Tenant Law', citation: 'Ga. Code § 44-7-1 et seq.', summary: 'Landlord must maintain premises in repair; 1-month deposit return' },
    agOffice: 'Georgia Attorney General',
    agWebsite: 'https://law.georgia.gov',
  },
  HI: {
    consumerProtection: { name: 'Hawaii Unfair or Deceptive Acts or Practices', citation: 'Haw. Rev. Stat. § 480-1 et seq.', summary: 'Broad consumer protection; treble damages and attorney fees' },
    lemonLaw: { name: 'Hawaii Lemon Law', citation: 'Haw. Rev. Stat. § 481I-1 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; includes demonstrator vehicles' },
    landlordTenant: { name: 'Hawaii Residential Landlord-Tenant Code', citation: 'Haw. Rev. Stat. § 521-1 et seq.', summary: 'Strong tenant protections; landlord must maintain habitable premises' },
    agOffice: 'Hawaii Attorney General',
    agWebsite: 'https://ag.hawaii.gov',
  },
  ID: {
    consumerProtection: { name: 'Idaho Consumer Protection Act', citation: 'Idaho Code § 48-601 et seq.', summary: 'Prohibits unfair methods of competition and deceptive practices' },
    lemonLaw: { name: 'Idaho does not have a standalone lemon law', citation: 'Magnuson-Moss Warranty Act applies', summary: 'Consumers rely on federal warranty protections and UCC remedies' },
    landlordTenant: { name: 'Idaho Landlord-Tenant Law', citation: 'Idaho Code § 6-301 et seq.', summary: 'Landlord must maintain habitable premises; 21-day deposit return' },
    agOffice: 'Idaho Attorney General',
    agWebsite: 'https://www.ag.idaho.gov',
  },
  IL: {
    consumerProtection: { name: 'Illinois Consumer Fraud and Deceptive Business Practices Act', citation: '815 ILCS 505/1 et seq.', summary: 'Broad consumer protections; actual damages, punitive damages, and attorney fees' },
    lemonLaw: { name: 'Illinois New Vehicle Buyer Protection Act', citation: '815 ILCS 380/1 et seq.', summary: 'Covers new vehicles within 12 months or 12,000 miles; 4 repair attempts required' },
    landlordTenant: { name: 'Illinois Landlord and Tenant Act', citation: '765 ILCS 705 et seq.', summary: 'Varies by municipality; Chicago has strong tenant protections including RLTO' },
    debtCollection: { name: 'Illinois Collection Agency Act', citation: '225 ILCS 425/1 et seq.', summary: 'Regulates debt collectors; prohibits harassment and deceptive practices' },
    agOffice: 'Illinois Attorney General',
    agWebsite: 'https://illinoisattorneygeneral.gov',
  },
  IN: {
    consumerProtection: { name: 'Indiana Deceptive Consumer Sales Act', citation: 'Ind. Code § 24-5-0.5-1 et seq.', summary: 'Prohibits deceptive and unconscionable sales practices; treble damages for knowing violations' },
    lemonLaw: { name: 'Indiana Motor Vehicle Protection Act', citation: 'Ind. Code § 24-5-13-1 et seq.', summary: 'Covers new vehicles within 18 months or 18,000 miles' },
    landlordTenant: { name: 'Indiana Landlord-Tenant Law', citation: 'Ind. Code § 32-31-1 et seq.', summary: 'Landlord duty to maintain; 45-day deposit return' },
    agOffice: 'Indiana Attorney General',
    agWebsite: 'https://www.in.gov/attorneygeneral',
  },
  IA: {
    consumerProtection: { name: 'Iowa Consumer Fraud Act', citation: 'Iowa Code § 714H.1 et seq.', summary: 'Prohibits deception, fraud, and unfair practices in consumer transactions' },
    lemonLaw: { name: 'Iowa Lemon Law', citation: 'Iowa Code § 322G.1 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'Iowa Uniform Residential Landlord and Tenant Act', citation: 'Iowa Code § 562A.1 et seq.', summary: 'Landlord must maintain habitable premises; 30-day deposit return' },
    agOffice: 'Iowa Attorney General',
    agWebsite: 'https://www.iowaattorneygeneral.gov',
  },
  KS: {
    consumerProtection: { name: 'Kansas Consumer Protection Act', citation: 'Kan. Stat. § 50-623 et seq.', summary: 'Prohibits deceptive and unconscionable acts in consumer transactions' },
    lemonLaw: { name: 'Kansas Lemon Law', citation: 'Kan. Stat. § 50-645 et seq.', summary: 'Covers new vehicles within 1 year or 12,000 miles; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Kansas Residential Landlord and Tenant Act', citation: 'Kan. Stat. § 58-2540 et seq.', summary: 'Landlord must maintain premises; 30-day deposit return' },
    agOffice: 'Kansas Attorney General',
    agWebsite: 'https://www.ag.ks.gov',
  },
  KY: {
    consumerProtection: { name: 'Kentucky Consumer Protection Act', citation: 'Ky. Rev. Stat. § 367.110 et seq.', summary: 'Prohibits unfair, false, misleading, or deceptive acts in trade or commerce' },
    lemonLaw: { name: 'Kentucky Lemon Law', citation: 'Ky. Rev. Stat. § 367.840 et seq.', summary: 'Covers new vehicles within 12 months or 12,000 miles; 4 repair attempts' },
    landlordTenant: { name: 'Kentucky Uniform Residential Landlord and Tenant Act', citation: 'Ky. Rev. Stat. § 383.500 et seq.', summary: 'Landlord must maintain habitable premises; adopted in some counties' },
    agOffice: 'Kentucky Attorney General',
    agWebsite: 'https://www.ag.ky.gov',
  },
  LA: {
    consumerProtection: { name: 'Louisiana Unfair Trade Practices and Consumer Protection Law', citation: 'La. Rev. Stat. § 51:1401 et seq.', summary: 'Prohibits unfair or deceptive practices; provides for actual damages and attorney fees' },
    lemonLaw: { name: 'Louisiana Lemon Law', citation: 'La. Rev. Stat. § 51:1941 et seq.', summary: 'Covers new vehicles within warranty period; 4 repair attempts or 90 days' },
    landlordTenant: { name: 'Louisiana Civil Code - Lease', citation: 'La. Civ. Code Art. 2668 et seq.', summary: 'Lessor must maintain premises in condition for intended use' },
    agOffice: 'Louisiana Attorney General',
    agWebsite: 'https://www.ag.state.la.us',
  },
  ME: {
    consumerProtection: { name: 'Maine Unfair Trade Practices Act', citation: 'Me. Rev. Stat. tit. 5, § 205-A et seq.', summary: 'Prohibits unfair or deceptive acts in trade or commerce' },
    lemonLaw: { name: 'Maine Lemon Law', citation: 'Me. Rev. Stat. tit. 10, § 1161 et seq.', summary: 'Covers new and used vehicles sold by dealers within 3 years or 18,000 miles' },
    landlordTenant: { name: 'Maine Landlord-Tenant Law', citation: 'Me. Rev. Stat. tit. 14, § 6001 et seq.', summary: 'Implied warranty of habitability; 30-day deposit return' },
    agOffice: 'Maine Attorney General',
    agWebsite: 'https://www.maine.gov/ag',
  },
  MD: {
    consumerProtection: { name: 'Maryland Consumer Protection Act', citation: 'Md. Code Com. Law § 13-101 et seq.', summary: 'Broad prohibition on unfair, abusive, or deceptive trade practices' },
    lemonLaw: { name: 'Maryland Lemon Law', citation: 'Md. Code Com. Law § 14-1501 et seq.', summary: 'Covers new vehicles within 15 months or 15,000 miles; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Maryland Landlord-Tenant Law', citation: 'Md. Code Real Prop. § 8-101 et seq.', summary: 'Implied warranty of habitability; 45-day deposit return; rent escrow available' },
    agOffice: 'Maryland Attorney General',
    agWebsite: 'https://www.marylandattorneygeneral.gov',
  },
  MA: {
    consumerProtection: { name: 'Massachusetts Consumer Protection Act (Chapter 93A)', citation: 'Mass. Gen. Laws ch. 93A', summary: 'Very strong; mandatory demand letter before suit; double or treble damages for willful violations' },
    lemonLaw: { name: 'Massachusetts Lemon Law', citation: 'Mass. Gen. Laws ch. 90 § 7N½', summary: 'Covers new vehicles within 1 year or 15,000 miles; includes used vehicles under separate statute' },
    landlordTenant: { name: 'Massachusetts Landlord-Tenant Law', citation: 'Mass. Gen. Laws ch. 186', summary: 'Strong tenant protections; security deposit in escrow; treble damages for violations' },
    homeImprovement: { name: 'Massachusetts Home Improvement Contractor Law', citation: 'Mass. Gen. Laws ch. 142A', summary: 'Requires contractor registration; written contracts for work over $1,000' },
    agOffice: 'Massachusetts Attorney General',
    agWebsite: 'https://www.mass.gov/orgs/office-of-the-attorney-general',
  },
  MI: {
    consumerProtection: { name: 'Michigan Consumer Protection Act', citation: 'Mich. Comp. Laws § 445.901 et seq.', summary: 'Prohibits unfair, unconscionable, or deceptive methods; $250 minimum damages' },
    lemonLaw: { name: 'Michigan Lemon Law', citation: 'Mich. Comp. Laws § 257.1401 et seq.', summary: 'Covers new vehicles within warranty period; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Michigan Landlord-Tenant Relationships Act', citation: 'Mich. Comp. Laws § 554.601 et seq.', summary: 'Landlord must maintain premises; 30-day deposit return' },
    agOffice: 'Michigan Attorney General',
    agWebsite: 'https://www.michigan.gov/ag',
  },
  MN: {
    consumerProtection: { name: 'Minnesota Prevention of Consumer Fraud Act', citation: 'Minn. Stat. § 325F.68 et seq.', summary: 'Prohibits fraud, false advertising, and deceptive trade practices' },
    lemonLaw: { name: 'Minnesota Lemon Law', citation: 'Minn. Stat. § 325F.665', summary: 'Covers new vehicles within 2 years or warranty period; manufacturer arbitration required' },
    landlordTenant: { name: 'Minnesota Landlord-Tenant Law', citation: 'Minn. Stat. § 504B.001 et seq.', summary: 'Covenant of habitability; 21-day deposit return; tenant remedies for non-repair' },
    agOffice: 'Minnesota Attorney General',
    agWebsite: 'https://www.ag.state.mn.us',
  },
  MS: {
    consumerProtection: { name: 'Mississippi Consumer Protection Act', citation: 'Miss. Code § 75-24-1 et seq.', summary: 'Prohibits unfair or deceptive trade practices' },
    lemonLaw: { name: 'Mississippi Motor Vehicle Warranty Enforcement Act', citation: 'Miss. Code § 63-17-151 et seq.', summary: 'Covers new vehicles within 1 year; 3 repair attempts or 15 business days' },
    landlordTenant: { name: 'Mississippi Landlord-Tenant Law', citation: 'Miss. Code § 89-8-1 et seq.', summary: 'Basic landlord obligations; limited statutory protections for tenants' },
    agOffice: 'Mississippi Attorney General',
    agWebsite: 'https://www.ago.state.ms.us',
  },
  MO: {
    consumerProtection: { name: 'Missouri Merchandising Practices Act', citation: 'Mo. Rev. Stat. § 407.010 et seq.', summary: 'Prohibits deception, fraud, and unfair practices; private right of action' },
    lemonLaw: { name: 'Missouri Lemon Law', citation: 'Mo. Rev. Stat. § 407.560 et seq.', summary: 'Covers new vehicles within first year; 4 repair attempts or 30 days out of service' },
    landlordTenant: { name: 'Missouri Landlord-Tenant Law', citation: 'Mo. Rev. Stat. § 441.005 et seq.', summary: 'Landlord duty to maintain; 30-day deposit return' },
    agOffice: 'Missouri Attorney General',
    agWebsite: 'https://ago.mo.gov',
  },
  MT: {
    consumerProtection: { name: 'Montana Unfair Trade Practices and Consumer Protection Act', citation: 'Mont. Code § 30-14-101 et seq.', summary: 'Prohibits unfair or deceptive practices in trade or commerce' },
    lemonLaw: { name: 'Montana Lemon Law', citation: 'Mont. Code § 61-4-501 et seq.', summary: 'Covers new vehicles within 2 years or 18,000 miles' },
    landlordTenant: { name: 'Montana Residential Landlord and Tenant Act', citation: 'Mont. Code § 70-24-101 et seq.', summary: 'Implied warranty of habitability; 10-day deposit return' },
    agOffice: 'Montana Attorney General',
    agWebsite: 'https://dojmt.gov',
  },
  NE: {
    consumerProtection: { name: 'Nebraska Consumer Protection Act', citation: 'Neb. Rev. Stat. § 59-1601 et seq.', summary: 'Prohibits unfair or deceptive practices; AG enforcement with consumer complaint process' },
    lemonLaw: { name: 'Nebraska Motor Vehicle Industry Regulation Act', citation: 'Neb. Rev. Stat. § 60-2701 et seq.', summary: 'Covers new vehicles within 1 year; requires manufacturer notification' },
    landlordTenant: { name: 'Nebraska Uniform Residential Landlord and Tenant Act', citation: 'Neb. Rev. Stat. § 76-1401 et seq.', summary: 'Landlord must maintain habitable premises; 14-day deposit return' },
    agOffice: 'Nebraska Attorney General',
    agWebsite: 'https://ago.nebraska.gov',
  },
  NV: {
    consumerProtection: { name: 'Nevada Deceptive Trade Practices Act', citation: 'Nev. Rev. Stat. § 598.0903 et seq.', summary: 'Prohibits deceptive trade practices; provides for injunctive relief and damages' },
    lemonLaw: { name: 'Nevada Motor Vehicle Warranty Rights', citation: 'Nev. Rev. Stat. § 597.600 et seq.', summary: 'Covers new vehicles within 1 year or warranty period' },
    landlordTenant: { name: 'Nevada Landlord-Tenant Law', citation: 'Nev. Rev. Stat. § 118A.010 et seq.', summary: 'Landlord duty to maintain habitable premises; 30-day deposit return' },
    agOffice: 'Nevada Attorney General',
    agWebsite: 'https://ag.nv.gov',
  },
  NH: {
    consumerProtection: { name: 'New Hampshire Consumer Protection Act', citation: 'N.H. Rev. Stat. § 358-A:1 et seq.', summary: 'Prohibits unfair or deceptive acts; treble damages and attorney fees available' },
    lemonLaw: { name: 'New Hampshire Lemon Law', citation: 'N.H. Rev. Stat. § 357-D:1 et seq.', summary: 'Covers new vehicles within warranty period; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'New Hampshire RSA 540/540-A', citation: 'N.H. Rev. Stat. § 540:1 et seq.', summary: 'Implied warranty of habitability; 30-day deposit return' },
    agOffice: 'New Hampshire Attorney General',
    agWebsite: 'https://www.doj.nh.gov',
  },
  NJ: {
    consumerProtection: { name: 'New Jersey Consumer Fraud Act', citation: 'N.J. Stat. § 56:8-1 et seq.', summary: 'Very strong; treble damages; covers unconscionable practices; broad definition of fraud' },
    lemonLaw: { name: 'New Jersey Lemon Law', citation: 'N.J. Stat. § 56:12-29 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; includes leased vehicles' },
    landlordTenant: { name: 'New Jersey Landlord-Tenant Law', citation: 'N.J. Stat. § 2A:18-51 et seq.', summary: 'Strong tenant protections; implied warranty of habitability; 30-day deposit return' },
    homeImprovement: { name: 'New Jersey Home Improvement Practices', citation: 'N.J. Admin. Code § 13:45A-16', summary: 'Requires contractor registration; written contracts; specific disclosure requirements' },
    agOffice: 'New Jersey Attorney General',
    agWebsite: 'https://www.njoag.gov',
  },
  NM: {
    consumerProtection: { name: 'New Mexico Unfair Practices Act', citation: 'N.M. Stat. § 57-12-1 et seq.', summary: 'Prohibits unfair or deceptive trade practices; treble damages available' },
    lemonLaw: { name: 'New Mexico Lemon Law', citation: 'N.M. Stat. § 57-16A-1 et seq.', summary: 'Covers new vehicles within warranty period or 1 year' },
    landlordTenant: { name: 'New Mexico Uniform Owner-Resident Relations Act', citation: 'N.M. Stat. § 47-8-1 et seq.', summary: 'Landlord must maintain habitable premises; 30-day deposit return' },
    agOffice: 'New Mexico Attorney General',
    agWebsite: 'https://www.nmag.gov',
  },
  NY: {
    consumerProtection: { name: 'New York General Business Law - Consumer Protection', citation: 'N.Y. Gen. Bus. Law § 349-350', summary: 'Prohibits deceptive acts; $50 minimum statutory damages; treble damages up to $1,000 for willful violations' },
    lemonLaw: { name: 'New York Lemon Law', citation: 'N.Y. Gen. Bus. Law § 198-a', summary: 'Covers new and used vehicles; one of the strongest in the US; includes used car warranty provisions' },
    landlordTenant: { name: 'New York Real Property Law & NYC Housing Maintenance Code', citation: 'N.Y. Real Prop. Law § 220 et seq.', summary: 'Very strong tenant protections; warranty of habitability; rent stabilization in NYC' },
    debtCollection: { name: 'New York City Consumer Protection Law', citation: 'NYC Admin. Code § 20-700', summary: 'Additional protections for NYC residents against deceptive debt collection' },
    homeImprovement: { name: 'New York Home Improvement Fraud Prevention Act', citation: 'N.Y. Gen. Bus. Law § 770 et seq.', summary: 'Requires written contracts; contractor must provide notice of cancellation rights' },
    agOffice: 'New York Attorney General',
    agWebsite: 'https://ag.ny.gov',
  },
  NC: {
    consumerProtection: { name: 'North Carolina Unfair and Deceptive Trade Practices Act', citation: 'N.C. Gen. Stat. § 75-1.1', summary: 'Prohibits unfair or deceptive acts; treble damages for violations' },
    lemonLaw: { name: 'North Carolina Lemon Law', citation: 'N.C. Gen. Stat. § 20-351 et seq.', summary: 'Covers new vehicles within 24 months or 24,000 miles; 4 repair attempts' },
    landlordTenant: { name: 'North Carolina Residential Rental Agreements Act', citation: 'N.C. Gen. Stat. § 42-38 et seq.', summary: 'Implied warranty of habitability; 30-day deposit return' },
    agOffice: 'North Carolina Attorney General',
    agWebsite: 'https://ncdoj.gov',
  },
  ND: {
    consumerProtection: { name: 'North Dakota Consumer Fraud Act', citation: 'N.D. Cent. Code § 51-15-01 et seq.', summary: 'Prohibits deceptive acts in consumer transactions' },
    lemonLaw: { name: 'North Dakota Lemon Law', citation: 'N.D. Cent. Code § 51-07-16 et seq.', summary: 'Covers new vehicles within warranty or 1 year; 3 repair attempts' },
    landlordTenant: { name: 'North Dakota Uniform Residential Landlord and Tenant Act', citation: 'N.D. Cent. Code § 47-16-01 et seq.', summary: 'Basic habitability requirements; deposit return rules' },
    agOffice: 'North Dakota Attorney General',
    agWebsite: 'https://attorneygeneral.nd.gov',
  },
  OH: {
    consumerProtection: { name: 'Ohio Consumer Sales Practices Act', citation: 'Ohio Rev. Code § 1345.01 et seq.', summary: 'Prohibits unfair or deceptive consumer sales practices; treble damages for knowing violations' },
    lemonLaw: { name: 'Ohio Lemon Law', citation: 'Ohio Rev. Code § 1345.71 et seq.', summary: 'Covers new vehicles within 1 year or 18,000 miles; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'Ohio Landlord-Tenant Law', citation: 'Ohio Rev. Code § 5321.01 et seq.', summary: 'Landlord obligations for habitable premises; 30-day deposit return' },
    agOffice: 'Ohio Attorney General',
    agWebsite: 'https://www.ohioattorneygeneral.gov',
  },
  OK: {
    consumerProtection: { name: 'Oklahoma Consumer Protection Act', citation: 'Okla. Stat. tit. 15, § 751 et seq.', summary: 'Prohibits deceptive trade practices; AG enforcement and private right of action' },
    lemonLaw: { name: 'Oklahoma Motor Vehicle Commission Act (Lemon Law)', citation: 'Okla. Stat. tit. 15, § 901 et seq.', summary: 'Covers new vehicles within warranty; 4 repair attempts or 45 days' },
    landlordTenant: { name: 'Oklahoma Residential Landlord and Tenant Act', citation: 'Okla. Stat. tit. 41, § 101 et seq.', summary: 'Landlord must maintain premises; 45-day deposit return' },
    agOffice: 'Oklahoma Attorney General',
    agWebsite: 'https://www.oag.ok.gov',
  },
  OR: {
    consumerProtection: { name: 'Oregon Unlawful Trade Practices Act', citation: 'Or. Rev. Stat. § 646.605 et seq.', summary: 'Prohibits unlawful trade practices; provides for actual damages or $200 minimum' },
    lemonLaw: { name: 'Oregon Lemon Law', citation: 'Or. Rev. Stat. § 646A.400 et seq.', summary: 'Covers new vehicles within 1 year or 12,000 miles; manufacturer notification required' },
    landlordTenant: { name: 'Oregon Residential Landlord and Tenant Act', citation: 'Or. Rev. Stat. § 90.100 et seq.', summary: 'Strong tenant protections; rent control; habitability requirements; 31-day deposit return' },
    agOffice: 'Oregon Attorney General',
    agWebsite: 'https://www.doj.state.or.us',
  },
  PA: {
    consumerProtection: { name: 'Pennsylvania Unfair Trade Practices and Consumer Protection Law', citation: '73 Pa. Stat. § 201-1 et seq.', summary: 'Prohibits unfair or deceptive acts; treble damages available' },
    lemonLaw: { name: 'Pennsylvania Lemon Law', citation: '73 Pa. Stat. § 1951 et seq.', summary: 'Covers new vehicles within 1 year, 12,000 miles, or warranty; 3 repair attempts' },
    landlordTenant: { name: 'Pennsylvania Landlord and Tenant Act', citation: '68 Pa. Stat. § 250.101 et seq.', summary: 'Implied warranty of habitability; 30-day deposit return' },
    homeImprovement: { name: 'Pennsylvania Home Improvement Consumer Protection Act', citation: '73 Pa. Stat. § 517.1 et seq.', summary: 'Requires contractor registration; written contracts; recovery fund' },
    agOffice: 'Pennsylvania Attorney General',
    agWebsite: 'https://www.attorneygeneral.gov',
  },
  RI: {
    consumerProtection: { name: 'Rhode Island Deceptive Trade Practices Act', citation: 'R.I. Gen. Laws § 6-13.1-1 et seq.', summary: 'Prohibits deceptive practices; provides for damages and attorney fees' },
    lemonLaw: { name: 'Rhode Island Lemon Law', citation: 'R.I. Gen. Laws § 31-5.2-1 et seq.', summary: 'Covers new vehicles within 1 year or 15,000 miles; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Rhode Island Residential Landlord and Tenant Act', citation: 'R.I. Gen. Laws § 34-18-1 et seq.', summary: 'Implied warranty of habitability; 20-day deposit return' },
    agOffice: 'Rhode Island Attorney General',
    agWebsite: 'https://riag.ri.gov',
  },
  SC: {
    consumerProtection: { name: 'South Carolina Unfair Trade Practices Act', citation: 'S.C. Code § 39-5-10 et seq.', summary: 'Prohibits unfair or deceptive acts in trade or commerce; treble damages' },
    lemonLaw: { name: 'South Carolina Lemon Law', citation: 'S.C. Code § 56-28-10 et seq.', summary: 'Covers new vehicles within 1 year or 12,000 miles; manufacturer notification required' },
    landlordTenant: { name: 'South Carolina Residential Landlord and Tenant Act', citation: 'S.C. Code § 27-40-10 et seq.', summary: 'Landlord must maintain fit premises; 30-day deposit return' },
    agOffice: 'South Carolina Attorney General',
    agWebsite: 'https://www.scag.gov',
  },
  SD: {
    consumerProtection: { name: 'South Dakota Deceptive Trade Practices Act', citation: 'S.D. Codified Laws § 37-24-1 et seq.', summary: 'Prohibits deceptive acts and practices in business and commerce' },
    lemonLaw: { name: 'South Dakota Motor Vehicle Lemon Law', citation: 'S.D. Codified Laws § 32-6D-1 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles' },
    landlordTenant: { name: 'South Dakota Landlord-Tenant Law', citation: 'S.D. Codified Laws § 43-32-1 et seq.', summary: 'Landlord duty to maintain premises; 2 weeks deposit return' },
    agOffice: 'South Dakota Attorney General',
    agWebsite: 'https://atg.sd.gov',
  },
  TN: {
    consumerProtection: { name: 'Tennessee Consumer Protection Act', citation: 'Tenn. Code § 47-18-101 et seq.', summary: 'Prohibits unfair or deceptive acts; treble damages for willful violations' },
    lemonLaw: { name: 'Tennessee Motor Vehicle Warranty Act', citation: 'Tenn. Code § 55-24-201 et seq.', summary: 'Covers new vehicles within 1 year; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'Tennessee Uniform Residential Landlord and Tenant Act', citation: 'Tenn. Code § 66-28-101 et seq.', summary: 'Landlord must maintain habitable premises; 30-day deposit return' },
    agOffice: 'Tennessee Attorney General',
    agWebsite: 'https://www.tn.gov/attorneygeneral',
  },
  TX: {
    consumerProtection: { name: 'Texas Deceptive Trade Practices Act (DTPA)', citation: 'Tex. Bus. & Com. Code § 17.41 et seq.', summary: 'Very strong consumer protection; treble damages for knowing violations; covers broad range of deceptive practices' },
    lemonLaw: { name: 'Texas Lemon Law', citation: 'Tex. Occ. Code § 2301.601 et seq.', summary: 'Covers new vehicles within warranty or 24 months/24,000 miles; TXDMV arbitration program' },
    landlordTenant: { name: 'Texas Property Code - Landlord-Tenant', citation: 'Tex. Prop. Code § 92.001 et seq.', summary: 'Landlord duty to repair; 30-day deposit return; repair-and-deduct for certain conditions' },
    insurance: { name: 'Texas Insurance Code - Unfair Settlement Practices', citation: 'Tex. Ins. Code § 542.051 et seq.', summary: 'Prompt payment of claims; 15-day acknowledgment; 18% penalty for late payment' },
    debtCollection: { name: 'Texas Debt Collection Act', citation: 'Tex. Fin. Code § 392.001 et seq.', summary: 'State-level debt collection protections supplementing federal FDCPA' },
    homeImprovement: { name: 'Texas Residential Construction Liability Act', citation: 'Tex. Prop. Code § 27.001 et seq.', summary: 'Requires 60-day notice before suing contractor; opportunity to inspect and offer to repair' },
    agOffice: 'Texas Attorney General',
    agWebsite: 'https://www.texasattorneygeneral.gov',
  },
  UT: {
    consumerProtection: { name: 'Utah Consumer Sales Practices Act', citation: 'Utah Code § 13-11-1 et seq.', summary: 'Prohibits deceptive and unconscionable sales practices' },
    lemonLaw: { name: 'Utah New Motor Vehicle Warranties Act', citation: 'Utah Code § 13-20-1 et seq.', summary: 'Covers new vehicles within warranty; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Utah Fit Premises Act', citation: 'Utah Code § 57-22-1 et seq.', summary: 'Landlord must maintain fit premises; deficiency notice process' },
    agOffice: 'Utah Attorney General',
    agWebsite: 'https://attorneygeneral.utah.gov',
  },
  VT: {
    consumerProtection: { name: 'Vermont Consumer Protection Act', citation: 'Vt. Stat. tit. 9, § 2451 et seq.', summary: 'Prohibits unfair or deceptive acts in commerce; provides for damages and attorney fees' },
    lemonLaw: { name: 'Vermont Lemon Law', citation: 'Vt. Stat. tit. 9, § 4170 et seq.', summary: 'Covers new vehicles within warranty period; state arbitration program' },
    landlordTenant: { name: 'Vermont Residential Rental Agreements Act', citation: 'Vt. Stat. tit. 9, § 4451 et seq.', summary: 'Implied warranty of habitability; 14-day deposit return' },
    agOffice: 'Vermont Attorney General',
    agWebsite: 'https://ago.vermont.gov',
  },
  VA: {
    consumerProtection: { name: 'Virginia Consumer Protection Act', citation: 'Va. Code § 59.1-196 et seq.', summary: 'Prohibits fraudulent acts or practices; provides for actual damages' },
    lemonLaw: { name: 'Virginia Motor Vehicle Warranty Enforcement Act', citation: 'Va. Code § 59.1-207.9 et seq.', summary: 'Covers new vehicles within 18 months; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'Virginia Residential Landlord and Tenant Act', citation: 'Va. Code § 55.1-1200 et seq.', summary: 'Landlord must maintain habitable premises; 45-day deposit return' },
    agOffice: 'Virginia Attorney General',
    agWebsite: 'https://www.oag.state.va.us',
  },
  WA: {
    consumerProtection: { name: 'Washington Consumer Protection Act', citation: 'Wash. Rev. Code § 19.86.010 et seq.', summary: 'Strong protections; treble damages; covers unfair and deceptive practices broadly' },
    lemonLaw: { name: 'Washington Lemon Law', citation: 'Wash. Rev. Code § 19.118.005 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; arbitration available' },
    landlordTenant: { name: 'Washington Residential Landlord-Tenant Act', citation: 'Wash. Rev. Code § 59.18.010 et seq.', summary: 'Strong tenant protections; implied warranty of habitability; 21-day deposit return' },
    agOffice: 'Washington Attorney General',
    agWebsite: 'https://www.atg.wa.gov',
  },
  WV: {
    consumerProtection: { name: 'West Virginia Consumer Credit and Protection Act', citation: 'W. Va. Code § 46A-1-101 et seq.', summary: 'Prohibits unfair or deceptive acts in consumer transactions' },
    lemonLaw: { name: 'West Virginia Lemon Law', citation: 'W. Va. Code § 46A-6A-1 et seq.', summary: 'Covers new vehicles within warranty; 3 repair attempts or 30 cumulative days' },
    landlordTenant: { name: 'West Virginia Landlord-Tenant Law', citation: 'W. Va. Code § 37-6-1 et seq.', summary: 'Basic landlord obligations to maintain premises' },
    agOffice: 'West Virginia Attorney General',
    agWebsite: 'https://ago.wv.gov',
  },
  WI: {
    consumerProtection: { name: 'Wisconsin Deceptive Trade Practices Act', citation: 'Wis. Stat. § 100.18', summary: 'Prohibits false, deceptive, or misleading representations; double damages available' },
    lemonLaw: { name: 'Wisconsin Lemon Law', citation: 'Wis. Stat. § 218.0171', summary: 'Covers new vehicles within 1 year or warranty; 4 repair attempts or 30 days' },
    landlordTenant: { name: 'Wisconsin Residential Landlord-Tenant Code', citation: 'Wis. Stat. § 704.01 et seq.', summary: 'Implied warranty of habitability; 21-day deposit return' },
    agOffice: 'Wisconsin Attorney General',
    agWebsite: 'https://www.doj.state.wi.us',
  },
  WY: {
    consumerProtection: { name: 'Wyoming Consumer Protection Act', citation: 'Wyo. Stat. § 40-12-101 et seq.', summary: 'Prohibits deceptive trade practices' },
    lemonLaw: { name: 'Wyoming Lemon Law', citation: 'Wyo. Stat. § 40-17-101 et seq.', summary: 'Covers new vehicles within 1 year; 3 repair attempts or 30 days' },
    landlordTenant: { name: 'Wyoming Residential Rental Property Act', citation: 'Wyo. Stat. § 1-21-1201 et seq.', summary: 'Basic landlord-tenant framework; 30-day deposit return' },
    agOffice: 'Wyoming Attorney General',
    agWebsite: 'https://ag.wyo.gov',
  },
  DC: {
    consumerProtection: { name: 'DC Consumer Protection Procedures Act', citation: 'D.C. Code § 28-3901 et seq.', summary: 'Broad prohibition on unfair or deceptive practices; treble damages; strong enforcement' },
    lemonLaw: { name: 'DC Lemon Law', citation: 'D.C. Code § 50-501 et seq.', summary: 'Covers new vehicles within 2 years or 18,000 miles' },
    landlordTenant: { name: 'DC Rental Housing Act', citation: 'D.C. Code § 42-3501.01 et seq.', summary: 'Very strong tenant protections; rent control; implied warranty of habitability' },
    agOffice: 'DC Attorney General',
    agWebsite: 'https://oag.dc.gov',
  },
};

/**
 * Category labels for the 13 dispute categories — used across state-rights pages.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  vehicle: 'Vehicle (Lemon Law)',
  housing: 'Housing & Tenant Rights',
  insurance: 'Insurance Claims',
  financial: 'Financial & Debt',
  contractors: 'Contractors & Home Improvement',
  'damaged-goods': 'Damaged Goods',
  refunds: 'Refunds & Returns',
  travel: 'Travel',
  utilities: 'Utilities',
  employment: 'Employment',
  ecommerce: 'E-Commerce',
  hoa: 'HOA',
  healthcare: 'Healthcare',
};

/**
 * Convert a state code to a URL slug.
 * e.g. "CA" → "california", "NY" → "new-york", "DC" → "district-of-columbia"
 */
export function getStateSlug(stateCode: string): string {
  const state = US_STATES.find(s => s.code === stateCode);
  if (!state) return stateCode.toLowerCase();
  return state.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert a URL slug back to a state code.
 * e.g. "california" → "CA", "new-york" → "NY"
 */
export function getStateFromSlug(slug: string): string | null {
  const state = US_STATES.find(s =>
    s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug
  );
  return state ? state.code : null;
}

/**
 * Get state-specific statutes relevant to a dispute category.
 */
export function getStateStatutesForCategory(
  stateCode: string,
  category: string
): StateStatute[] {
  const state = stateSpecificLaws[stateCode];
  if (!state) return [];

  const statutes: StateStatute[] = [state.consumerProtection];

  const categoryMap: Record<string, (keyof StateLawEntry)[]> = {
    vehicle: ['lemonLaw'],
    housing: ['landlordTenant'],
    insurance: ['insurance'],
    financial: ['debtCollection'],
    contractors: ['homeImprovement'],
    'damaged-goods': [],
    refunds: [],
    travel: [],
    utilities: [],
    employment: [],
    ecommerce: [],
    hoa: ['landlordTenant'],
    healthcare: ['insurance'],
  };

  const relevantKeys = categoryMap[category] || [];
  for (const key of relevantKeys) {
    const statute = state[key];
    if (statute && typeof statute === 'object' && 'citation' in statute) {
      statutes.push(statute as StateStatute);
    }
  }

  return statutes;
}

/**
 * Get state AG info for escalation references.
 */
export function getStateAGInfo(stateCode: string): { name: string; website: string } | null {
  const state = stateSpecificLaws[stateCode];
  if (!state) return null;
  return { name: state.agOffice, website: state.agWebsite };
}
