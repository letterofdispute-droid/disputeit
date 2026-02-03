#!/usr/bin/env node
/**
 * Static HTML Generation Script for DisputeLetters
 * 
 * Generates SPA-ready static HTML files for SEO:
 * - Each file includes React assets (CSS/JS) from the built app
 * - Each file includes route-specific SEO content
 * - Each file includes loading overlay for smooth transition
 * 
 * This allows search bots to see full page content while humans
 * get the React SPA experience.
 * 
 * Output:
 * - /dist/templates/index.html (all templates landing)
 * - /dist/templates/:categoryId/index.html (13 categories)
 * - /dist/templates/:categoryId/:subcategorySlug/index.html (subcategories)
 * - /dist/templates/:categoryId/:subcategorySlug/:templateSlug/index.html (400+ templates)
 * - /dist/sitemaps/sitemap-index.xml
 * - /dist/sitemaps/templates.xml
 * - /dist/sitemaps/categories.xml
 * - /dist/sitemaps/static.xml
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
// React Assets Extraction
// ============================================

/**
 * Extract CSS and JS assets from the built index.html
 * These will be included in every generated static page
 */
function extractReactAssets() {
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  dist/index.html not found, cannot extract React assets');
    return { headAssets: '', bodyScripts: '', baseHead: '' };
  }
  
  const html = fs.readFileSync(indexPath, 'utf-8');
  
  // Extract everything in <head> except title/description (we'll customize those)
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
  let headContent = headMatch ? headMatch[1] : '';
  
  // Keep only link/script tags and essential meta from head
  const linkTags = html.match(/<link[^>]+>/g) || [];
  const headScripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  
  // Filter to only CSS and modulepreload links
  const cssLinks = linkTags.filter(link => 
    link.includes('stylesheet') || link.includes('modulepreload')
  ).join('\n    ');
  
  // Extract body scripts (the React entry point)
  const bodyScriptMatch = html.match(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g) || [];
  const bodyScripts = bodyScriptMatch.join('\n    ');
  
  return {
    headAssets: cssLinks,
    bodyScripts: bodyScripts,
  };
}

// ============================================
// Loading Overlay (shared across all pages)
// ============================================

const overlayCSS = `
  <style id="seo-overlay-styles">
    #loading-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: hsl(210 20% 98%);
      transition: opacity 0.3s ease-out;
    }
    #loading-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    #loading-overlay .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid hsl(214 32% 91%);
      border-top-color: hsl(222 47% 20%);
      border-radius: 50%;
      animation: seo-spin 1s linear infinite;
    }
    @keyframes seo-spin {
      to { transform: rotate(360deg); }
    }
    /* Hide static content visually but keep for SEO */
    #seo-static-content {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
  </style>`;

const overlayHTML = `
  <div id="loading-overlay">
    <img src="/ld-logo.svg" alt="Dispute Letters" style="height:40px;margin-bottom:16px;">
    <div class="spinner"></div>
  </div>`;

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

// ============================================
// SPA-Ready HTML Generator
// ============================================

/**
 * Generate a complete SPA entry point HTML file
 * Includes React assets, loading overlay, and route-specific SEO content
 */
