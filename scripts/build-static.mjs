#!/usr/bin/env node
/**
 * Static HTML Generation Script for DisputeLetters
 * 
 * Generates static HTML files for SEO (search engine bots)
 * while users get the React SPA experience.
 * 
 * Output:
 * - /dist/templates/index.html (all templates landing)
 * - /dist/templates/:categoryId/index.html (13 categories)
 * - /dist/templates/:categoryId/:subcategorySlug/index.html (subcategories)
 * - /dist/templates/:categoryId/:subcategorySlug/:templateSlug/index.html (400+ templates)
 * - /dist/articles/:category/:slug/index.html (blog posts)
 * - /dist/sitemaps/sitemap-index.xml
 * - /dist/sitemaps/templates.xml
 * - /dist/sitemaps/categories.xml
 * - /dist/sitemaps/static.xml
 * - /dist/sitemaps/blog.xml
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
// Template and Category Data (imported inline)
// ============================================

// Category definitions
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

// Blog categories
const blogCategories = [
  { slug: 'consumer-rights', name: 'Consumer Rights' },
  { slug: 'landlord-tenant', name: 'Landlord & Tenant' },
  { slug: 'travel-disputes', name: 'Travel Disputes' },
  { slug: 'financial-tips', name: 'Financial Tips' },
  { slug: 'legal-guides', name: 'Legal Guides' },
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

// Infer subcategory from template ID
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

// We'll dynamically import all template files
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
  
  // Read TypeScript files and extract template data
  const templates = [];
  
  for (const file of templateFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️ Template file not found: ${file}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract template objects using regex (simpler than parsing TS)
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
      
      // Infer subcategory
      const subcategoryInfo = inferSubcategory(template.id, template.category);
      template.subcategory = subcategoryInfo.name;
      template.subcategorySlug = subcategoryInfo.slug;
      
      templates.push(template);
    }
  }
  
  return templates;
}

// Load blog posts from static data file
function loadBlogPosts() {
  const blogPostsPath = path.join(__dirname, '../src/data/blogPosts.ts');
  if (!fs.existsSync(blogPostsPath)) {
    console.log('   ⚠️ Blog posts file not found');
    return [];
  }
  
  const content = fs.readFileSync(blogPostsPath, 'utf-8');
  const posts = [];
  
  // Extract blog post objects
  const postMatches = content.matchAll(/{\s*slug:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],\s*excerpt:\s*['"]([^'"]+)['"],[\s\S]*?category:\s*['"]([^'"]+)['"],\s*categorySlug:\s*['"]([^'"]+)['"],\s*author:\s*['"]([^'"]+)['"],\s*publishedAt:\s*['"]([^'"]+)['"],\s*readTime:\s*['"]([^'"]+)['"]/g);
  
  for (const match of postMatches) {
    posts.push({
      slug: match[1],
      title: match[2],
      excerpt: match[3],
      category: match[4],
      categorySlug: match[5],
      author: match[6],
      publishedAt: match[7],
      readTime: match[8],
    });
  }
  
  return posts;
}

// ============================================
// HTML Generators
// ============================================

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

function generateTemplateHTML(template) {
  const categoryId = getCategoryIdFromName(template.category);
  const subcategorySlug = template.subcategorySlug || 'general';
  const canonicalUrl = `${SITE_URL}/templates/${categoryId}/${subcategorySlug}/${template.slug}`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Templates", "item": `${SITE_URL}/templates` },
      { "@type": "ListItem", "position": 3, "name": template.category, "item": `${SITE_URL}/templates/${categoryId}` },
      { "@type": "ListItem", "position": 4, "name": template.subcategory, "item": `${SITE_URL}/templates/${categoryId}/${subcategorySlug}` },
      { "@type": "ListItem", "position": 5, "name": template.title, "item": canonicalUrl }
    ]
  };
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": template.seoTitle,
    "description": template.seoDescription,
    "author": { "@type": "Organization", "name": "DisputeLetters" },
    "publisher": { "@type": "Organization", "name": "DisputeLetters", "url": SITE_URL },
    "datePublished": BUILD_DATE,
    "dateModified": BUILD_DATE,
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
  };
  
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Write a ${template.title}`,
    "description": template.seoDescription,
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Gather Information", "text": "Collect relevant dates, reference numbers, and documentation for your dispute." },
      { "@type": "HowToStep", "position": 2, "name": "Fill Out the Template", "text": "Enter your specific details into our guided form." },
      { "@type": "HowToStep", "position": 3, "name": "Choose Your Tone", "text": "Select the appropriate tone (neutral, firm, or final notice) for your situation." },
      { "@type": "HowToStep", "position": 4, "name": "Download Your Letter", "text": "Get your professionally formatted letter in PDF or DOCX format." }
    ]
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(template.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(template.seoDescription)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(template.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(template.seoDescription)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="DisputeLetters">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(template.seoTitle)}">
  <meta name="twitter:description" content="${escapeHtml(template.seoDescription)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(howToSchema)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    .breadcrumb { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .description { font-size: 1.125rem; color: #444; margin-bottom: 2rem; }
    .content { background: #f9fafb; padding: 1.5rem; border-radius: 8px; }
    .cta { display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <nav class="breadcrumb">
    <a href="/">Home</a> → <a href="/templates">Templates</a> → <a href="/templates/${categoryId}">${escapeHtml(template.category)}</a> → <a href="/templates/${categoryId}/${subcategorySlug}">${escapeHtml(template.subcategory)}</a> → ${escapeHtml(template.title)}
  </nav>
  
  <main>
    <h1>${escapeHtml(template.seoTitle)}</h1>
    <p class="description">${escapeHtml(template.seoDescription)}</p>
    
    <div class="content">
      <h2>About This Template</h2>
      <p>${escapeHtml(template.longDescription)}</p>
      
      <h2>Why Use This Template?</h2>
      <ul>
        <li>Professionally structured for maximum impact</li>
        <li>Includes jurisdiction-specific legal references</li>
        <li>Customizable to your specific situation</li>
        <li>Proven format for successful dispute resolution</li>
      </ul>
    </div>
    
    <a href="/templates/${categoryId}/${subcategorySlug}/${template.slug}" class="cta">Generate Your Letter Now</a>
  </main>
</body>
</html>`;
}

function generateCategoryHTML(category, templates) {
  const canonicalUrl = `${SITE_URL}/templates/${category.id}`;
  const categoryTemplates = templates.filter(t => getCategoryIdFromName(t.category) === category.id);
  
  // Group by subcategory
  const subcategoryGroups = {};
  categoryTemplates.forEach(t => {
    const subSlug = t.subcategorySlug || 'general';
    if (!subcategoryGroups[subSlug]) {
      subcategoryGroups[subSlug] = {
        name: t.subcategory || 'General',
        slug: subSlug,
        templates: []
      };
    }
    subcategoryGroups[subSlug].templates.push(t);
  });
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Templates", "item": `${SITE_URL}/templates` },
      { "@type": "ListItem", "position": 3, "name": category.name, "item": canonicalUrl }
    ]
  };
  
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${category.name} Letter Templates`,
    "description": category.description,
    "numberOfItems": categoryTemplates.length,
    "itemListElement": categoryTemplates.map((t, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": t.title,
      "url": `${SITE_URL}/templates/${category.id}/${t.subcategorySlug || 'general'}/${t.slug}`
    }))
  };
  
  // Generate subcategory sections
  const subcategoryHtml = Object.values(subcategoryGroups).map(group => `
    <div class="subcategory">
      <h3><a href="/templates/${category.id}/${group.slug}">${escapeHtml(group.name)}</a> (${group.templates.length} templates)</h3>
      <ul class="templates">
        ${group.templates.slice(0, 5).map(t => `
          <li>
            <a href="/templates/${category.id}/${group.slug}/${t.slug}">${escapeHtml(t.title)}</a>
            <p>${escapeHtml(t.shortDescription)}</p>
          </li>
        `).join('')}
        ${group.templates.length > 5 ? `<li class="more"><a href="/templates/${category.id}/${group.slug}">View all ${group.templates.length} templates →</a></li>` : ''}
      </ul>
    </div>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(category.name)} Complaint Letter Templates | DisputeLetters</title>
  <meta name="description" content="${escapeHtml(category.description)} Browse ${categoryTemplates.length} professional letter templates.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(category.name)} Letter Templates">
  <meta property="og:description" content="${escapeHtml(category.description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="DisputeLetters">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(category.name)} Letter Templates">
  <meta name="twitter:description" content="${escapeHtml(category.description)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h3 { margin-top: 2rem; margin-bottom: 1rem; }
    h3 a { color: #1a1a1a; text-decoration: none; }
    h3 a:hover { color: #2563eb; }
    .description { font-size: 1.125rem; color: #444; margin-bottom: 2rem; }
    .breadcrumb { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .templates { list-style: none; padding: 0; }
    .templates li { padding: 1rem; margin-bottom: 0.5rem; background: #f9fafb; border-radius: 8px; }
    .templates a { color: #2563eb; text-decoration: none; font-weight: 600; }
    .templates p { margin: 0.25rem 0 0; color: #666; font-size: 0.875rem; }
    .more { font-style: italic; }
    .subcategory { border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <nav class="breadcrumb">
    <a href="/">Home</a> → <a href="/templates">Templates</a> → ${escapeHtml(category.name)}
  </nav>
  
  <main>
    <h1>${escapeHtml(category.name)} Letter Templates</h1>
    <p class="description">${escapeHtml(category.description)}</p>
    
    <p><strong>${categoryTemplates.length} templates available</strong> across ${Object.keys(subcategoryGroups).length} subcategories.</p>
    
    ${subcategoryHtml}
  </main>
</body>
</html>`;
}

function generateSubcategoryHTML(category, subcategory, templates) {
  const canonicalUrl = `${SITE_URL}/templates/${category.id}/${subcategory.slug}`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Templates", "item": `${SITE_URL}/templates` },
      { "@type": "ListItem", "position": 3, "name": category.name, "item": `${SITE_URL}/templates/${category.id}` },
      { "@type": "ListItem", "position": 4, "name": subcategory.name, "item": canonicalUrl }
    ]
  };
  
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${subcategory.name} Letter Templates`,
    "description": `Professional ${subcategory.name.toLowerCase()} letter templates for ${category.name.toLowerCase()} disputes.`,
    "numberOfItems": templates.length,
    "itemListElement": templates.map((t, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": t.title,
      "url": `${SITE_URL}/templates/${category.id}/${subcategory.slug}/${t.slug}`
    }))
  };
  
  const templateListHtml = templates.map(t => `
    <li>
      <a href="/templates/${category.id}/${subcategory.slug}/${t.slug}">${escapeHtml(t.title)}</a>
      <p>${escapeHtml(t.shortDescription)}</p>
    </li>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subcategory.name)} Letter Templates | ${escapeHtml(category.name)} | DisputeLetters</title>
  <meta name="description" content="Browse ${templates.length} professional ${subcategory.name.toLowerCase()} letter templates. Create legally-referenced complaint letters for ${category.name.toLowerCase()} disputes.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(subcategory.name)} Letter Templates">
  <meta property="og:description" content="Professional ${subcategory.name.toLowerCase()} letter templates">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="DisputeLetters">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .description { font-size: 1.125rem; color: #444; margin-bottom: 2rem; }
    .breadcrumb { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .templates { list-style: none; padding: 0; }
    .templates li { padding: 1rem; margin-bottom: 1rem; background: #f9fafb; border-radius: 8px; }
    .templates a { color: #2563eb; text-decoration: none; font-weight: 600; font-size: 1.125rem; }
    .templates p { margin: 0.5rem 0 0; color: #666; }
  </style>
</head>
<body>
  <nav class="breadcrumb">
    <a href="/">Home</a> → <a href="/templates">Templates</a> → <a href="/templates/${category.id}">${escapeHtml(category.name)}</a> → ${escapeHtml(subcategory.name)}
  </nav>
  
  <main>
    <h1>${escapeHtml(subcategory.name)} Letter Templates</h1>
    <p class="description">Browse ${templates.length} professional ${subcategory.name.toLowerCase()} letter templates in our ${category.name.toLowerCase()} collection.</p>
    
    <ul class="templates">
      ${templateListHtml}
    </ul>
  </main>
</body>
</html>`;
}

function generateAllTemplatesHTML(categories, templates) {
  const canonicalUrl = `${SITE_URL}/templates`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Templates", "item": canonicalUrl }
    ]
  };
  
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Letter Template Library",
    "description": `Browse ${templates.length}+ professional letter templates across ${categories.length} categories.`,
    "numberOfItems": templates.length,
    "hasPart": categories.map(cat => ({
      "@type": "ItemList",
      "name": cat.name,
      "numberOfItems": templates.filter(t => getCategoryIdFromName(t.category) === cat.id).length,
      "url": `${SITE_URL}/templates/${cat.id}`
    }))
  };
  
  const categoryListHtml = categories.map(cat => {
    const count = templates.filter(t => getCategoryIdFromName(t.category) === cat.id).length;
    return `
      <li>
        <a href="/templates/${cat.id}">${escapeHtml(cat.name)}</a>
        <span class="count">${count} templates</span>
        <p>${escapeHtml(cat.description)}</p>
      </li>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Letter Templates - ${templates.length}+ Free Professional Complaint Letters | DisputeLetters</title>
  <meta name="description" content="Browse our complete library of ${templates.length}+ professional letter templates across ${categories.length} categories. Generate legally-referenced complaint letters for any situation.">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Professional Letter Template Library">
  <meta property="og:description" content="Browse ${templates.length}+ professional letter templates">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="DisputeLetters">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .intro { font-size: 1.125rem; color: #444; margin-bottom: 2rem; }
    .breadcrumb { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .categories { list-style: none; padding: 0; }
    .categories li { padding: 1.5rem; margin-bottom: 1rem; background: #f9fafb; border-radius: 8px; }
    .categories a { color: #2563eb; text-decoration: none; font-weight: 600; font-size: 1.25rem; }
    .categories p { margin: 0.5rem 0 0; color: #666; }
    .count { color: #666; font-size: 0.875rem; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <nav class="breadcrumb">
    <a href="/">Home</a> → Templates
  </nav>
  
  <main>
    <h1>Professional Letter Template Library</h1>
    <p class="intro">Browse our complete collection of ${templates.length}+ pre-validated letter templates. Every template includes proper legal references and controlled language for professional dispute resolution.</p>
    
    <h2>Browse by Category</h2>
    <ul class="categories">
      ${categoryListHtml}
    </ul>
  </main>
</body>
</html>`;
}

function generateBlogPostHTML(post) {
  const canonicalUrl = `${SITE_URL}/articles/${post.categorySlug}/${post.slug}`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/articles` },
      { "@type": "ListItem", "position": 3, "name": post.category, "item": `${SITE_URL}/articles/${post.categorySlug}` },
      { "@type": "ListItem", "position": 4, "name": post.title, "item": canonicalUrl }
    ]
  };
  
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": { "@type": "Person", "name": post.author },
    "publisher": { "@type": "Organization", "name": "DisputeLetters", "url": SITE_URL },
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} | DisputeLetters Blog</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.excerpt)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="DisputeLetters">
  <meta property="article:published_time" content="${post.publishedAt}">
  <meta property="article:author" content="${escapeHtml(post.author)}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.excerpt)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    .breadcrumb { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .meta { color: #666; margin-bottom: 2rem; display: flex; gap: 1.5rem; }
    .excerpt { font-size: 1.25rem; color: #444; margin-bottom: 2rem; border-left: 4px solid #2563eb; padding-left: 1rem; }
    .cta { display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <nav class="breadcrumb">
    <a href="/">Home</a> → <a href="/articles">Blog</a> → <a href="/articles/${post.categorySlug}">${escapeHtml(post.category)}</a> → ${escapeHtml(post.title)}
  </nav>
  
  <main>
    <article>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="meta">
        <span>By ${escapeHtml(post.author)}</span>
        <span>${post.publishedAt}</span>
        <span>${post.readTime}</span>
      </div>
      <p class="excerpt">${escapeHtml(post.excerpt)}</p>
      <p>Read the full article on our website for expert guidance on consumer rights and dispute resolution.</p>
    </article>
    
    <a href="/articles/${post.categorySlug}/${post.slug}" class="cta">Read Full Article</a>
  </main>
</body>
</html>`;
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
  <sitemap>
    <loc>${SITE_URL}/sitemaps/blog.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateStaticSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/templates</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/articles</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pricing</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
}

function generateCategoriesSitemap(templates) {
  // Category URLs
  const categoryUrls = categories.map(cat => `  <url>
    <loc>${SITE_URL}/templates/${cat.id}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');
  
  // Subcategory URLs - derive from templates
  const subcategorySet = new Set();
  templates.forEach(t => {
    const catId = getCategoryIdFromName(t.category);
    const subSlug = t.subcategorySlug || 'general';
    subcategorySet.add(`${catId}/${subSlug}`);
  });
  
  const subcategoryUrls = Array.from(subcategorySet).map(path => `  <url>
    <loc>${SITE_URL}/templates/${path}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>`).join('\n');
  
  // Blog category URLs
  const blogCategoryUrls = blogCategories.map(cat => `  <url>
    <loc>${SITE_URL}/articles/${cat.slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${subcategoryUrls}
${blogCategoryUrls}
</urlset>`;
}

function generateTemplatesSitemap(templates) {
  const urls = templates.map(t => {
    const catId = getCategoryIdFromName(t.category);
    const subSlug = t.subcategorySlug || 'general';
    return `  <url>
    <loc>${SITE_URL}/templates/${catId}/${subSlug}/${t.slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateBlogSitemap(posts) {
  const urls = posts.map(p => `  <url>
    <loc>${SITE_URL}/articles/${p.categorySlug}/${p.slug}</loc>
    <lastmod>${p.publishedAt || BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// ============================================
// Main Build Function
// ============================================

async function build() {
  console.log('🏗️  Starting static HTML generation...\n');
  
  // Load templates
  const templates = await loadAllTemplates();
  console.log(`📄 Found ${templates.length} templates`);
  console.log(`📁 Found ${categories.length} categories`);
  
  // Load blog posts
  const blogPosts = loadBlogPosts();
  console.log(`📝 Found ${blogPosts.length} blog posts\n`);
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create directories
  const sitemapsDir = path.join(distDir, 'sitemaps');
  fs.mkdirSync(sitemapsDir, { recursive: true });
  
  // Generate /templates landing page
  console.log('📝 Generating templates landing page...');
  const templatesDir = path.join(distDir, 'templates');
  fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(path.join(templatesDir, 'index.html'), generateAllTemplatesHTML(categories, templates));
  console.log('   ✅ Generated templates landing page');
  
  // Generate category HTML files
  console.log('📝 Generating category HTML files...');
  for (const category of categories) {
    const categoryDir = path.join(distDir, 'templates', category.id);
    fs.mkdirSync(categoryDir, { recursive: true });
    
    const html = generateCategoryHTML(category, templates);
    fs.writeFileSync(path.join(categoryDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${categories.length} category pages`);
  
  // Generate subcategory HTML files
  console.log('📝 Generating subcategory HTML files...');
  const subcategorySet = new Map();
  templates.forEach(t => {
    const catId = getCategoryIdFromName(t.category);
    const subSlug = t.subcategorySlug || 'general';
    const key = `${catId}/${subSlug}`;
    if (!subcategorySet.has(key)) {
      subcategorySet.set(key, {
        category: categories.find(c => c.id === catId),
        subcategory: { name: t.subcategory || 'General', slug: subSlug },
        templates: []
      });
    }
    subcategorySet.get(key).templates.push(t);
  });
  
  for (const [key, data] of subcategorySet) {
    const subcategoryDir = path.join(distDir, 'templates', key);
    fs.mkdirSync(subcategoryDir, { recursive: true });
    
    const html = generateSubcategoryHTML(data.category, data.subcategory, data.templates);
    fs.writeFileSync(path.join(subcategoryDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${subcategorySet.size} subcategory pages`);
  
  // Generate template HTML files
  console.log('📝 Generating template HTML files...');
  for (const template of templates) {
    const catId = getCategoryIdFromName(template.category);
    const subSlug = template.subcategorySlug || 'general';
    const templateDir = path.join(distDir, 'templates', catId, subSlug, template.slug);
    fs.mkdirSync(templateDir, { recursive: true });
    
    const html = generateTemplateHTML(template);
    fs.writeFileSync(path.join(templateDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${templates.length} template pages`);
  
  // Generate blog post HTML files
  console.log('📝 Generating blog post HTML files...');
  for (const post of blogPosts) {
    const postDir = path.join(distDir, 'articles', post.categorySlug, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    
    const html = generateBlogPostHTML(post);
    fs.writeFileSync(path.join(postDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${blogPosts.length} blog post pages`);
  
  // Generate sitemaps
  console.log('🗺️  Generating sitemaps...');
  fs.writeFileSync(path.join(sitemapsDir, 'sitemap-index.xml'), generateSitemapIndex());
  fs.writeFileSync(path.join(sitemapsDir, 'static.xml'), generateStaticSitemap());
  fs.writeFileSync(path.join(sitemapsDir, 'categories.xml'), generateCategoriesSitemap(templates));
  fs.writeFileSync(path.join(sitemapsDir, 'templates.xml'), generateTemplatesSitemap(templates));
  fs.writeFileSync(path.join(sitemapsDir, 'blog.xml'), generateBlogSitemap(blogPosts));
  console.log('   ✅ Generated 5 sitemap files');
  
  const totalPages = 1 + categories.length + subcategorySet.size + templates.length + blogPosts.length;
  console.log('\n✅ Static HTML generation complete!');
  console.log(`   📊 Total: ${totalPages} HTML pages + 5 sitemaps`);
}

// Run the build
build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
