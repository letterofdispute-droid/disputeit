/**
 * Post-build script: Generate per-route HTML files with correct meta tags.
 *
 * Reads dist/index.html as a template, fetches all pages from the database
 * that have a meta_title, and writes dist/{slug}/index.html AND dist/{slug}.html
 * with the correct <title>, <meta description>, <link canonical>, OG and Twitter tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

const SUPABASE_URL = 'https://koulmtfnkuapzigcplov.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';
const SITE_URL = 'https://letterofdispute.com';
const BATCH_SIZE = 500;

// Slugs to validate after generation — build fails if these still have homepage meta
const VALIDATION_SLUGS = ['state-rights/alaska', 'state-rights/california'];
const HOMEPAGE_TITLE_FRAGMENT = 'Professional Complaint Letters That Get Results';

async function fetchAllPages() {
  const allPages = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${SUPABASE_URL}/rest/v1/pages?select=slug,meta_title,meta_description,featured_image_url&meta_title=not.is.null&status=eq.published&order=slug.asc&offset=${offset}&limit=${BATCH_SIZE}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase fetch failed (${res.status}): ${await res.text()}`);
    }

    const batch = await res.json();
    allPages.push(...batch);
    hasMore = batch.length === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  return allPages;
}

function replaceMetaTags(html, page) {
  const slug = page.slug.replace(/\/+$/, '');
  const canonicalUrl = slug === '/' || slug === ''
    ? `${SITE_URL}/`
    : `${SITE_URL}/${slug}`;
  const title = page.meta_title;
  const description = page.meta_description || '';
  const ogImage = page.featured_image_url || `${SITE_URL}/ld-og-default.png`;

  let result = html;

  // <title>...</title>
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );

  // <meta name="description" ...>
  result = result.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(description)}" />`
  );

  // <link rel="canonical" ...>
  result = result.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // og:title
  result = result.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeAttr(title)}" />`
  );

  // og:description
  result = result.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeAttr(description)}" />`
  );

  // og:url
  result = result.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // og:image
  result = result.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${ogImage}" />`
  );

  // twitter:title
  result = result.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`
  );

  // twitter:description
  result = result.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`
  );

  // twitter:image
  result = result.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${ogImage}" />`
  );

  // twitter:url
  result = result.replace(
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${canonicalUrl}" />`
  );

  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateRedirectsFile(pages) {
  console.log('\n🔀 Generating _redirects with per-route rewrite rules...');

  // Read base template from public/_redirects
  const baseRedirectsPath = path.join(__dirname, '..', 'public', '_redirects');
  let baseContent = '';
  if (fs.existsSync(baseRedirectsPath)) {
    baseContent = fs.readFileSync(baseRedirectsPath, 'utf-8');
  }

  // Remove existing SPA fallback from base (we'll add it at the end)
  const baseLines = baseContent.split('\n').filter(line => {
    const trimmed = line.trim();
    // Remove the catch-all SPA fallback — we re-add it last
    if (trimmed === '/* /index.html 200') return false;
    return true;
  });

  // Build per-slug rewrite rules
  const routeRules = [];
  for (const page of pages) {
    if (!page.meta_title || !page.slug) continue;
    const slug = page.slug.replace(/^\/+|\/+$/g, '');
    if (!slug) continue;
    routeRules.push(`/${slug}  /${slug}.html  200`);
  }

  // Assemble final _redirects
  const finalContent = [
    ...baseLines.filter(l => l.trim() !== ''),
    '',
    '# Auto-generated per-route rewrites (build-time)',
    ...routeRules,
    '',
    '# SPA fallback — must be last',
    '/* /index.html 200',
    '',
  ].join('\n');

  const redirectsPath = path.join(distDir, '_redirects');
  fs.writeFileSync(redirectsPath, finalContent);
  console.log(`✅ Wrote ${routeRules.length} route rewrite rules to dist/_redirects`);

  return routeRules;
}

function validateGeneratedFiles(routeRules) {
  console.log('\n🔍 Validating key route HTML files and redirects...');
  const errors = [];

  for (const slug of VALIDATION_SLUGS) {
    const dirPath = path.join(distDir, slug, 'index.html');
    const flatPath = path.join(distDir, `${slug}.html`);

    // Check at least one file exists
    const existsDir = fs.existsSync(dirPath);
    const existsFlat = fs.existsSync(flatPath);
    if (!existsDir && !existsFlat) {
      errors.push(`❌ No HTML file generated for slug "${slug}"`);
      continue;
    }

    // Read whichever exists and check content
    const html = fs.readFileSync(existsDir ? dirPath : flatPath, 'utf-8');

    // Title must NOT contain homepage fragment
    if (html.includes(HOMEPAGE_TITLE_FRAGMENT)) {
      errors.push(`❌ slug "${slug}" still contains homepage title fragment`);
    }

    // Canonical must point to the route, not homepage
    const expectedCanonical = `${SITE_URL}/${slug}`;
    if (!html.includes(expectedCanonical)) {
      errors.push(`❌ slug "${slug}" canonical does not contain "${expectedCanonical}"`);
    }

    // Check _redirects contains rewrite for this slug
    const expectedRule = `/${slug}  /${slug}.html  200`;
    if (!routeRules.includes(expectedRule)) {
      errors.push(`❌ slug "${slug}" missing rewrite rule in _redirects`);
    }
  }

  if (errors.length > 0) {
    console.error('\n🚨 Build-time validation FAILED:');
    errors.forEach(e => console.error(e));
    throw new Error(`inject-page-meta validation failed for ${errors.length} slug(s)`);
  }

  console.log(`✅ Validation passed for ${VALIDATION_SLUGS.length} key slug(s)`);
}

async function main() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  dist/index.html not found, skipping page meta injection');
    return;
  }

  const template = fs.readFileSync(indexPath, 'utf-8');

  console.log('📡 Fetching pages from database...');
  const pages = await fetchAllPages();
  console.log(`📄 Found ${pages.length} pages with meta_title`);

  let created = 0;
  let skipped = 0;

  for (const page of pages) {
    if (!page.meta_title || !page.slug) {
      skipped++;
      continue;
    }

    // Normalize slug — strip leading/trailing slashes
    const slug = page.slug.replace(/^\/+|\/+$/g, '');
    if (!slug) {
      skipped++;
      continue; // homepage already has correct meta in index.html
    }

    const html = replaceMetaTags(template, { ...page, slug });

    // Write dist/{slug}/index.html
    const dir = path.join(distDir, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);

    // Write dist/{slug}.html (flat file for hosts that resolve this way)
    const parentDir = path.dirname(path.join(distDir, `${slug}.html`));
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, `${slug}.html`), html);

    created++;
  }

  console.log(`✅ Generated ${created} static HTML files (×2 each) with unique meta tags (${skipped} skipped)`);

  // Generate _redirects with per-route rewrite rules
  const routeRules = generateRedirectsFile(pages);

  // Validate key slugs and redirect entries
  validateGeneratedFiles(routeRules);
}

main().catch((err) => {
  console.error('❌ inject-page-meta failed:', err);
  process.exit(1);
});
