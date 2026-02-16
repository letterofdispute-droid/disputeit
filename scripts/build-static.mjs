#!/usr/bin/env node
/**
 * Static Build Script for DisputeLetters
 * 
 * Generates sitemaps to public/ folder for SEO:
 * - /public/sitemap.xml (sitemap index)
 * - /public/sitemap-static.xml (static pages)
 * - /public/sitemap-categories.xml (categories + subcategories + guides)
 * - /public/sitemap-templates.xml (all 400+ templates)
 * - /public/sitemap-blog.xml (blog categories + articles)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '..', 'dist');

// Supabase config for fetching blog posts via REST API
const SUPABASE_URL = 'https://koulmtfnkuapzigcplov.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';

const SITE_URL = 'https://letterofdispute.com';
const BUILD_DATE = new Date().toISOString().split('T')[0];

// ============================================
// Categories Data
// ============================================

const categories = [
  { id: 'refunds', name: 'Refunds & Purchases' },
  { id: 'housing', name: 'Housing' },
  { id: 'travel', name: 'Travel' },
  { id: 'damaged-goods', name: 'Damaged Goods' },
  { id: 'utilities', name: 'Utilities & Telecom' },
  { id: 'financial', name: 'Financial' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'vehicle', name: 'Vehicle' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'employment', name: 'Employment' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'hoa', name: 'HOA & Property' },
  { id: 'contractors', name: 'Contractors' },
];

// All subcategories per category (from subcategoryMappings.ts)
const subcategoriesByCategory = {
  'contractors': ['general', 'plumbing', 'electrical', 'roofing', 'hvac', 'landscaping', 'flooring-painting', 'kitchen-bath', 'windows-doors', 'specialty'],
  'healthcare': ['insurance-claims', 'billing', 'debt-collection', 'provider', 'pharmacy', 'privacy-records'],
  'insurance': ['auto', 'home', 'health', 'life', 'travel', 'pet', 'business'],
  'housing': ['repairs', 'deposits', 'tenancy', 'neighbor', 'letting-agents', 'safety'],
  'travel': ['flights', 'hotels', 'cruises', 'car-rentals', 'tours', 'rail-bus'],
  'employment': ['wages', 'termination', 'discrimination', 'benefits', 'workplace'],
  'utilities': ['energy', 'water', 'internet', 'phone', 'tv-cable'],
  'financial': ['banking', 'credit-cards', 'loans', 'credit-reports', 'debt-collection', 'investments', 'fraud'],
  'refunds': ['refunds', 'warranty', 'subscriptions', 'delivery', 'service'],
  'damaged-goods': ['delivery-damage', 'defective', 'misrepresentation', 'warranty-repair'],
  'vehicle': ['dealer', 'repair', 'warranty-lemon', 'finance', 'parking'],
  'ecommerce': ['refunds', 'delivery', 'marketplace', 'subscriptions', 'privacy'],
  'hoa': ['fees', 'violations', 'maintenance', 'neighbor', 'governance'],
};

// Blog categories (from blogPosts.ts)
const blogCategories = [
  'consumer-rights',
  'landlord-tenant',
  'travel-disputes',
  'financial-tips',
  'legal-guides',
];

// ============================================
// Subcategory patterns for inferring from template ID
// ============================================

const subcategoryPatterns = {
  'Contractors': [
    { pattern: /^general-|project-delay|cost-overrun|abandoned-|unfinished-|permit-|lien-|contract-dispute/, slug: 'general' },
    { pattern: /plumb|leak|pipe|water-heater|drain|sewage|toilet|faucet/, slug: 'plumbing' },
    { pattern: /electri|wiring|outlet|panel|circuit|breaker|electrical/, slug: 'electrical' },
    { pattern: /roof|gutter|shingle|flashing|skylight/, slug: 'roofing' },
    { pattern: /hvac|heating|cooling|air-conditioning|furnace|ac-|heat-pump|ductwork|thermostat/, slug: 'hvac' },
    { pattern: /landscap|lawn|irrigation|sprinkler|tree|garden|hardscape|patio|deck/, slug: 'landscaping' },
    { pattern: /floor|paint|carpet|tile|hardwood|laminate|wallpaper|stain/, slug: 'flooring-painting' },
    { pattern: /kitchen|bath|cabinet|countertop|remodel/, slug: 'kitchen-bath' },
    { pattern: /window|door|siding|glass/, slug: 'windows-doors' },
    { pattern: /pool|fence|garage|foundation|basement|concrete|masonry|solar|home-security|pest|mold|asbestos|demolition/, slug: 'specialty' },
  ],
  'Healthcare': [
    { pattern: /insurance-|claim-denial|prior-auth|pre-auth|coverage/, slug: 'insurance-claims' },
    { pattern: /billing-|overcharge|invoice|charge-dispute|itemized/, slug: 'billing' },
    { pattern: /debt-|collection|collector/, slug: 'debt-collection' },
    { pattern: /hospital|provider|doctor|physician|nurse|staff|facility/, slug: 'provider' },
    { pattern: /prescription|pharmacy|medication|rx|drug/, slug: 'pharmacy' },
    { pattern: /hipaa|privacy|records|medical-record/, slug: 'privacy-records' },
  ],
  'Insurance': [
    { pattern: /auto-|car-|vehicle-|accident-claim|collision/, slug: 'auto' },
    { pattern: /home-|property-|homeowner|damage-claim|storm|fire|water-damage|theft-claim/, slug: 'home' },
    { pattern: /health-|medical-insurance|claim-denial|pre-existing|out-of-network/, slug: 'health' },
    { pattern: /life-|beneficiary|death-benefit/, slug: 'life' },
    { pattern: /travel-|trip-|flight-insurance|luggage-insurance/, slug: 'travel' },
    { pattern: /pet-|veterinary/, slug: 'pet' },
    { pattern: /business-|liability|professional/, slug: 'business' },
  ],
  'Housing': [
    { pattern: /repair|maintenance|fix|broken|mold|pest|heating|plumbing-issue/, slug: 'repairs' },
    { pattern: /deposit|security|move-out|deduction/, slug: 'deposits' },
    { pattern: /rent-|lease|eviction|tenancy|notice-to-quit/, slug: 'tenancy' },
    { pattern: /neighbor|noise|nuisance/, slug: 'neighbor' },
    { pattern: /letting-agent|property-manager|estate-agent|management-company/, slug: 'letting-agents' },
    { pattern: /safety|fire-safety|gas-safety|electrical-safety|habitability/, slug: 'safety' },
  ],
  'Travel': [
    { pattern: /flight|airline|delay|cancellation|eu261|baggage|luggage|boarding|overbooking/, slug: 'flights' },
    { pattern: /hotel|accommodation|booking|reservation|room/, slug: 'hotels' },
    { pattern: /cruise|ship|cabin|onboard/, slug: 'cruises' },
    { pattern: /car-rental|rental-car|hire-car|vehicle-rental/, slug: 'car-rentals' },
    { pattern: /tour|package|travel-agent|vacation|holiday/, slug: 'tours' },
    { pattern: /rail|train|bus|coach/, slug: 'rail-bus' },
  ],
  'Employment': [
    { pattern: /wage|pay|salary|overtime|commission|bonus|paycheck/, slug: 'wages' },
    { pattern: /terminat|fired|dismissal|wrongful|severance/, slug: 'termination' },
    { pattern: /discriminat|harassment|hostile|retaliation|whistleblower/, slug: 'discrimination' },
    { pattern: /benefit|401k|health-insurance|pto|vacation|leave/, slug: 'benefits' },
    { pattern: /workplace|safety|osha|condition|ergonomic/, slug: 'workplace' },
  ],
  'Utilities & Telecom': [
    { pattern: /energy|gas|electric|power|utility-bill/, slug: 'energy' },
    { pattern: /water|sewage|sewer/, slug: 'water' },
    { pattern: /internet|broadband|wifi|isp|fiber/, slug: 'internet' },
    { pattern: /phone|mobile|cell|carrier|telecom|sms|call/, slug: 'phone' },
    { pattern: /cable|tv|streaming|satellite/, slug: 'tv-cable' },
  ],
  'Financial': [
    { pattern: /bank|account|checking|savings|atm|branch/, slug: 'banking' },
    { pattern: /credit-card|charge|statement|interest|apr/, slug: 'credit-cards' },
    { pattern: /loan|mortgage|lending|interest-rate/, slug: 'loans' },
    { pattern: /credit-report|credit-score|bureau|equifax|experian|transunion/, slug: 'credit-reports' },
    { pattern: /debt|collection|collector/, slug: 'debt-collection' },
    { pattern: /investment|broker|advisor|retirement|401k/, slug: 'investments' },
    { pattern: /scam|fraud|unauthorized|identity/, slug: 'fraud' },
  ],
  'Refunds & Purchases': [
    { pattern: /refund|return|money-back/, slug: 'refunds' },
    { pattern: /warranty|guarantee|defect/, slug: 'warranty' },
    { pattern: /subscription|recurring|cancel|auto-renew/, slug: 'subscriptions' },
    { pattern: /delivery|shipping|late|missing|lost-package/, slug: 'delivery' },
    { pattern: /service|poor-service|unsatisfactory/, slug: 'service' },
  ],
  'Damaged Goods': [
    { pattern: /delivery|shipping|transit|carrier/, slug: 'delivery-damage' },
    { pattern: /defect|faulty|malfunction|broken/, slug: 'defective' },
    { pattern: /misrepresent|description|advertised|fake|counterfeit/, slug: 'misrepresentation' },
    { pattern: /warranty|repair/, slug: 'warranty-repair' },
  ],
  'Vehicle': [
    { pattern: /dealer|dealership|sales|purchase/, slug: 'dealer' },
    { pattern: /repair|mechanic|garage|service-center/, slug: 'repair' },
    { pattern: /warranty|lemon|defect/, slug: 'warranty-lemon' },
    { pattern: /finance|loan|lease|payment/, slug: 'finance' },
    { pattern: /parking|ticket|tow|traffic/, slug: 'parking' },
  ],
  'E-commerce': [
    { pattern: /refund|return|chargeback/, slug: 'refunds' },
    { pattern: /delivery|shipping|late|missing/, slug: 'delivery' },
    { pattern: /seller|marketplace|amazon|ebay/, slug: 'marketplace' },
    { pattern: /subscription|recurring|trial/, slug: 'subscriptions' },
    { pattern: /privacy|data|account|gdpr|ccpa/, slug: 'privacy' },
  ],
  'HOA & Property': [
    { pattern: /fee|assessment|dues|charge/, slug: 'fees' },
    { pattern: /violation|fine|rule|architectural|enforcement/, slug: 'violations' },
    { pattern: /maintenance|common-area|amenity|repair/, slug: 'maintenance' },
    { pattern: /neighbor|dispute|noise|parking/, slug: 'neighbor' },
    { pattern: /governance|board|meeting|election/, slug: 'governance' },
  ],
};

function inferSubcategory(templateId, category) {
  const patterns = subcategoryPatterns[category];
  if (!patterns) return 'general';
  
  const idLower = templateId.toLowerCase();
  
  for (const { pattern, slug } of patterns) {
    if (pattern.test(idLower)) {
      return slug;
    }
  }
  
  return 'general';
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
// Template Loading
// ============================================

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
    
    // Match template objects - extract id, slug, and category
    const templateMatches = content.matchAll(/{\s*id:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"]/g);
    
    for (const match of templateMatches) {
      const template = {
        id: match[1],
        slug: match[2],
        category: match[3],
      };
      
      template.subcategorySlug = inferSubcategory(template.id, template.category);
      templates.push(template);
    }
  }
  
  return templates;
}

// ============================================
// Blog Post Loading
// ============================================

async function loadBlogPosts() {
  console.log('   Fetching blog posts from database (paginated)...');
  const allPosts = [];
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,category_slug,updated_at&order=published_at.desc&offset=${offset}&limit=${BATCH_SIZE}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.log(`   ⚠️ Fetch failed at offset ${offset}: ${response.status}`);
        break;
      }
      const data = await response.json();
      allPosts.push(...data.map(post => ({
        slug: post.slug,
        categorySlug: post.category_slug,
        lastmod: post.updated_at?.split('T')[0] || BUILD_DATE
      })));
      console.log(`   📦 Fetched ${data.length} posts (offset ${offset}, total so far: ${allPosts.length})`);
      hasMore = data.length === BATCH_SIZE;
      offset += BATCH_SIZE;
    }
  } catch (err) {
    console.log(`   ⚠️ Error fetching blog posts: ${err.message}`);
  }

  return allPosts;
}

// ============================================
// Sitemap Generators
// ============================================

function generateSitemapIndex(blogPageCount) {
  const blogEntries = [];
  for (let i = 1; i <= blogPageCount; i++) {
    blogEntries.push(`  <sitemap>
    <loc>${SITE_URL}/sitemap-blog-${i}.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-static.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-categories.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-templates.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
${blogEntries.join('\n')}
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
    { loc: '/guides', priority: '0.7', changefreq: 'weekly' },
    { loc: '/articles', priority: '0.8', changefreq: 'daily' },
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

function generateCategoriesSitemap() {
  const urls = [];
  
  // Main category pages
  for (const cat of categories) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/templates/${cat.id}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    
    // Subcategory pages
    const subcats = subcategoriesByCategory[cat.id] || [];
    for (const subcat of subcats) {
      urls.push(`
  <url>
    <loc>${SITE_URL}/templates/${cat.id}/${subcat}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
    
    // Guide page for each category
    urls.push(`
  <url>
    <loc>${SITE_URL}/guides/${cat.id}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

const BLOG_SITEMAP_PAGE_SIZE = 1000;

function generateBlogSitemaps(blogPosts) {
  // Page 1 always includes blog category pages + first batch of posts
  const pages = [];
  
  // Category URLs (always in page 1)
  const categoryUrls = blogCategories.map(cat => `
  <url>
    <loc>${SITE_URL}/articles/${cat}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

  // Split posts into chunks
  const postChunks = [];
  for (let i = 0; i < blogPosts.length; i += BLOG_SITEMAP_PAGE_SIZE) {
    postChunks.push(blogPosts.slice(i, i + BLOG_SITEMAP_PAGE_SIZE));
  }
  if (postChunks.length === 0) postChunks.push([]);

  for (let i = 0; i < postChunks.length; i++) {
    const postUrls = postChunks[i].map(post => `
  <url>
    <loc>${SITE_URL}/articles/${post.categorySlug}/${post.slug}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);

    const allUrls = i === 0 ? [...categoryUrls, ...postUrls] : postUrls;

    pages.push(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allUrls.join('')}
</urlset>`);
  }

  return pages;
}

// ============================================
// Main Build Function
// ============================================

async function buildSitemaps() {
  console.log('\n🗺️  Generating sitemaps...\n');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('📚 Loading templates...');
  const templates = await loadAllTemplates();
  console.log(`   ✅ Found ${templates.length} templates`);
  
  console.log('📝 Loading blog posts...');
  const blogPosts = await loadBlogPosts();
  console.log(`   ✅ Found ${blogPosts.length} blog posts`);
  
  // Generate content
  const sitemapStatic = generateStaticSitemap();
  const sitemapCategories = generateCategoriesSitemap();
  const sitemapTemplates = generateTemplatesSitemap(templates);
  const blogSitemapPages = generateBlogSitemaps(blogPosts);
  const sitemapIndex = generateSitemapIndex(blogSitemapPages.length);
  
  const publicDir = path.join(__dirname, '..', 'public');

  // Write to both dist/ and public/
  for (const dir of [outputDir, publicDir]) {
    const label = dir === outputDir ? 'dist' : 'public';
    console.log(`\n📄 Writing sitemap files to ${label}/...`);
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemapIndex);
    fs.writeFileSync(path.join(dir, 'sitemap-static.xml'), sitemapStatic);
    fs.writeFileSync(path.join(dir, 'sitemap-categories.xml'), sitemapCategories);
    fs.writeFileSync(path.join(dir, 'sitemap-templates.xml'), sitemapTemplates);
    
    // Write paginated blog sitemaps
    for (let i = 0; i < blogSitemapPages.length; i++) {
      fs.writeFileSync(path.join(dir, `sitemap-blog-${i + 1}.xml`), blogSitemapPages[i]);
    }
    console.log(`   ✅ Sitemaps written to ${label}/`);
  }
  
  const subcatCount = Object.values(subcategoriesByCategory).flat().length;
  const blogUrlCount = blogCategories.length + blogPosts.length;
  const totalUrls = 12 + categories.length + subcatCount + categories.length + templates.length + blogUrlCount;
  console.log(`\n✨ Generated ${totalUrls} URLs across ${3 + blogSitemapPages.length} sitemap files (in both dist/ and public/)\n`);
}

buildSitemaps().catch(console.error);