function generateSPAPage({ title, description, canonicalUrl, seoContent, schemas = [], headAssets, bodyScripts }) {
  const schemaScripts = schemas.map(s => 
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n    ');
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="Dispute Letters">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="/ld-logo-icon.svg">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Dispute Letters">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    
    <!-- Structured Data -->
    ${schemaScripts}
    
    <!-- React Assets -->
    ${headAssets}
    
    <!-- Loading Overlay Styles -->
    ${overlayCSS}
  </head>
  <body>
    ${overlayHTML}
    <div id="root">
      <div id="seo-static-content">
        ${seoContent}
      </div>
    </div>
    ${bodyScripts}
  </body>
</html>`;
}

// ============================================
// Page-Specific Content Generators
// ============================================

function generateTemplatePageContent(template, headAssets, bodyScripts) {
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
  
  const seoContent = `
        <header>
          <nav style="display:flex;gap:1.5rem;padding:1rem;">
            <a href="/" style="font-weight:bold;">Dispute Letters</a>
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/faq">FAQ</a>
            <a href="/pricing">Pricing</a>
          </nav>
        </header>
        <main>
          <nav aria-label="breadcrumb" style="font-size:0.875rem;color:#666;margin-bottom:1.5rem;">
            <a href="/">Home</a> → <a href="/templates">Templates</a> → <a href="/templates/${categoryId}">${escapeHtml(template.category)}</a> → <a href="/templates/${categoryId}/${subcategorySlug}">${escapeHtml(template.subcategory)}</a> → ${escapeHtml(template.title)}
          </nav>
          <h1>${escapeHtml(template.seoTitle)}</h1>
          <p style="font-size:1.125rem;color:#444;margin-bottom:2rem;">${escapeHtml(template.seoDescription)}</p>
          <section>
            <h2>About This Template</h2>
            <p>${escapeHtml(template.longDescription)}</p>
            <h2>Why Use This Template?</h2>
            <ul>
              <li>Professionally structured for maximum impact</li>
              <li>Includes jurisdiction-specific legal references</li>
              <li>Customizable to your specific situation</li>
              <li>Proven format for successful dispute resolution</li>
            </ul>
          </section>
          <a href="${canonicalUrl}" style="display:inline-block;margin-top:2rem;padding:0.75rem 1.5rem;background:#1a2744;color:white;border-radius:0.5rem;text-decoration:none;">Generate Your Letter Now</a>
        </main>
        <footer style="padding:2rem 1rem;border-top:1px solid #e5e7eb;margin-top:3rem;">
          <nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:1rem;">
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/pricing">Pricing</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
          <p style="color:#6b7280;font-size:0.875rem;text-align:center;">© ${new Date().getFullYear()} Dispute Letters. All rights reserved.</p>
        </footer>`;
  
  return generateSPAPage({
    title: template.seoTitle,
    description: template.seoDescription,
    canonicalUrl,
    seoContent,
    schemas: [breadcrumbSchema, articleSchema],
    headAssets,
    bodyScripts
  });
}

function generateCategoryPageContent(category, templates, headAssets, bodyScripts) {
  const canonicalUrl = `${SITE_URL}/templates/${category.id}`;
  const categoryTemplates = templates.filter(t => getCategoryIdFromName(t.category) === category.id);
  
  // Group by subcategory
  const subcategoryGroups = {};
  categoryTemplates.forEach(t => {
    const subSlug = t.subcategorySlug || 'general';
    if (!subcategoryGroups[subSlug]) {
      subcategoryGroups[subSlug] = { name: t.subcategory || 'General', slug: subSlug, templates: [] };
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
  
  const subcategoryLinks = Object.values(subcategoryGroups).map(group => `
            <li style="padding:1rem;background:#f9fafb;border-radius:0.5rem;margin-bottom:0.5rem;">
              <a href="/templates/${category.id}/${group.slug}" style="font-weight:600;color:#2563eb;text-decoration:none;">${escapeHtml(group.name)}</a>
              <span style="color:#666;font-size:0.875rem;margin-left:0.5rem;">${group.templates.length} templates</span>
            </li>`).join('');
  
  const seoContent = `
        <header>
          <nav style="display:flex;gap:1.5rem;padding:1rem;">
            <a href="/" style="font-weight:bold;">Dispute Letters</a>
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/faq">FAQ</a>
          </nav>
        </header>
        <main>
          <nav aria-label="breadcrumb" style="font-size:0.875rem;color:#666;margin-bottom:1.5rem;">
            <a href="/">Home</a> → <a href="/templates">Templates</a> → ${escapeHtml(category.name)}
          </nav>
          <h1>${escapeHtml(category.name)} Letter Templates</h1>
          <p style="font-size:1.125rem;color:#444;margin-bottom:2rem;">${escapeHtml(category.description)} Browse ${categoryTemplates.length} professional letter templates.</p>
          <h2>Browse by Subcategory</h2>
          <ul style="list-style:none;padding:0;">
            ${subcategoryLinks}
          </ul>
        </main>
        <footer style="padding:2rem 1rem;border-top:1px solid #e5e7eb;margin-top:3rem;">
          <nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:1rem;">
            <a href="/templates">Letter Templates</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
          <p style="color:#6b7280;font-size:0.875rem;text-align:center;">© ${new Date().getFullYear()} Dispute Letters. All rights reserved.</p>
        </footer>`;
  
  return generateSPAPage({
    title: `${category.name} Complaint Letter Templates | DisputeLetters`,
    description: `${category.description} Browse ${categoryTemplates.length} professional letter templates.`,
    canonicalUrl,
    seoContent,
    schemas: [breadcrumbSchema],
    headAssets,
    bodyScripts
  });
}

function generateSubcategoryPageContent(category, subcategory, templates, headAssets, bodyScripts) {
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
  
  const templateLinks = templates.map(t => `
            <li style="padding:1rem;background:#f9fafb;border-radius:0.5rem;margin-bottom:0.5rem;">
              <a href="/templates/${category.id}/${subcategory.slug}/${t.slug}" style="font-weight:600;color:#2563eb;text-decoration:none;">${escapeHtml(t.title)}</a>
              <p style="color:#666;font-size:0.875rem;margin:0.25rem 0 0;">${escapeHtml(t.shortDescription)}</p>
            </li>`).join('');
  
  const seoContent = `
        <header>
          <nav style="display:flex;gap:1.5rem;padding:1rem;">
            <a href="/" style="font-weight:bold;">Dispute Letters</a>
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/faq">FAQ</a>
          </nav>
        </header>
        <main>
          <nav aria-label="breadcrumb" style="font-size:0.875rem;color:#666;margin-bottom:1.5rem;">
            <a href="/">Home</a> → <a href="/templates">Templates</a> → <a href="/templates/${category.id}">${escapeHtml(category.name)}</a> → ${escapeHtml(subcategory.name)}
          </nav>
          <h1>${escapeHtml(subcategory.name)} Letter Templates</h1>
          <p style="font-size:1.125rem;color:#444;margin-bottom:2rem;">Browse ${templates.length} professional ${subcategory.name.toLowerCase()} letter templates in our ${category.name.toLowerCase()} collection.</p>
          <ul style="list-style:none;padding:0;">
            ${templateLinks}
          </ul>
        </main>
        <footer style="padding:2rem 1rem;border-top:1px solid #e5e7eb;margin-top:3rem;">
          <nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:1rem;">
            <a href="/templates">Letter Templates</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
          <p style="color:#6b7280;font-size:0.875rem;text-align:center;">© ${new Date().getFullYear()} Dispute Letters. All rights reserved.</p>
        </footer>`;
  
  return generateSPAPage({
    title: `${subcategory.name} Letter Templates | ${category.name} | DisputeLetters`,
    description: `Browse ${templates.length} professional ${subcategory.name.toLowerCase()} letter templates. Create legally-referenced complaint letters for ${category.name.toLowerCase()} disputes.`,
    canonicalUrl,
    seoContent,
    schemas: [breadcrumbSchema],
    headAssets,
    bodyScripts
  });
}

function generateAllTemplatesPageContent(allCategories, templates, headAssets, bodyScripts) {
  const canonicalUrl = `${SITE_URL}/templates`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Templates", "item": canonicalUrl }
    ]
  };
  
  const categoryLinks = allCategories.map(cat => {
    const count = templates.filter(t => getCategoryIdFromName(t.category) === cat.id).length;
    return `
            <li style="padding:1.5rem;background:#f9fafb;border-radius:0.5rem;margin-bottom:1rem;">
              <a href="/templates/${cat.id}" style="font-weight:600;font-size:1.25rem;color:#2563eb;text-decoration:none;">${escapeHtml(cat.name)}</a>
              <span style="color:#666;font-size:0.875rem;margin-left:0.5rem;">${count} templates</span>
              <p style="color:#666;margin:0.5rem 0 0;">${escapeHtml(cat.description)}</p>
            </li>`;
  }).join('');
  
  const seoContent = `
        <header>
          <nav style="display:flex;gap:1.5rem;padding:1rem;">
            <a href="/" style="font-weight:bold;">Dispute Letters</a>
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/faq">FAQ</a>
            <a href="/pricing">Pricing</a>
          </nav>
        </header>
        <main>
          <nav aria-label="breadcrumb" style="font-size:0.875rem;color:#666;margin-bottom:1.5rem;">
            <a href="/">Home</a> → Templates
          </nav>
          <h1>Professional Letter Template Library</h1>
          <p style="font-size:1.125rem;color:#444;margin-bottom:2rem;">Browse our complete collection of ${templates.length}+ pre-validated letter templates. Every template includes proper legal references and controlled language for professional dispute resolution.</p>
          <h2>Browse by Category</h2>
          <ul style="list-style:none;padding:0;">
            ${categoryLinks}
          </ul>
        </main>
        <footer style="padding:2rem 1rem;border-top:1px solid #e5e7eb;margin-top:3rem;">
          <nav style="display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-bottom:1rem;">
            <a href="/templates">Letter Templates</a>
            <a href="/how-it-works">How It Works</a>
            <a href="/pricing">Pricing</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </nav>
          <p style="color:#6b7280;font-size:0.875rem;text-align:center;">© ${new Date().getFullYear()} Dispute Letters. All rights reserved.</p>
        </footer>`;
  
  return generateSPAPage({
    title: `All Letter Templates - ${templates.length}+ Free Professional Complaint Letters | DisputeLetters`,
    description: `Browse our complete library of ${templates.length}+ professional letter templates across ${allCategories.length} categories. Generate legally-referenced complaint letters for any situation.`,
    canonicalUrl,
    seoContent,
    schemas: [breadcrumbSchema],
    headAssets,
    bodyScripts
  });
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

async function buildStaticFiles() {
  console.log('\n📦 Building SPA-ready static HTML files...\n');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log('⚠️  dist/ directory not found. Run vite build first.');
    return;
  }
  
  // Extract React assets from built index.html
  console.log('📋 Extracting React assets from dist/index.html...');
  const { headAssets, bodyScripts } = extractReactAssets();
  
  if (!bodyScripts) {
    console.log('⚠️  Could not extract React scripts. Static files will not have SPA functionality.');
  }
  
  // Load all templates
  console.log('📚 Loading template data...');
  const templates = await loadAllTemplates();
  console.log(`   Found ${templates.length} templates`);
  
  let filesGenerated = 0;
  
  // 1. Generate /templates page
  console.log('\n📄 Generating /templates page...');
  const templatesDir = path.join(distDir, 'templates');
  fs.mkdirSync(templatesDir, { recursive: true });
  fs.writeFileSync(
    path.join(templatesDir, 'index.html'),
    generateAllTemplatesPageContent(categories, templates, headAssets, bodyScripts)
  );
  filesGenerated++;
  
  // 2. Generate category pages
  console.log('📂 Generating category pages...');
  for (const category of categories) {
    const categoryDir = path.join(distDir, 'templates', category.id);
    fs.mkdirSync(categoryDir, { recursive: true });
    fs.writeFileSync(
      path.join(categoryDir, 'index.html'),
      generateCategoryPageContent(category, templates, headAssets, bodyScripts)
    );
    filesGenerated++;
  }
  console.log(`   Generated ${categories.length} category pages`);
  
  // 3. Generate subcategory pages
  console.log('📂 Generating subcategory pages...');
  let subcategoryCount = 0;
  for (const category of categories) {
    const categoryTemplates = templates.filter(t => getCategoryIdFromName(t.category) === category.id);
    
    // Group by subcategory
    const subcategoryGroups = {};
    categoryTemplates.forEach(t => {
      const subSlug = t.subcategorySlug || 'general';
      if (!subcategoryGroups[subSlug]) {
        subcategoryGroups[subSlug] = { name: t.subcategory || 'General', slug: subSlug, templates: [] };
      }
      subcategoryGroups[subSlug].templates.push(t);
    });
    
    for (const [slug, group] of Object.entries(subcategoryGroups)) {
      const subcategoryDir = path.join(distDir, 'templates', category.id, slug);
      fs.mkdirSync(subcategoryDir, { recursive: true });
      fs.writeFileSync(
        path.join(subcategoryDir, 'index.html'),
        generateSubcategoryPageContent(category, { name: group.name, slug }, group.templates, headAssets, bodyScripts)
      );
      filesGenerated++;
      subcategoryCount++;
    }
  }
  console.log(`   Generated ${subcategoryCount} subcategory pages`);
  
  // 4. Generate template pages
  console.log('📝 Generating template pages...');
  for (const template of templates) {
    const categoryId = getCategoryIdFromName(template.category);
    const subcategorySlug = template.subcategorySlug || 'general';
    const templateDir = path.join(distDir, 'templates', categoryId, subcategorySlug, template.slug);
    fs.mkdirSync(templateDir, { recursive: true });
    fs.writeFileSync(
      path.join(templateDir, 'index.html'),
      generateTemplatePageContent(template, headAssets, bodyScripts)
    );
    filesGenerated++;
  }
  console.log(`   Generated ${templates.length} template pages`);
  
  // 5. Generate sitemaps
  console.log('🗺️  Generating sitemaps...');
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
  
  console.log(`\n✅ Static file generation complete!`);
  console.log(`   Total files generated: ${filesGenerated}`);
  console.log(`   Sitemaps: 4`);
}

// Run the build
buildStaticFiles().catch(console.error);
