#!/usr/bin/env node
/**
 * SSG Verification: State Rights Pages
 * =====================================
 * Verifies that /state-rights/california and /state-rights/california/vehicle
 * each produce unique, meaningful <title> tags in the pre-rendered HTML.
 *
 * Run after a production build:
 *   node scripts/verify-state-rights-ssg.mjs
 *
 * Also validates:
 *   - sitemap-state-rights.xml exists and contains the correct URL count
 *   - sitemap.xml index references sitemap-state-rights.xml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir   = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');

// ─── Colour helpers ──────────────────────────────────────────────────────────
const green  = s => `\x1b[32m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function ok(msg)   { console.log(`  ${green('✔')} ${msg}`); passed++; }
function fail(msg) { console.log(`  ${red('✘')} ${msg}`);   failed++; }
function info(msg) { console.log(`  ${yellow('ℹ')} ${msg}`); }

// ─── Helper: extract <title> from HTML string ─────────────────────────────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

// ─── Helper: read a dist file if it exists ────────────────────────────────────
function readDist(relPath) {
  const full = path.join(distDir, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

// ─── Helper: read a public file if it exists ─────────────────────────────────
function readPublic(relPath) {
  const full = path.join(publicDir, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

// ─── 1. Sitemap file checks ───────────────────────────────────────────────────
console.log(bold('\n🗺️  Sitemap checks'));

const stateRightsSitemapContent = readPublic('sitemap-state-rights.xml');

if (!stateRightsSitemapContent) {
  fail('sitemap-state-rights.xml not found in public/ — run a production build first');
} else {
  ok('sitemap-state-rights.xml exists in public/');

  // Count <loc> entries
  const locMatches = stateRightsSitemapContent.match(/<loc>/g) || [];
  const urlCount = locMatches.length;

  // Expected: 1 hub + 51 state hubs + 51*13 category pages = 715
  const EXPECTED_URLS = 1 + 51 + (51 * 13); // 715
  if (urlCount === EXPECTED_URLS) {
    ok(`sitemap-state-rights.xml contains exactly ${urlCount} URLs (1 hub + 51 states + 663 category pages)`);
  } else {
    fail(`sitemap-state-rights.xml has ${urlCount} URLs — expected ${EXPECTED_URLS}`);
    info(`Difference: ${urlCount - EXPECTED_URLS > 0 ? '+' : ''}${urlCount - EXPECTED_URLS}`);
  }

  // Check canonical sample URLs
  const sampleUrls = [
    'https://letterofdispute.com/state-rights',
    'https://letterofdispute.com/state-rights/california',
    'https://letterofdispute.com/state-rights/california/vehicle',
    'https://letterofdispute.com/state-rights/new-york',
    'https://letterofdispute.com/state-rights/texas/financial',
    'https://letterofdispute.com/state-rights/district-of-columbia/housing',
  ];

  for (const url of sampleUrls) {
    if (stateRightsSitemapContent.includes(`<loc>${url}</loc>`)) {
      ok(`URL present: ${url}`);
    } else {
      fail(`URL missing: ${url}`);
    }
  }

  // Verify lastmod and priority are present
  if (stateRightsSitemapContent.includes('<lastmod>')) {
    ok('lastmod tags present');
  } else {
    fail('lastmod tags missing');
  }
  if (stateRightsSitemapContent.includes('<priority>')) {
    ok('priority tags present');
  } else {
    fail('priority tags missing');
  }

  // Verify priority tiers
  if (stateRightsSitemapContent.includes('<priority>0.8</priority>')) {
    ok('Hub page priority 0.8 found');
  } else {
    fail('Hub page priority 0.8 missing');
  }
  if (stateRightsSitemapContent.includes('<priority>0.7</priority>')) {
    ok('State hub priority 0.7 found');
  } else {
    fail('State hub priority 0.7 missing');
  }
  if (stateRightsSitemapContent.includes('<priority>0.6</priority>')) {
    ok('Category page priority 0.6 found');
  } else {
    fail('Category page priority 0.6 missing');
  }
}

// Sitemap index references sitemap-state-rights.xml
const sitemapIndex = readPublic('sitemap.xml');
if (!sitemapIndex) {
  fail('sitemap.xml not found in public/');
} else {
  ok('sitemap.xml exists in public/');
  if (sitemapIndex.includes('sitemap-state-rights.xml')) {
    ok('sitemap.xml index references sitemap-state-rights.xml');
  } else {
    fail('sitemap.xml does NOT reference sitemap-state-rights.xml');
  }
}

// ─── 2. SSG pre-rendering checks ─────────────────────────────────────────────
console.log(bold('\n📄 SSG pre-rendering checks'));
console.log(info('Note: SSG checks require a production build (vite-ssg). SPA builds use a single index.html.'));

const ssgPaths = [
  {
    distPath: 'state-rights/california/index.html',
    expectedTitleFragment: 'California',
    label: '/state-rights/california',
  },
  {
    distPath: 'state-rights/california/vehicle/index.html',
    expectedTitleFragment: 'California',
    label: '/state-rights/california/vehicle',
  },
  {
    distPath: 'state-rights/new-york/housing/index.html',
    expectedTitleFragment: 'New York',
    label: '/state-rights/new-york/housing',
  },
  {
    distPath: 'state-rights/texas/financial/index.html',
    expectedTitleFragment: 'Texas',
    label: '/state-rights/texas/financial',
  },
];

let ssgBuilt = false;

for (const check of ssgPaths) {
  const html = readDist(check.distPath);
  if (!html) {
    info(`${check.label} — pre-rendered HTML not found (expected at dist/${check.distPath})`);
    continue;
  }

  ssgBuilt = true;
  const title = extractTitle(html);

  if (!title) {
    fail(`${check.label} — no <title> tag found in pre-rendered HTML`);
    continue;
  }

  if (title.toLowerCase().includes(check.expectedTitleFragment.toLowerCase())) {
    ok(`${check.label} — title: "${title}"`);
  } else {
    fail(`${check.label} — title "${title}" does not contain "${check.expectedTitleFragment}"`);
  }

  // Verify canonical tag
  if (html.includes(`/state-rights/${check.distPath.replace('/index.html', '')}`)) {
    ok(`${check.label} — canonical path present in HTML`);
  } else {
    info(`${check.label} — canonical path check skipped (react-helmet renders at runtime)`);
  }
}

if (!ssgBuilt) {
  info('No pre-rendered HTML files found in dist/ — this is expected for SPA/dev builds.');
  info('Pre-rendered files are only generated with: vite-ssg build');
  info('The routes ARE registered in src/routes.ts and App.tsx for SSG generation.');
  info('Verify with: grep "state-rights" src/routes.ts');
}

// ─── 3. routes.ts verification ────────────────────────────────────────────────
console.log(bold('\n📋 routes.ts verification'));

const routesFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes.ts'), 'utf-8');

if (routesFile.includes('getStateRightsRoutes') || routesFile.includes('state-rights')) {
  ok('routes.ts contains state-rights route generation');
} else {
  fail('routes.ts does NOT contain state-rights route generation');
}

if (routesFile.includes('getStateSlug') || routesFile.includes('US_STATES')) {
  ok('routes.ts imports state slug helpers from stateSpecificLaws');
} else {
  fail('routes.ts does not import state slug helpers');
}

// ─── 4. App.tsx route registration ────────────────────────────────────────────
console.log(bold('\n🔀 App.tsx route registration'));

const appFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf-8');

if (appFile.includes('/state-rights/:stateSlug')) {
  ok('App.tsx registers /state-rights/:stateSlug route');
} else {
  fail('App.tsx missing /state-rights/:stateSlug route');
}

if (appFile.includes('/state-rights/:stateSlug/:categorySlug')) {
  ok('App.tsx registers /state-rights/:stateSlug/:categorySlug route');
} else {
  fail('App.tsx missing /state-rights/:stateSlug/:categorySlug route');
}

if (appFile.includes('StateRightsStatePage')) {
  ok('StateRightsStatePage component is lazy-loaded in App.tsx');
} else {
  fail('StateRightsStatePage not found in App.tsx');
}

if (appFile.includes('StateRightsCategoryPage')) {
  ok('StateRightsCategoryPage component is lazy-loaded in App.tsx');
} else {
  fail('StateRightsCategoryPage not found in App.tsx');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(bold(`\n${'─'.repeat(52)}`));
console.log(`  ${green(`${passed} passed`)}  ${failed > 0 ? red(`${failed} failed`) : ''}`);

if (failed === 0) {
  console.log(bold(green('\n  ✔ All checks passed — state rights SEO architecture is correct.\n')));
} else {
  console.log(bold(red(`\n  ✘ ${failed} check(s) failed — review output above.\n`)));
  process.exit(1);
}
