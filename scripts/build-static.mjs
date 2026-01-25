#!/usr/bin/env node
/**
 * Static HTML Generation Script for DisputeLetters
 * 
 * Generates static HTML files for SEO (search engine bots)
 * while users get the React SPA experience.
 * 
 * Output:
 * - /dist/complaint-letter/:slug/index.html (100+ templates)
 * - /dist/category/:id/index.html (13 categories)
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
      templates.push({
        id: match[1],
        slug: match[2],
        category: match[3],
        title: match[4],
        shortDescription: match[5],
        longDescription: match[6],
        seoTitle: match[7],
        seoDescription: match[8],
      });
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
  const canonicalUrl = `${SITE_URL}/complaint-letter/${template.slug}`;
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": template.category, "item": `${SITE_URL}/category/${categoryId}` },
      { "@type": "ListItem", "position": 3, "name": template.title, "item": canonicalUrl }
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
    <a href="/">Home</a> → <a href="/category/${categoryId}">${escapeHtml(template.category)}</a> → ${escapeHtml(template.title)}
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
    
    <a href="/complaint-letter/${template.slug}" class="cta">Generate Your Letter Now</a>
  </main>
</body>
</html>`;
}

function generateCategoryHTML(category, templates) {
  const canonicalUrl = `${SITE_URL}/category/${category.id}`;
  const categoryTemplates = templates.filter(t => getCategoryIdFromName(t.category) === category.id);
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": category.name, "item": canonicalUrl }
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
      "url": `${SITE_URL}/complaint-letter/${t.slug}`
    }))
  };
  
  const templateListHtml = categoryTemplates.map(t => `
    <li>
      <a href="/complaint-letter/${t.slug}">${escapeHtml(t.title)}</a>
      <p>${escapeHtml(t.shortDescription)}</p>
    </li>
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
    <a href="/">Home</a> → ${escapeHtml(category.name)}
  </nav>
  
  <main>
    <h1>${escapeHtml(category.name)} Letter Templates</h1>
    <p class="description">${escapeHtml(category.description)}</p>
    
    <h2>${categoryTemplates.length} Available Templates</h2>
    <ul class="templates">
      ${templateListHtml}
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
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/articles</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
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

function generateCategoriesSitemap() {
  const urls = categories.map(cat => `  <url>
    <loc>${SITE_URL}/category/${cat.id}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');
  
  // Add blog category pages
  const blogCategoryUrls = blogCategories.map(cat => `  <url>
    <loc>${SITE_URL}/articles/${cat.slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
${blogCategoryUrls}
</urlset>`;
}

function generateTemplatesSitemap(templates) {
  const urls = templates.map(t => `  <url>
    <loc>${SITE_URL}/complaint-letter/${t.slug}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
  
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
  
  // Generate template HTML files
  console.log('📝 Generating template HTML files...');
  for (const template of templates) {
    const templateDir = path.join(distDir, 'complaint-letter', template.slug);
    fs.mkdirSync(templateDir, { recursive: true });
    
    const html = generateTemplateHTML(template);
    fs.writeFileSync(path.join(templateDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${templates.length} template pages`);
  
  // Generate category HTML files
  console.log('📝 Generating category HTML files...');
  for (const category of categories) {
    const categoryDir = path.join(distDir, 'category', category.id);
    fs.mkdirSync(categoryDir, { recursive: true });
    
    const html = generateCategoryHTML(category, templates);
    fs.writeFileSync(path.join(categoryDir, 'index.html'), html);
  }
  console.log(`   ✅ Generated ${categories.length} category pages`);
  
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
  fs.writeFileSync(path.join(sitemapsDir, 'categories.xml'), generateCategoriesSitemap());
  fs.writeFileSync(path.join(sitemapsDir, 'templates.xml'), generateTemplatesSitemap(templates));
  fs.writeFileSync(path.join(sitemapsDir, 'blog.xml'), generateBlogSitemap(blogPosts));
  console.log('   ✅ Generated 5 sitemap files');
  
  console.log('\n✅ Static HTML generation complete!');
  console.log(`   📊 Total: ${templates.length + categories.length + blogPosts.length + 1} HTML pages + 5 sitemaps`);
}

// Run the build
build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
