#!/usr/bin/env node
/**
 * Build-time validation: cross-checks siteContext.ts slug whitelist
 * against actual template slugs from allTemplates.ts.
 * Fails the build if any drift is detected.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1. Extract slugs from siteContext.ts whitelist
const siteContextPath = path.join(root, 'supabase/functions/_shared/siteContext.ts');
const siteContextContent = fs.readFileSync(siteContextPath, 'utf-8');

// Extract the DISPUTE_ASSISTANT_CONTEXT template slug section
// Slugs appear as comma/newline-separated identifiers between "AVAILABLE TEMPLATE SLUGS BY CATEGORY:" and "WHEN NO TEMPLATE MATCHES:"
const slugSectionMatch = siteContextContent.match(
  /AVAILABLE TEMPLATE SLUGS BY CATEGORY:\s*\n([\s\S]*?)WHEN NO TEMPLATE MATCHES:/
);

if (!slugSectionMatch) {
  console.error('❌ Could not find slug section in siteContext.ts');
  process.exit(1);
}

const slugSection = slugSectionMatch[1];

// Extract slugs: word chars and hyphens, ignoring category headers, comments, and section labels
const contextSlugs = new Set();
for (const line of slugSection.split('\n')) {
  const trimmed = line.trim();
  // Skip empty lines, category headers (contain "category-id:"), and section comments (start with --)
  if (!trimmed || trimmed.includes('category-id:') || trimmed.startsWith('--')) continue;
  // Extract comma-separated slugs from this line
  const slugs = trimmed.split(',').map(s => s.trim().replace(/,$/,'')).filter(s => s && /^[a-z0-9]/.test(s));
  slugs.forEach(s => contextSlugs.add(s));
}

// 2. Extract actual template slugs by reading allTemplates source files
// We parse .slug values from all template source files
const templateDirs = [
  'src/data/templates',
  'src/data',
];

function extractSlugsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const slugs = [];
  // Match slug: 'value' or slug: "value"
  const regex = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

function walkDir(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// Find all template files
const templateFiles = walkDir(path.join(root, 'src/data/templates'), /Templates?\.ts$/i);
// Also check letterTemplates.ts in src/data
const letterTemplatesPath = path.join(root, 'src/data/letterTemplates.ts');
if (fs.existsSync(letterTemplatesPath)) templateFiles.push(letterTemplatesPath);

const actualSlugs = new Set();
for (const file of templateFiles) {
  extractSlugsFromFile(file).forEach(s => actualSlugs.add(s));
}

// 3. Cross-check
const inContextNotInTemplates = [...contextSlugs].filter(s => !actualSlugs.has(s)).sort();
const inTemplatesNotInContext = [...actualSlugs].filter(s => !contextSlugs.has(s)).sort();

console.log(`\n🔍 Template Slug Validation`);
console.log(`   siteContext slugs: ${contextSlugs.size}`);
console.log(`   actual template slugs: ${actualSlugs.size}`);

let hasErrors = false;

if (inContextNotInTemplates.length > 0) {
  hasErrors = true;
  console.error(`\n❌ ${inContextNotInTemplates.length} slugs in siteContext.ts but NOT in template files (stale/hallucinated):`);
  inContextNotInTemplates.forEach(s => console.error(`   - ${s}`));
}

if (inTemplatesNotInContext.length > 0) {
  hasErrors = true;
  console.error(`\n⚠️  ${inTemplatesNotInContext.length} slugs in template files but NOT in siteContext.ts (missing from whitelist):`);
  inTemplatesNotInContext.forEach(s => console.error(`   - ${s}`));
}

if (hasErrors) {
  console.error(`\n❌ Slug validation FAILED. Update siteContext.ts or template files to resolve drift.`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${contextSlugs.size} slugs match. No drift detected.`);
}
