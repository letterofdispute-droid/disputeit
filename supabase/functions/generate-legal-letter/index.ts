import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateLegalLetterRequest {
  templateCategory: string;
  templateName: string;
  templateSlug: string;
  formData: Record<string, string>;
  jurisdiction: 'US' | 'UK' | 'EU' | 'generic';
  tone: 'neutral' | 'firm' | 'final';
  usState?: string;
}

/**
 * Legal Knowledge Database - Embedded for edge function
 */
const LEGAL_KNOWLEDGE: Record<string, {
  statutes: { name: string; citation: string; rights: string[] }[];
  agencies: { name: string; abbr: string; website: string }[];
  timeframes: { context: string; days: number }[];
  escalations: string[];
}> = {
  financial: {
    statutes: [
      { name: 'Fair Credit Reporting Act', citation: '15 U.S.C. § 1681', rights: ['Right to dispute inaccurate information', 'Right to free annual credit report', 'Right to sue for violations'] },
      { name: 'Fair Debt Collection Practices Act', citation: '15 U.S.C. § 1692', rights: ['Right to debt validation', 'Right to cease communication', 'Protection from harassment'] },
    ],
    agencies: [
      { name: 'Consumer Financial Protection Bureau', abbr: 'CFPB', website: 'consumerfinance.gov' },
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Credit bureau investigation', days: 30 }, { context: 'Debt validation response', days: 30 }],
    escalations: ['File CFPB complaint', 'Report to State Attorney General', 'Pursue legal action under FCRA'],
  },
  insurance: {
    statutes: [
      { name: 'State Insurance Code', citation: 'Varies by state', rights: ['Right to timely claim processing', 'Right to written denial explanation', 'Right to appeal'] },
    ],
    agencies: [
      { name: 'State Department of Insurance', abbr: 'DOI', website: 'naic.org' },
    ],
    timeframes: [{ context: 'Claim acknowledgment', days: 15 }, { context: 'Claim decision', days: 30 }],
    escalations: ['File complaint with State Insurance Commissioner', 'Request external review', 'Pursue bad faith claim'],
  },
  vehicle: {
    statutes: [
      { name: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. §§ 2301-2312', rights: ['Right to repair/replacement/refund', 'Right to sue for warranty violations', 'Right to attorney fee recovery'] },
      { name: 'State Lemon Law', citation: 'Varies by state', rights: ['Right to buyback after repeated repair failures', 'Right to replacement vehicle'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
      { name: 'National Highway Traffic Safety Administration', abbr: 'NHTSA', website: 'nhtsa.gov' },
    ],
    timeframes: [{ context: 'Warranty repair completion', days: 30 }, { context: 'Lemon law buyback response', days: 30 }],
    escalations: ['Invoke manufacturer dispute resolution', 'File State AG complaint', 'Pursue Lemon Law arbitration'],
  },
  housing: {
    statutes: [
      { name: 'Fair Housing Act', citation: '42 U.S.C. §§ 3601-3619', rights: ['Right to be free from discrimination', 'Right to reasonable accommodations'] },
      { name: 'State Landlord-Tenant Law', citation: 'Varies by state', rights: ['Right to habitable premises', 'Right to security deposit return', 'Right to repairs'] },
    ],
    agencies: [
      { name: 'Department of Housing and Urban Development', abbr: 'HUD', website: 'hud.gov' },
      { name: 'Local Housing Authority', abbr: 'LHA', website: 'varies' },
    ],
    timeframes: [{ context: 'Security deposit return', days: 30 }, { context: 'Emergency repairs', days: 3 }, { context: 'Non-emergency repairs', days: 14 }],
    escalations: ['File complaint with local code enforcement', 'Invoke repair-and-deduct', 'File small claims for deposit'],
  },
  refunds: {
    statutes: [
      { name: 'FTC Act Section 5', citation: '15 U.S.C. § 45', rights: ['Right to be free from deceptive practices'] },
      { name: 'Fair Credit Billing Act', citation: '15 U.S.C. § 1666', rights: ['Right to dispute billing errors', 'Right to withhold payment during dispute'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
      { name: 'State Attorney General', abbr: 'AG', website: 'naag.org' },
    ],
    timeframes: [{ context: 'Billing error acknowledgment', days: 30 }, { context: 'Refund processing', days: 7 }],
    escalations: ['File credit card chargeback', 'Report to FTC', 'File small claims suit'],
  },
  travel: {
    statutes: [
      { name: 'DOT Aviation Consumer Protection Regulations', citation: '14 CFR Part 259', rights: ['Right to refund for cancelled flights', 'Right to denied boarding compensation', 'Right to tarmac delay protocols'] },
    ],
    agencies: [
      { name: 'Department of Transportation', abbr: 'DOT', website: 'transportation.gov/airconsumer' },
    ],
    timeframes: [{ context: 'Flight refund (credit card)', days: 7 }, { context: 'Flight refund (cash)', days: 20 }],
    escalations: ['File DOT complaint', 'Dispute with credit card', 'Invoke Montreal Convention (international)'],
  },
  utilities: {
    statutes: [
      { name: 'Telecommunications Act', citation: '47 U.S.C. § 151', rights: ['Right to accurate billing', 'Right to service as advertised'] },
    ],
    agencies: [
      { name: 'Federal Communications Commission', abbr: 'FCC', website: 'fcc.gov' },
      { name: 'State Public Utility Commission', abbr: 'PUC', website: 'varies' },
    ],
    timeframes: [{ context: 'Billing dispute response', days: 30 }],
    escalations: ['File FCC complaint', 'File State PUC complaint', 'Report to State AG'],
  },
  employment: {
    statutes: [
      { name: 'Fair Labor Standards Act', citation: '29 U.S.C. § 201', rights: ['Right to minimum wage', 'Right to overtime pay', 'Right to recover back pay'] },
      { name: 'Title VII Civil Rights Act', citation: '42 U.S.C. § 2000e', rights: ['Right to be free from discrimination'] },
    ],
    agencies: [
      { name: 'Department of Labor', abbr: 'DOL', website: 'dol.gov' },
      { name: 'Equal Employment Opportunity Commission', abbr: 'EEOC', website: 'eeoc.gov' },
    ],
    timeframes: [{ context: 'Final paycheck', days: 14 }, { context: 'EEOC charge deadline', days: 180 }],
    escalations: ['File DOL wage complaint', 'File EEOC charge', 'Pursue private legal action'],
  },
  healthcare: {
    statutes: [
      { name: 'No Surprises Act', citation: 'Pub. L. 116-260', rights: ['Right to be free from surprise balance bills', 'Right to good faith cost estimate'] },
      { name: 'HIPAA', citation: '42 U.S.C. § 1320d', rights: ['Right to access medical records', 'Right to privacy'] },
    ],
    agencies: [
      { name: 'Centers for Medicare & Medicaid Services', abbr: 'CMS', website: 'cms.gov' },
      { name: 'State Department of Insurance', abbr: 'DOI', website: 'varies' },
    ],
    timeframes: [{ context: 'Appeal insurance denial', days: 60 }, { context: 'Dispute surprise bill', days: 30 }],
    escalations: ['File internal appeal', 'Request external review', 'Report to State Insurance Commissioner'],
  },
  ecommerce: {
    statutes: [
      { name: 'Electronic Fund Transfer Act', citation: '15 U.S.C. § 1693', rights: ['Right to dispute unauthorized transactions', 'Limited liability for fraud'] },
      { name: 'FTC Mail Order Rule', citation: '16 CFR Part 435', rights: ['Right to timely shipping or cancellation'] },
    ],
    agencies: [
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Ship within stated time or', days: 30 }, { context: 'EFT dispute', days: 60 }],
    escalations: ['File credit card dispute', 'Report to FTC', 'Use platform dispute resolution'],
  },
  hoa: {
    statutes: [
      { name: 'Fair Housing Act', citation: '42 U.S.C. §§ 3601-3619', rights: ['Right to be free from discriminatory enforcement'] },
      { name: 'State HOA Act', citation: 'Varies by state', rights: ['Right to open meetings', 'Right to financial disclosure', 'Right to dispute resolution'] },
    ],
    agencies: [
      { name: 'Department of Housing and Urban Development', abbr: 'HUD', website: 'hud.gov' },
      { name: 'State Real Estate Division', abbr: 'DRE', website: 'varies' },
    ],
    timeframes: [{ context: 'Fine appeal', days: 30 }, { context: 'Records request response', days: 30 }],
    escalations: ['Request formal hearing', 'File State complaint', 'Pursue mediation', 'File HUD complaint for discrimination'],
  },
  contractors: {
    statutes: [
      { name: 'State Home Improvement Act', citation: 'Varies by state', rights: ['Right to written contract', 'Right to rescission period', 'Right to lien waivers'] },
    ],
    agencies: [
      { name: 'State Contractor Licensing Board', abbr: 'CSLB', website: 'varies' },
      { name: 'State Attorney General', abbr: 'AG', website: 'naag.org' },
    ],
    timeframes: [{ context: 'Contract rescission (door-to-door)', days: 3 }, { context: 'Warranty claim', days: 365 }],
    escalations: ['Send written cure demand', 'File licensing board complaint', 'File bond claim', 'Pursue small claims'],
  },
  'damaged-goods': {
    statutes: [
      { name: 'Magnuson-Moss Warranty Act', citation: '15 U.S.C. §§ 2301-2312', rights: ['Right to repair/replacement/refund', 'Right to clear warranty terms'] },
      { name: 'UCC Implied Warranties', citation: 'Uniform Commercial Code', rights: ['Right to merchantable goods', 'Right to goods fit for purpose'] },
    ],
    agencies: [
      { name: 'Consumer Product Safety Commission', abbr: 'CPSC', website: 'cpsc.gov' },
      { name: 'Federal Trade Commission', abbr: 'FTC', website: 'ftc.gov' },
    ],
    timeframes: [{ context: 'Reject defective goods', days: 30 }, { context: 'Warranty claim response', days: 30 }],
    escalations: ['Return within reasonable time', 'File chargeback', 'Report unsafe products to CPSC', 'File small claims'],
  },
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  neutral: `
TONE: Professional and Courteous
- Use polite but clear language
- Reference legal rights as context, not threats
- Request resolution as a reasonable expectation
- Closing: "I trust this matter can be resolved amicably"
`,
  firm: `
TONE: Firm and Direct
- Use assertive, unambiguous language
- Clearly state violations and legal basis
- Demand specific resolution with deadline
- Reference regulatory oversight
- Closing: "I expect prompt resolution of this matter"
`,
  final: `
TONE: Final Notice / Pre-Escalation
- State this is a final attempt at informal resolution
- Cite specific statutory violations with precision
- List concrete next steps if unresolved (regulatory complaints, legal action)
- Include explicit deadline
- Closing: "If I do not receive a satisfactory response by [deadline], I will be compelled to pursue all available remedies including [specific agencies/courts]"
`
};

/**
 * State-specific law database (embedded for edge function)
 * Maps state codes to their consumer protection statutes by category
 */
const STATE_LAWS: Record<string, Record<string, { name: string; citation: string; summary: string }[]>> = {
  CA: {
    _general: [{ name: 'California Consumer Legal Remedies Act', citation: 'Cal. Civ. Code § 1750 et seq.', summary: 'Strong consumer protections with actual damages, punitive damages, and attorney fees' }],
    vehicle: [{ name: 'Song-Beverly Consumer Warranty Act', citation: 'Cal. Civ. Code § 1790 et seq.', summary: 'One of the strongest lemon laws; covers new and used certified vehicles; 2x damages for willful violations' }],
    housing: [{ name: 'California Civil Code - Landlord-Tenant', citation: 'Cal. Civ. Code § 1940 et seq.', summary: 'Extensive tenant protections; rent control in many cities; 21-day deposit return; repair-and-deduct rights' }],
    insurance: [{ name: 'California Fair Claims Settlement Practices', citation: 'Cal. Ins. Code § 790.03', summary: '15-day acknowledgment, 40-day decision requirements' }],
    financial: [{ name: 'Rosenthal Fair Debt Collection Practices Act', citation: 'Cal. Civ. Code § 1788 et seq.', summary: 'Extends FDCPA protections to original creditors' }],
    contractors: [{ name: 'Contractors State License Law', citation: 'Cal. Bus. & Prof. Code § 7000 et seq.', summary: 'Requires contractor licensing; homeowners can recover from CSLB guarantee fund' }],
  },
  TX: {
    _general: [{ name: 'Texas Deceptive Trade Practices Act (DTPA)', citation: 'Tex. Bus. & Com. Code § 17.41 et seq.', summary: 'Very strong; treble damages for knowing violations' }],
    vehicle: [{ name: 'Texas Lemon Law', citation: 'Tex. Occ. Code § 2301.601 et seq.', summary: 'TXDMV arbitration program; covers vehicles within 24 months/24,000 miles' }],
    housing: [{ name: 'Texas Property Code - Landlord-Tenant', citation: 'Tex. Prop. Code § 92.001 et seq.', summary: 'Landlord duty to repair; 30-day deposit return; repair-and-deduct for certain conditions' }],
    insurance: [{ name: 'Texas Insurance Code - Prompt Payment', citation: 'Tex. Ins. Code § 542.051 et seq.', summary: '15-day acknowledgment; 18% penalty for late payment' }],
    financial: [{ name: 'Texas Debt Collection Act', citation: 'Tex. Fin. Code § 392.001 et seq.', summary: 'State-level debt collection protections supplementing federal FDCPA' }],
    contractors: [{ name: 'Texas Residential Construction Liability Act', citation: 'Tex. Prop. Code § 27.001 et seq.', summary: '60-day notice before suing contractor; opportunity to inspect and repair' }],
  },
  NY: {
    _general: [{ name: 'New York General Business Law', citation: 'N.Y. Gen. Bus. Law § 349-350', summary: '$50 minimum statutory damages; treble damages up to $1,000 for willful violations' }],
    vehicle: [{ name: 'New York Lemon Law', citation: 'N.Y. Gen. Bus. Law § 198-a', summary: 'Covers new and used vehicles; one of the strongest in the US' }],
    housing: [{ name: 'New York Real Property Law', citation: 'N.Y. Real Prop. Law § 220 et seq.', summary: 'Very strong tenant protections; warranty of habitability; rent stabilization in NYC' }],
    contractors: [{ name: 'NY Home Improvement Fraud Prevention Act', citation: 'N.Y. Gen. Bus. Law § 770 et seq.', summary: 'Requires written contracts; contractor must provide notice of cancellation rights' }],
  },
  FL: {
    _general: [{ name: 'Florida Deceptive and Unfair Trade Practices Act (FDUTPA)', citation: 'Fla. Stat. § 501.201 et seq.', summary: 'Actual damages plus attorney fees' }],
    vehicle: [{ name: 'Florida Lemon Law', citation: 'Fla. Stat. § 681.10 et seq.', summary: 'Covers new vehicles within 24 months; includes leased vehicles; free arbitration' }],
    housing: [{ name: 'Florida Residential Landlord and Tenant Act', citation: 'Fla. Stat. § 83.40 et seq.', summary: 'Landlord has 7 days for urgent repairs; 15-30 day deposit return' }],
    insurance: [{ name: 'Florida Insurance Code - Claims Handling', citation: 'Fla. Stat. § 626.9541', summary: '14-day acknowledgment; 90-day decision' }],
  },
  IL: {
    _general: [{ name: 'Illinois Consumer Fraud Act', citation: '815 ILCS 505/1 et seq.', summary: 'Broad consumer protections; actual damages, punitive damages, and attorney fees' }],
    vehicle: [{ name: 'Illinois New Vehicle Buyer Protection Act', citation: '815 ILCS 380/1 et seq.', summary: 'Covers new vehicles within 12 months or 12,000 miles; 4 repair attempts' }],
    housing: [{ name: 'Illinois Landlord and Tenant Act', citation: '765 ILCS 705 et seq.', summary: 'Varies by municipality; Chicago RLTO provides strong protections' }],
  },
  PA: {
    _general: [{ name: 'Pennsylvania Unfair Trade Practices Law', citation: '73 Pa. Stat. § 201-1 et seq.', summary: 'Treble damages available' }],
    vehicle: [{ name: 'Pennsylvania Lemon Law', citation: '73 Pa. Stat. § 1951 et seq.', summary: '3 repair attempts within 1 year or 12,000 miles' }],
    contractors: [{ name: 'PA Home Improvement Consumer Protection Act', citation: '73 Pa. Stat. § 517.1 et seq.', summary: 'Requires contractor registration; written contracts; recovery fund' }],
  },
  OH: {
    _general: [{ name: 'Ohio Consumer Sales Practices Act', citation: 'Ohio Rev. Code § 1345.01 et seq.', summary: 'Treble damages for knowing violations' }],
    vehicle: [{ name: 'Ohio Lemon Law', citation: 'Ohio Rev. Code § 1345.71 et seq.', summary: '3 repair attempts or 30 days within 1 year or 18,000 miles' }],
  },
  GA: {
    _general: [{ name: 'Georgia Fair Business Practices Act', citation: 'Ga. Code § 10-1-390 et seq.', summary: 'Injunctive relief and damages' }],
    vehicle: [{ name: 'Georgia Lemon Law', citation: 'Ga. Code § 10-1-780 et seq.', summary: '3 repair attempts within 24 months or 24,000 miles' }],
  },
  NJ: {
    _general: [{ name: 'New Jersey Consumer Fraud Act', citation: 'N.J. Stat. § 56:8-1 et seq.', summary: 'Very strong; treble damages; broad definition of fraud' }],
    vehicle: [{ name: 'New Jersey Lemon Law', citation: 'N.J. Stat. § 56:12-29 et seq.', summary: 'Covers new vehicles within 2 years or 24,000 miles; includes leased vehicles' }],
    contractors: [{ name: 'NJ Home Improvement Practices', citation: 'N.J. Admin. Code § 13:45A-16', summary: 'Requires contractor registration; written contracts; specific disclosure requirements' }],
  },
  MA: {
    _general: [{ name: 'Massachusetts Chapter 93A', citation: 'Mass. Gen. Laws ch. 93A', summary: 'Very strong; mandatory demand letter before suit; double or treble damages' }],
    vehicle: [{ name: 'Massachusetts Lemon Law', citation: 'Mass. Gen. Laws ch. 90 § 7N½', summary: 'Covers new vehicles within 1 year or 15,000 miles' }],
    contractors: [{ name: 'MA Home Improvement Contractor Law', citation: 'Mass. Gen. Laws ch. 142A', summary: 'Requires contractor registration; written contracts for work over $1,000' }],
  },
  WA: {
    _general: [{ name: 'Washington Consumer Protection Act', citation: 'Wash. Rev. Code § 19.86.010 et seq.', summary: 'Strong protections; treble damages' }],
    vehicle: [{ name: 'Washington Lemon Law', citation: 'Wash. Rev. Code § 19.118.005 et seq.', summary: '2 years or 24,000 miles; arbitration available' }],
  },
  CO: {
    _general: [{ name: 'Colorado Consumer Protection Act', citation: 'Colo. Rev. Stat. § 6-1-101 et seq.', summary: 'Treble damages available' }],
    vehicle: [{ name: 'Colorado Lemon Law', citation: 'Colo. Rev. Stat. § 42-10-101 et seq.', summary: '4 repair attempts or 30+ business days out of service within 1 year' }],
  },
  VA: {
    _general: [{ name: 'Virginia Consumer Protection Act', citation: 'Va. Code § 59.1-196 et seq.', summary: 'Prohibits fraudulent acts or practices' }],
    vehicle: [{ name: 'Virginia Motor Vehicle Warranty Act', citation: 'Va. Code § 59.1-207.9 et seq.', summary: '3 repair attempts or 30 days within 18 months' }],
  },
  NC: {
    _general: [{ name: 'North Carolina Unfair and Deceptive Trade Practices Act', citation: 'N.C. Gen. Stat. § 75-1.1', summary: 'Treble damages for violations' }],
    vehicle: [{ name: 'North Carolina Lemon Law', citation: 'N.C. Gen. Stat. § 20-351 et seq.', summary: '4 repair attempts within 24 months or 24,000 miles' }],
  },
  AZ: {
    _general: [{ name: 'Arizona Consumer Fraud Act', citation: 'Ariz. Rev. Stat. § 44-1521 et seq.', summary: 'Prohibits deception, fraud, misrepresentation' }],
    vehicle: [{ name: 'Arizona Lemon Law', citation: 'Ariz. Rev. Stat. § 44-1261 et seq.', summary: '4 repair attempts within 2 years or 24,000 miles' }],
  },
  MI: {
    _general: [{ name: 'Michigan Consumer Protection Act', citation: 'Mich. Comp. Laws § 445.901 et seq.', summary: '$250 minimum damages' }],
    vehicle: [{ name: 'Michigan Lemon Law', citation: 'Mich. Comp. Laws § 257.1401 et seq.', summary: '4 repair attempts or 30 days within warranty' }],
  },
  CT: {
    _general: [{ name: 'Connecticut Unfair Trade Practices Act (CUTPA)', citation: 'Conn. Gen. Stat. § 42-110a et seq.', summary: 'Broad prohibition; punitive damages available' }],
    contractors: [{ name: 'Connecticut Home Improvement Act', citation: 'Conn. Gen. Stat. § 20-418 et seq.', summary: 'Written contracts for work over $200; 3-day right of rescission' }],
  },
  MN: {
    _general: [{ name: 'Minnesota Prevention of Consumer Fraud Act', citation: 'Minn. Stat. § 325F.68 et seq.', summary: 'Prohibits fraud, false advertising, and deceptive trade practices' }],
    vehicle: [{ name: 'Minnesota Lemon Law', citation: 'Minn. Stat. § 325F.665', summary: '2 years or warranty period; manufacturer arbitration required' }],
  },
  OR: {
    _general: [{ name: 'Oregon Unlawful Trade Practices Act', citation: 'Or. Rev. Stat. § 646.605 et seq.', summary: 'Actual damages or $200 minimum' }],
  },
  TN: {
    _general: [{ name: 'Tennessee Consumer Protection Act', citation: 'Tenn. Code § 47-18-101 et seq.', summary: 'Treble damages for willful violations' }],
  },
  IN: {
    _general: [{ name: 'Indiana Deceptive Consumer Sales Act', citation: 'Ind. Code § 24-5-0.5-1 et seq.', summary: 'Treble damages for knowing violations' }],
  },
  WI: {
    _general: [{ name: 'Wisconsin Deceptive Trade Practices Act', citation: 'Wis. Stat. § 100.18', summary: 'Double damages available' }],
  },
  MD: {
    _general: [{ name: 'Maryland Consumer Protection Act', citation: 'Md. Code Com. Law § 13-101 et seq.', summary: 'Broad prohibition on unfair, abusive, or deceptive practices' }],
  },
  MO: {
    _general: [{ name: 'Missouri Merchandising Practices Act', citation: 'Mo. Rev. Stat. § 407.010 et seq.', summary: 'Prohibits deception; private right of action' }],
  },
  SC: {
    _general: [{ name: 'South Carolina Unfair Trade Practices Act', citation: 'S.C. Code § 39-5-10 et seq.', summary: 'Treble damages' }],
  },
  AL: {
    _general: [{ name: 'Alabama Deceptive Trade Practices Act', citation: 'Ala. Code § 8-19-1 et seq.', summary: 'Prohibits unconscionable, deceptive, or fraudulent practices' }],
  },
  KY: {
    _general: [{ name: 'Kentucky Consumer Protection Act', citation: 'Ky. Rev. Stat. § 367.110 et seq.', summary: 'Prohibits unfair, false, misleading, or deceptive acts' }],
  },
  LA: {
    _general: [{ name: 'Louisiana Unfair Trade Practices Law', citation: 'La. Rev. Stat. § 51:1401 et seq.', summary: 'Actual damages and attorney fees' }],
  },
  OK: {
    _general: [{ name: 'Oklahoma Consumer Protection Act', citation: 'Okla. Stat. tit. 15, § 751 et seq.', summary: 'AG enforcement and private right of action' }],
  },
  IA: {
    _general: [{ name: 'Iowa Consumer Fraud Act', citation: 'Iowa Code § 714H.1 et seq.', summary: 'Prohibits deception and unfair practices' }],
  },
  UT: {
    _general: [{ name: 'Utah Consumer Sales Practices Act', citation: 'Utah Code § 13-11-1 et seq.', summary: 'Prohibits deceptive and unconscionable sales practices' }],
  },
  NV: {
    _general: [{ name: 'Nevada Deceptive Trade Practices Act', citation: 'Nev. Rev. Stat. § 598.0903 et seq.', summary: 'Injunctive relief and damages' }],
  },
  KS: {
    _general: [{ name: 'Kansas Consumer Protection Act', citation: 'Kan. Stat. § 50-623 et seq.', summary: 'Prohibits deceptive and unconscionable acts' }],
  },
  NM: {
    _general: [{ name: 'New Mexico Unfair Practices Act', citation: 'N.M. Stat. § 57-12-1 et seq.', summary: 'Treble damages available' }],
  },
  NE: {
    _general: [{ name: 'Nebraska Consumer Protection Act', citation: 'Neb. Rev. Stat. § 59-1601 et seq.', summary: 'AG enforcement with consumer complaint process' }],
  },
  HI: {
    _general: [{ name: 'Hawaii Unfair or Deceptive Acts or Practices', citation: 'Haw. Rev. Stat. § 480-1 et seq.', summary: 'Treble damages and attorney fees' }],
  },
  WV: {
    _general: [{ name: 'West Virginia Consumer Credit and Protection Act', citation: 'W. Va. Code § 46A-1-101 et seq.', summary: 'Prohibits unfair or deceptive acts' }],
  },
  ID: {
    _general: [{ name: 'Idaho Consumer Protection Act', citation: 'Idaho Code § 48-601 et seq.', summary: 'Prohibits unfair methods of competition and deceptive practices' }],
  },
  ME: {
    _general: [{ name: 'Maine Unfair Trade Practices Act', citation: 'Me. Rev. Stat. tit. 5, § 205-A et seq.', summary: 'Prohibits unfair or deceptive acts' }],
  },
  NH: {
    _general: [{ name: 'New Hampshire Consumer Protection Act', citation: 'N.H. Rev. Stat. § 358-A:1 et seq.', summary: 'Treble damages and attorney fees available' }],
  },
  RI: {
    _general: [{ name: 'Rhode Island Deceptive Trade Practices Act', citation: 'R.I. Gen. Laws § 6-13.1-1 et seq.', summary: 'Damages and attorney fees' }],
  },
  MT: {
    _general: [{ name: 'Montana Unfair Trade Practices Act', citation: 'Mont. Code § 30-14-101 et seq.', summary: 'Prohibits unfair or deceptive practices' }],
  },
  DE: {
    _general: [{ name: 'Delaware Consumer Fraud Act', citation: 'Del. Code tit. 6, § 2511 et seq.', summary: 'Treble damages available' }],
  },
  SD: {
    _general: [{ name: 'South Dakota Deceptive Trade Practices Act', citation: 'S.D. Codified Laws § 37-24-1 et seq.', summary: 'Prohibits deceptive acts' }],
  },
  ND: {
    _general: [{ name: 'North Dakota Consumer Fraud Act', citation: 'N.D. Cent. Code § 51-15-01 et seq.', summary: 'Prohibits deceptive acts in consumer transactions' }],
  },
  AK: {
    _general: [{ name: 'Alaska Unfair Trade Practices Act', citation: 'Alaska Stat. § 45.50.471 et seq.', summary: 'Prohibits unfair methods of competition and unfair or deceptive acts' }],
  },
  VT: {
    _general: [{ name: 'Vermont Consumer Protection Act', citation: 'Vt. Stat. tit. 9, § 2451 et seq.', summary: 'Damages and attorney fees' }],
  },
  WY: {
    _general: [{ name: 'Wyoming Consumer Protection Act', citation: 'Wyo. Stat. § 40-12-101 et seq.', summary: 'Prohibits deceptive trade practices' }],
  },
  AR: {
    _general: [{ name: 'Arkansas Deceptive Trade Practices Act', citation: 'Ark. Code § 4-88-101 et seq.', summary: 'Civil remedies for deceptive and unconscionable practices' }],
  },
  MS: {
    _general: [{ name: 'Mississippi Consumer Protection Act', citation: 'Miss. Code § 75-24-1 et seq.', summary: 'Prohibits unfair or deceptive trade practices' }],
  },
  DC: {
    _general: [{ name: 'DC Consumer Protection Procedures Act', citation: 'D.C. Code § 28-3901 et seq.', summary: 'Broad prohibition; treble damages; strong enforcement' }],
  },
};

// Maps 2-letter state codes to URL slugs for /state-rights pages
const STATE_CODE_TO_SLUG: Record<string, string> = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
  CO: 'colorado', CT: 'connecticut', DE: 'delaware', DC: 'washington-dc', FL: 'florida',
  GA: 'georgia', HI: 'hawaii', ID: 'idaho', IL: 'illinois', IN: 'indiana',
  IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana', ME: 'maine',
  MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota', MS: 'mississippi',
  MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada', NH: 'new-hampshire',
  NJ: 'new-jersey', NM: 'new-mexico', NY: 'new-york', NC: 'north-carolina', ND: 'north-dakota',
  OH: 'ohio', OK: 'oklahoma', OR: 'oregon', PA: 'pennsylvania', RI: 'rhode-island',
  SC: 'south-carolina', SD: 'south-dakota', TN: 'tennessee', TX: 'texas', UT: 'utah',
  VT: 'vermont', VA: 'virginia', WA: 'washington', WV: 'west-virginia', WI: 'wisconsin', WY: 'wyoming',
};

// Maps template category IDs to state-rights URL segments
const CATEGORY_TO_RIGHTS_SLUG: Record<string, string> = {
  vehicle: 'vehicle', housing: 'housing', financial: 'financial', employment: 'employment',
  insurance: 'insurance', healthcare: 'healthcare', ecommerce: 'ecommerce',
  utilities: 'utilities', contractors: 'contractors', refunds: 'refunds',
  travel: 'travel', hoa: 'hoa', 'damaged-goods': 'damaged-goods',
};

/**
 * Build a state rights page reference to include in the letter closing, if applicable.
 * Returns a short instruction for the AI to mention the URL as a resource.
 */
function getStateRightsReference(stateCode: string, category: string): string {
  const stateSlug = STATE_CODE_TO_SLUG[stateCode];
  const categorySlug = CATEGORY_TO_RIGHTS_SLUG[category];
  if (!stateSlug || !categorySlug) return '';

  const url = `https://letterofdispute.com/state-rights/${stateSlug}/${categorySlug}`;
  const stateName = stateCode === 'DC' ? 'Washington D.C.' : (STATE_LAWS[stateCode]?._general?.[0]?.citation?.split(' ')[0] ?? stateCode);

  return `\n\nSTATE RIGHTS RESOURCE:
In the NOTICE OF FURTHER ACTION section, naturally mention that the recipient can review full ${stateName} ${category} consumer rights at: ${url}
Use phrasing such as: "For a full overview of your rights under ${stateName} law, refer to ${url}"
Only include this if it fits naturally — do not force it if the letter flow does not support it.`;
}

/**
 * Get state-specific statutes for the system prompt
 */
function getStateStatutes(stateCode: string, category: string): string {
  const stateLaws = STATE_LAWS[stateCode];
  if (!stateLaws) return '';

  const statutes: { name: string; citation: string; summary: string }[] = [];
  
  // Always include general consumer protection
  if (stateLaws._general) statutes.push(...stateLaws._general);
  
  // Add category-specific statutes
  if (stateLaws[category]) statutes.push(...stateLaws[category]);

  if (statutes.length === 0) return '';

  return `\n\nSTATE-SPECIFIC STATUTES (${stateCode}):\n` +
    statutes.map(s => `- ${s.name} (${s.citation}): ${s.summary}`).join('\n') +
    '\n\nIMPORTANT: Cite these state-specific statutes alongside federal laws where applicable. Reference the state AG office for escalation.';
}

/**
 * Build the legal expert system prompt
 */
function buildSystemPrompt(category: string, jurisdiction: string, tone: string, usState?: string): string {
  const knowledge = LEGAL_KNOWLEDGE[category] || LEGAL_KNOWLEDGE['refunds'];
  
  const statuteList = knowledge.statutes
    .map(s => `- ${s.name} (${s.citation}): ${s.rights.join('; ')}`)
    .join('\n');
  
  const agencyList = knowledge.agencies
    .map(a => `- ${a.name} (${a.abbr}) - ${a.website}`)
    .join('\n');
  
  const timeframeList = knowledge.timeframes
    .map(t => `- ${t.context}: ${t.days} days`)
    .join('\n');
  
  const escalationList = knowledge.escalations
    .map(e => `- ${e}`)
    .join('\n');

  // Add state-specific statutes if available
  const stateSection = usState ? getStateStatutes(usState, category) : '';

  // Add state rights page reference for the letter closing
  const stateRightsRef = usState ? getStateRightsReference(usState, category) : '';

  return `You are an experienced consumer rights attorney drafting a formal dispute letter for a client.

JURISDICTION: ${jurisdiction}${usState ? ` (State: ${usState})` : ''}

APPLICABLE LEGAL FRAMEWORK:
${statuteList}
${stateSection}

REGULATORY AGENCIES:
${agencyList}

KEY TIMEFRAMES:
${timeframeList}

ESCALATION PATHS:
${escalationList}

${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.firm}

LETTER STRUCTURE (you MUST follow this format):
1. RE: Line with clear subject and reference numbers
2. Opening paragraph establishing the dispute and legal basis
3. BACKGROUND section with chronological facts
4. LEGAL BASIS section citing specific statutes and violations${usState ? ' (include state-specific statutes)' : ''}
5. REQUESTED RESOLUTION section with numbered demands
6. NOTICE OF FURTHER ACTION section with deadline and escalation paths
7. Closing with signature block placeholder

WRITING RULES:
- Write in first person as the consumer
- Be factually precise - only reference facts provided by the user
- Cite specific statute sections when applicable${usState ? '\n- Reference state-specific statutes where they provide stronger protections than federal law' : ''}
- Include specific deadlines (calculate from today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
- Reference regulatory complaint processes with specificity
- Use formal legal letter formatting
- DO NOT include placeholders like [Your Name] - leave space for signature block

CRITICAL RESTRICTIONS:
- NEVER provide legal advice or promise outcomes
- NEVER invent facts not provided by the user
- NEVER make threats without legal basis
- NEVER cite statutes outside the provided framework unless you are certain they apply
- NEVER guarantee success or specific results
- If user data is incomplete, write around it professionally

OUTPUT FORMAT:
Return ONLY the letter body text, starting with "Re:" line.
Do not include any preamble or explanation.${stateRightsRef ? `\n${stateRightsRef}` : ''}`;
}

/**
 * Build the user prompt from form data
 */
function buildUserPrompt(templateName: string, formData: Record<string, string>): string {
  // Filter out empty values and format nicely
  const facts = Object.entries(formData)
    .filter(([_, value]) => value && value.trim())
    .map(([key, value]) => {
      // Convert camelCase to readable format
      const readableKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      return `${readableKey}: ${value}`;
    })
    .join('\n');

  return `Draft a formal dispute letter for the following matter:

TEMPLATE TYPE: ${templateName}

CLIENT'S FACTS:
${facts}

Generate a complete, professionally written dispute letter based on these facts. The letter should be ready to print and send.`;
}

/**
 * Validate AI output for safety
 */
function validateOutput(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for promises of outcomes
  const promisePatterns = [
    /you will win/i,
    /guaranteed/i,
    /I guarantee/i,
    /certain to succeed/i,
    /will definitely/i,
  ];
  
  for (const pattern of promisePatterns) {
    if (pattern.test(content)) {
      issues.push(`Contains promise language: ${pattern.source}`);
    }
  }
  
  // Check for inappropriate threats
  const threatPatterns = [
    /I will sue you personally/i,
    /criminal charges/i,
    /have you arrested/i,
    /destroy your/i,
  ];
  
  for (const pattern of threatPatterns) {
    if (pattern.test(content)) {
      issues.push(`Contains inappropriate threat: ${pattern.source}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: GenerateLegalLetterRequest = await req.json();
    const { templateCategory, templateName, formData, jurisdiction, tone, usState } = body;

    if (!templateCategory || !templateName || !formData) {
      throw new Error("Missing required fields: templateCategory, templateName, formData");
    }

    console.log(`Generating legal letter for ${templateName} (${templateCategory}) - ${tone} tone, ${jurisdiction} jurisdiction${usState ? `, state: ${usState}` : ''}`);

    const systemPrompt = buildSystemPrompt(templateCategory, jurisdiction, tone, usState);
    const userPrompt = buildUserPrompt(templateName, formData);

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, professional output
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const letterContent = aiData.choices?.[0]?.message?.content;

    if (!letterContent) {
      throw new Error("AI returned empty content");
    }

    // Validate the output
    const validation = validateOutput(letterContent);
    if (!validation.valid) {
      console.warn("Letter validation issues:", validation.issues);
      // Don't block, just log - the letter is still usable
    }

    console.log(`Successfully generated letter (${letterContent.length} characters)`);

    return new Response(
      JSON.stringify({
        success: true,
        letterContent,
        metadata: {
          templateCategory,
          templateName,
          jurisdiction,
          tone,
          generatedAt: new Date().toISOString(),
          validationIssues: validation.issues,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating legal letter:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
