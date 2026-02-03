#!/usr/bin/env node
/**
 * Static Build Script for DisputeLetters
 * 
 * Generates sitemaps for SEO:
 * - /dist/sitemaps/sitemap-index.xml
 * - /dist/sitemaps/templates.xml
 * - /dist/sitemaps/categories.xml
 * - /dist/sitemaps/static.xml
 * - /dist/sitemap.xml (copy of index)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

const SITE_URL = 'https://disputeletters.com';
const BUILD_DATE = new Date().toISOString().split('T')[0];

// ============================================
// Template and Category Data
// ============================================

const categories = [
  { id: 'refunds', name: 'Refunds & Purchases', description: 'Get your money back for products or services that did not meet expectations.' },
  { id: 'housing', name: 'Landlord & Housing', description: 'Request repairs, address deposit disputes, or document housing issues.' },
  { id: 'travel', name: 'Travel & Transportation', description: 'Claim compensation for flight delays, lost baggage, or booking issues.' },
  { id: 'damaged-goods', name: 'Damaged & Defective Goods', description: 'File complaints for items that arrived broken, defective, or not as described.' },
  { id: 'utilities', name: 'Utilities & Telecommunications', description: 'Dispute billing errors, service quality issues, or contract problems.' },
  { id: 'financial', name: 'Financial Services', description: 'Challenge bank fees, credit report errors, or debt collection issues.' },
  { id: 'insurance', name: 'Insurance Claims', description: 'Appeal denied claims, dispute settlements, or challenge cancellations.' },
  { id: 'vehicle', name: 'Vehicle & Auto', description: 'Address dealer complaints, warranty disputes, or repair issues.' },
  { id: 'healthcare', name: 'Healthcare & Medical Billing', description: 'Dispute medical bills, coding errors, or surprise charges.' },
  { id: 'employment', name: 'Employment & Workplace', description: 'Address wage issues, workplace problems, or termination disputes.' },
  { id: 'ecommerce', name: 'E-commerce & Online Services', description: 'Report seller issues, account problems, or data privacy requests.' },
  { id: 'hoa', name: 'Neighbor & HOA Disputes', description: 'Address community issues, fee disputes, or neighbor conflicts.' },
  { id: 'contractors', name: 'Contractors & Home Improvement', description: 'Dispute poor workmanship, project abandonment, or cost overruns.' },
];

// Subcategory patterns for inferring subcategory from template ID
const subcategoryPatterns = {
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
    { pattern: /wage|pay|salary|overtime|commission|bonus|paycheck/, subcategory: { name: 'Wages & Pay', slug: 'wages' } },
    { pattern: /terminat|fired|dismissal|wrongful|severance/, subcategory: { name: 'Termination', slug: 'termination' } },
    { pattern: /discriminat|harassment|hostile|retaliation|whistleblower/, subcategory: { name: 'Discrimination', slug: 'discrimination' } },
    { pattern: /benefit|401k|health-insurance|pto|vacation|leave/, subcategory: { name: 'Benefits', slug: 'benefits' } },
    { pattern: /workplace|safety|osha|condition|ergonomic/, subcategory: { name: 'Workplace Conditions', slug: 'workplace' } },
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

function inferSubcategory(templateId, category) {
  const patterns = subcategoryPatterns[category];
  if (!patterns) return { name: 'General', slug: 'general' };
  
  const idLower = templateId.toLowerCase();
  
  for (const { pattern, subcategory } of patterns) {
    if (pattern.test(idLower)) {
      return subcategory;
    }
  }
  
  return { name: 'General', slug: 'general' };
}

async function loadAllTemplates() {
  const templateFiles = [
    '../src/data/templates/refundsTemplates.ts',
    '../src/data/templates/housingTemplates.ts',
    '../src/data/templates/travelTemplates.ts',
    '../src/data/templates/damagedGoodsTemplates.ts',
    '../src/data/templates/utilitiesTemplates.ts',
    '../src/data/templates/financialTemplates.ts',
    '../src/data/templates/insuranceTemplates.ts',
    '../src/data/templates/vehicleTemplates.ts',
    '../src/data/templates/healthcareTemplates.ts',
    '../src/data/templates/employmentTemplates.ts',
    '../src/data/templates/ecommerceTemplates.ts',
    '../src/data/templates/hoaTemplates.ts',
    '../src/data/templates/contractorsTemplates.ts',
  ];
  
  const templates = [];
  
  for (const file of templateFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️ Template file not found: ${file}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const templateMatches = content.matchAll(/{\s*id:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],[\s\S]*?shortDescription:\s*['"]([^'"]+)['"],[\s\S]*?longDescription:\s*['"]([^'"]+)['"],[\s\S]*?seoTitle:\s*['"]([^'"]+)['"],\s*seoDescription:\s*['"]([^'"]+)['"]/g);
    
    for (const match of templateMatches) {
      const template = {
        id: match[1],
        slug: match[2],
        category: match[3],
        title: match[4],
        shortDescription: match[5],
        longDescription: match[6],
        seoTitle: match[7],
        seoDescription: match[8],
      };
      
      const subcategoryInfo = inferSubcategory(template.id, template.category);
      template.subcategory = subcategoryInfo.name;
      template.subcategorySlug = subcategoryInfo.slug;
      
      templates.push(template);
    }
  }
  
  return templates;
}

// ============================================
// Utility Functions
// ============================================

function getCategoryIdFromName(categoryName) {
  const mapping = {
    'Refunds & Purchases': 'refunds',
    'Housing': 'housing',
    'Travel': 'travel',
    'Damaged Goods': 'damaged-goods',
    'Utilities & Telecom': 'utilities',
    'Financial': 'financial',
    'Insurance': 'insurance',
    'Vehicle': 'vehicle',
    'Healthcare': 'healthcare',
    'Employment': 'employment',
    'E-commerce': 'ecommerce',
    'HOA & Property': 'hoa',
    'Contractors': 'contractors',
  };
  return mapping[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
}

// ============================================
// Sitemap Generators
// ============================================

function generateSitemapIndex() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemaps/static.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemaps/categories.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemaps/templates.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateStaticSitemap() {
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/templates', priority: '0.9', changefreq: 'daily' },
    { loc: '/how-it-works', priority: '0.8', changefreq: 'weekly' },
    { loc: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { loc: '/faq', priority: '0.7', changefreq: 'weekly' },
    { loc: '/about', priority: '0.6', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.3', changefreq: 'monthly' },
    { loc: '/disclaimer', priority: '0.3', changefreq: 'monthly' },
  ];
  
  const urls = staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateCategoriesSitemap(allCategories) {
  const urls = allCategories.map(cat => `
  <url>
    <loc>${SITE_URL}/templates/${cat.id}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateTemplatesSitemap(templates) {
  const urls = templates.map(t => {
    const categoryId = getCategoryIdFromName(t.category);
    const subcategorySlug = t.subcategorySlug || 'general';
    return `
  <url>
    <loc>${SITE_URL}/templates/${categoryId}/${subcategorySlug}/${t.slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ============================================
// Main Build Function
// ============================================

async function buildSitemaps() {
  console.log('\n🗺️  Generating sitemaps...\n');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log('⚠️  dist/ directory not found. Run vite build first.');
    return;
  }
  
  // Load all templates for sitemap
  console.log('📚 Loading template data...');
  const templates = await loadAllTemplates();
  console.log(`   Found ${templates.length} templates`);
  
  // Generate sitemaps
  const sitemapsDir = path.join(distDir, 'sitemaps');
  fs.mkdirSync(sitemapsDir, { recursive: true });
  
  fs.writeFileSync(path.join(sitemapsDir, 'sitemap-index.xml'), generateSitemapIndex());
  fs.writeFileSync(path.join(sitemapsDir, 'static.xml'), generateStaticSitemap());
  fs.writeFileSync(path.join(sitemapsDir, 'categories.xml'), generateCategoriesSitemap(categories));
  fs.writeFileSync(path.join(sitemapsDir, 'templates.xml'), generateTemplatesSitemap(templates));
  
  // Also copy sitemap-index to root as sitemap.xml
  fs.copyFileSync(
    path.join(sitemapsDir, 'sitemap-index.xml'),
    path.join(distDir, 'sitemap.xml')
  );
  
  console.log('   Generated 4 sitemaps');
  console.log('\n✅ Sitemap generation complete!');
}

// Run the build
buildSitemaps().catch(console.error);
