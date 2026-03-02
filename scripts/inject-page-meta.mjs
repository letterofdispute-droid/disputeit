/**
 * Post-build script: Generate per-route HTML files with correct meta tags.
 *
 * Reads dist/index.html as a template, fetches all pages from the database
 * that have a meta_title, and writes dist/{slug}/index.html with the correct
 * <title>, <meta description>, <link canonical>, OG and Twitter tags.
 *
 * This ensures crawlers and "View Source" see unique meta for every page,
 * even though this is an SPA.
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

async function main() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  dist/index.html not found, skipping page meta injection');
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('⚠️  Missing SUPABASE env vars, skipping page meta injection');
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
    const dir = path.join(distDir, slug);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, 'index.html');
    // Don't overwrite if already exists (e.g. from build-static.mjs)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, html);
      created++;
    } else {
      // Overwrite with updated meta tags
      fs.writeFileSync(filePath, html);
      created++;
    }
  }

  console.log(`✅ Generated ${created} static HTML files with unique meta tags (${skipped} skipped)`);
}

main().catch((err) => {
  console.error('❌ inject-page-meta failed:', err);
  process.exit(1);
});
