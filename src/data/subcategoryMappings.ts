// Subcategory mappings derived from template IDs and categories
// This allows us to infer subcategories without modifying 400+ template files

export interface SubcategoryInfo {
  name: string;
  slug: string;
}

// Mapping of category to subcategory detection patterns
const subcategoryPatterns: Record<string, { pattern: RegExp | string; subcategory: SubcategoryInfo }[]> = {
  'Contractors': [
    { pattern: /^general-|project-delay|cost-overrun|abandoned-|unfinished-|permit-|lien-|contract-dispute/, subcategory: { name: 'General Contractor', slug: 'general' } },
    { pattern: /plumb|leak|pipe|water-heater|drain|sewage|toilet|faucet/, subcategory: { name: 'Plumbing', slug: 'plumbing' } },
    { pattern: /electri|wiring|outlet|panel|circuit|breaker|electrical/, subcategory: { name: 'Electrical', slug: 'electrical' } },
    { pattern: /roof|gutter|shingle|flashing|skylight/, subcategory: { name: 'Roofing', slug: 'roofing' } },
    { pattern: /hvac|heating|cooling|air-conditioning|furnace|ac-|heat-pump|ductwork|thermostat/, subcategory: { name: 'HVAC', slug: 'hvac' } },
    { pattern: /landscap|lawn|irrigation|sprinkler|tree|garden|hardscape|patio|deck/, subcategory: { name: 'Landscaping', slug: 'landscaping' } },
    { pattern: /floor|paint|carpet|tile|hardwood|laminate|wallpaper|stain/, subcategory: { name: 'Flooring & Painting', slug: 'flooring-painting' } },
    { pattern: /kitchen|bath|cabinet|countertop|remodel/, subcategory: { name: 'Kitchen & Bath', slug: 'kitchen-bath' } },
    { pattern: /window|door|siding|glass/, subcategory: { name: 'Windows & Doors', slug: 'windows-doors' } },
    { pattern: /pool|fence|garage|foundation|basement|concrete|masonry|solar|home-security|pest|mold|asbestos|demolition/, subcategory: { name: 'Specialty Services', slug: 'specialty' } },
  ],
  'Healthcare': [
    { pattern: /insurance-|claim-denial|prior-auth|pre-auth|coverage/, subcategory: { name: 'Insurance Claims', slug: 'insurance-claims' } },
    { pattern: /billing-|overcharge|invoice|charge-dispute|itemized/, subcategory: { name: 'Medical Billing', slug: 'billing' } },
    { pattern: /debt-|collection|collector/, subcategory: { name: 'Debt Collection', slug: 'debt-collection' } },
    { pattern: /hospital|provider|doctor|physician|nurse|staff|facility/, subcategory: { name: 'Provider Complaints', slug: 'provider' } },
    { pattern: /prescription|pharmacy|medication|rx|drug/, subcategory: { name: 'Pharmacy Issues', slug: 'pharmacy' } },
    { pattern: /hipaa|privacy|records|medical-record/, subcategory: { name: 'Privacy & Records', slug: 'privacy-records' } },
  ],
  'Insurance': [
    { pattern: /auto-|car-|vehicle-|accident-claim|collision/, subcategory: { name: 'Auto Insurance', slug: 'auto' } },
    { pattern: /home-|property-|homeowner|damage-claim|storm|fire|water-damage|theft-claim/, subcategory: { name: 'Home Insurance', slug: 'home' } },
    { pattern: /health-|medical-insurance|claim-denial|pre-existing|out-of-network/, subcategory: { name: 'Health Insurance', slug: 'health' } },
    { pattern: /life-|beneficiary|death-benefit/, subcategory: { name: 'Life Insurance', slug: 'life' } },
    { pattern: /travel-|trip-|flight-insurance|luggage-insurance/, subcategory: { name: 'Travel Insurance', slug: 'travel' } },
    { pattern: /pet-|veterinary/, subcategory: { name: 'Pet Insurance', slug: 'pet' } },
    { pattern: /business-|liability|professional/, subcategory: { name: 'Business Insurance', slug: 'business' } },
  ],
  'Housing': [
    { pattern: /repair|maintenance|fix|broken|mold|pest|heating|plumbing-issue/, subcategory: { name: 'Repair & Maintenance', slug: 'repairs' } },
    { pattern: /deposit|security|move-out|deduction/, subcategory: { name: 'Deposits & Move-Out', slug: 'deposits' } },
    { pattern: /rent-|lease|eviction|tenancy|notice-to-quit/, subcategory: { name: 'Tenancy Disputes', slug: 'tenancy' } },
    { pattern: /neighbor|noise|nuisance/, subcategory: { name: 'Neighbor Issues', slug: 'neighbor' } },
    { pattern: /letting-agent|property-manager|estate-agent|management-company/, subcategory: { name: 'Letting Agents', slug: 'letting-agents' } },
    { pattern: /safety|fire-safety|gas-safety|electrical-safety|habitability/, subcategory: { name: 'Safety & Compliance', slug: 'safety' } },
  ],
  'Travel': [
    { pattern: /flight|airline|delay|cancellation|eu261|baggage|luggage|boarding|overbooking/, subcategory: { name: 'Flights', slug: 'flights' } },
    { pattern: /hotel|accommodation|booking|reservation|room/, subcategory: { name: 'Hotels', slug: 'hotels' } },
    { pattern: /cruise|ship|cabin|onboard/, subcategory: { name: 'Cruises', slug: 'cruises' } },
    { pattern: /car-rental|rental-car|hire-car|vehicle-rental/, subcategory: { name: 'Car Rentals', slug: 'car-rentals' } },
    { pattern: /tour|package|travel-agent|vacation|holiday/, subcategory: { name: 'Tours & Packages', slug: 'tours' } },
    { pattern: /rail|train|bus|coach/, subcategory: { name: 'Rail & Bus', slug: 'rail-bus' } },
  ],
  'Employment': [
    { pattern: /wage|pay|salary|overtime|commission|bonus|paycheck|equal-pay/, subcategory: { name: 'Wages & Pay', slug: 'wages' } },
    { pattern: /terminat|fired|dismissal|wrongful|severance/, subcategory: { name: 'Termination', slug: 'termination' } },
    { pattern: /sexual-harassment/, subcategory: { name: 'Sexual Harassment', slug: 'sexual-harassment' } },
    { pattern: /mobbing/, subcategory: { name: 'Workplace Mobbing', slug: 'mobbing' } },
    { pattern: /retaliation|fmla/, subcategory: { name: 'Retaliation & Leave', slug: 'retaliation' } },
    { pattern: /hostile-work-environment/, subcategory: { name: 'Hostile Work Environment', slug: 'hostile-environment' } },
    { pattern: /discriminat|harassment|racial|age-discrim|disability-harass|religious-discrim|lgbtq|pregnancy-discrim/, subcategory: { name: 'Discrimination', slug: 'discrimination' } },
    { pattern: /benefit|401k|health-insurance|pto|vacation|leave/, subcategory: { name: 'Benefits', slug: 'benefits' } },
    { pattern: /workplace|safety|osha|condition|ergonomic|bullying/, subcategory: { name: 'Workplace Conditions', slug: 'workplace' } },
  ],
  'Utilities & Telecom': [
    { pattern: /energy|gas|electric|power|utility-bill/, subcategory: { name: 'Energy', slug: 'energy' } },
    { pattern: /water|sewage|sewer/, subcategory: { name: 'Water', slug: 'water' } },
    { pattern: /internet|broadband|wifi|isp|fiber/, subcategory: { name: 'Internet', slug: 'internet' } },
    { pattern: /phone|mobile|cell|carrier|telecom|sms|call/, subcategory: { name: 'Phone & Mobile', slug: 'phone' } },
    { pattern: /cable|tv|streaming|satellite/, subcategory: { name: 'TV & Cable', slug: 'tv-cable' } },
  ],
  'Financial': [
    { pattern: /bank|account|checking|savings|atm|branch/, subcategory: { name: 'Banking', slug: 'banking' } },
    { pattern: /credit-card|charge|statement|interest|apr/, subcategory: { name: 'Credit Cards', slug: 'credit-cards' } },
    { pattern: /loan|mortgage|lending|interest-rate/, subcategory: { name: 'Loans', slug: 'loans' } },
    { pattern: /credit-report|credit-score|bureau|equifax|experian|transunion/, subcategory: { name: 'Credit Reports', slug: 'credit-reports' } },
    { pattern: /debt|collection|collector/, subcategory: { name: 'Debt Collection', slug: 'debt-collection' } },
    { pattern: /investment|broker|advisor|retirement|401k/, subcategory: { name: 'Investments', slug: 'investments' } },
    { pattern: /scam|fraud|unauthorized|identity/, subcategory: { name: 'Fraud & Scams', slug: 'fraud' } },
  ],
  'Refunds & Purchases': [
    { pattern: /refund|return|money-back/, subcategory: { name: 'Refunds', slug: 'refunds' } },
    { pattern: /warranty|guarantee|defect/, subcategory: { name: 'Warranty', slug: 'warranty' } },
    { pattern: /subscription|recurring|cancel|auto-renew/, subcategory: { name: 'Subscriptions', slug: 'subscriptions' } },
    { pattern: /delivery|shipping|late|missing|lost-package/, subcategory: { name: 'Delivery Issues', slug: 'delivery' } },
    { pattern: /service|poor-service|unsatisfactory/, subcategory: { name: 'Service Complaints', slug: 'service' } },
  ],
  'Damaged Goods': [
    { pattern: /delivery|shipping|transit|carrier/, subcategory: { name: 'Delivery Damage', slug: 'delivery-damage' } },
    { pattern: /defect|faulty|malfunction|broken/, subcategory: { name: 'Defective Products', slug: 'defective' } },
    { pattern: /misrepresent|description|advertised|fake|counterfeit/, subcategory: { name: 'Misrepresentation', slug: 'misrepresentation' } },
    { pattern: /warranty|repair/, subcategory: { name: 'Warranty & Repair', slug: 'warranty-repair' } },
  ],
  'Vehicle': [
    { pattern: /dealer|dealership|sales|purchase/, subcategory: { name: 'Dealer Disputes', slug: 'dealer' } },
    { pattern: /repair|mechanic|garage|service-center/, subcategory: { name: 'Repair & Service', slug: 'repair' } },
    { pattern: /warranty|lemon|defect/, subcategory: { name: 'Warranty & Lemon Law', slug: 'warranty-lemon' } },
    { pattern: /finance|loan|lease|payment/, subcategory: { name: 'Finance & Lease', slug: 'finance' } },
    { pattern: /parking|ticket|tow|traffic/, subcategory: { name: 'Parking & Traffic', slug: 'parking' } },
  ],
  'E-commerce': [
    { pattern: /refund|return|chargeback/, subcategory: { name: 'Refunds & Returns', slug: 'refunds' } },
    { pattern: /delivery|shipping|late|missing/, subcategory: { name: 'Delivery Issues', slug: 'delivery' } },
    { pattern: /seller|marketplace|amazon|ebay/, subcategory: { name: 'Marketplace Disputes', slug: 'marketplace' } },
    { pattern: /subscription|recurring|trial/, subcategory: { name: 'Subscriptions', slug: 'subscriptions' } },
    { pattern: /privacy|data|account|gdpr|ccpa/, subcategory: { name: 'Privacy & Data', slug: 'privacy' } },
  ],
  'HOA & Property': [
    { pattern: /fee|assessment|dues|charge/, subcategory: { name: 'Fees & Assessments', slug: 'fees' } },
    { pattern: /violation|fine|rule|architectural|enforcement/, subcategory: { name: 'Violations & Fines', slug: 'violations' } },
    { pattern: /maintenance|common-area|amenity|repair/, subcategory: { name: 'Maintenance', slug: 'maintenance' } },
    { pattern: /neighbor|dispute|noise|parking/, subcategory: { name: 'Neighbor Disputes', slug: 'neighbor' } },
    { pattern: /governance|board|meeting|election/, subcategory: { name: 'Governance', slug: 'governance' } },
  ],
};

/**
 * Infers the subcategory for a template based on its ID and category
 */
export function inferSubcategory(templateId: string, category: string): SubcategoryInfo | null {
  const patterns = subcategoryPatterns[category];
  if (!patterns) return null;

  const idLower = templateId.toLowerCase();
  
  for (const { pattern, subcategory } of patterns) {
    if (pattern instanceof RegExp) {
      if (pattern.test(idLower)) {
        return subcategory;
      }
    } else if (idLower.includes(pattern)) {
      return subcategory;
    }
  }
  
  // Default subcategory if no pattern matches
  return { name: 'General', slug: 'general' };
}

/**
 * Gets all unique subcategories for a given category
 */
export function getSubcategoriesForCategory(categoryName: string): SubcategoryInfo[] {
  const patterns = subcategoryPatterns[categoryName];
  if (!patterns) return [];
  
  // Return unique subcategories
  const seen = new Set<string>();
  return patterns
    .filter(p => {
      if (seen.has(p.subcategory.slug)) return false;
      seen.add(p.subcategory.slug);
      return true;
    })
    .map(p => p.subcategory);
}

/**
 * Gets all categories that have subcategory support
 */
export function getCategoriesWithSubcategories(): string[] {
  return Object.keys(subcategoryPatterns);
}
