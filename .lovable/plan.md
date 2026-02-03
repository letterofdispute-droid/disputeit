
# Cleanup Plan: Remove Homepage SEO Content Injection

## What's Being Removed

Since Google successfully renders the JavaScript and sees correct page content, the static HTML injection is unnecessary and causes confusion (showing homepage content in "View Source" for all pages).

## Changes

### 1. Simplify `scripts/inject-homepage-content.mjs`

**Remove:** The static homepage content injection into `<div id="root">`

**Keep:** Only the loading overlay (CSS + HTML) for a smooth loading experience

The file will:
- Still inject the overlay CSS into `<head>`
- Still inject the loading overlay div after `<body>`
- **No longer** inject any content into `<div id="root">`

### 2. Simplify `scripts/build-static.mjs`

**Remove:** All the SPA-ready HTML generation code (lines ~340-650+)

**Keep:** Only sitemap generation functionality

The file will focus on generating:
- `sitemap-index.xml`
- `static.xml` (static pages)
- `categories.xml` (category pages)
- `templates.xml` (all template pages)

This removes hundreds of lines of unused code that generates HTML files Lovable hosting doesn't serve.

### 3. `src/main.tsx` - No changes needed

The overlay removal logic should remain - it's harmless and provides a smooth transition if the overlay is ever present.

### 4. `vite.config.ts` - No changes needed

The build pipeline structure is fine - it will continue to run:
1. `build-static.mjs` (now only generates sitemaps)
2. `inject-homepage-content.mjs` (now only adds loading overlay)

---

## Result

| Before | After |
|--------|-------|
| View source shows homepage content on ALL pages | View source shows empty `<div id="root">` on all pages |
| Confusing for debugging | Clean and expected behavior |
| Google still renders JS correctly | Google still renders JS correctly (no change) |
| Loading overlay works | Loading overlay works (no change) |

---

## Files to Modify

| File | Action |
|------|--------|
| `scripts/inject-homepage-content.mjs` | Simplify - remove static content injection, keep only overlay |
| `scripts/build-static.mjs` | Simplify - remove HTML generation, keep only sitemaps |

---

## Technical Details

### `inject-homepage-content.mjs` After Cleanup

```javascript
// Only injects loading overlay - no static content
function injectOverlay() {
  const indexPath = path.join(distDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  
  // 1. Inject overlay CSS into <head>
  html = html.replace('</head>', `${overlayCSS}\n</head>`);
  
  // 2. Inject loading overlay after <body> tag
  html = html.replace('<body>', `<body>\n${overlayHTML}`);
  
  // NO static content injection into #root
  
  fs.writeFileSync(indexPath, html);
}
```

### `build-static.mjs` After Cleanup

The file will be reduced from ~900 lines to ~300 lines, containing only:
- Site URL and date constants
- Template loading logic (for sitemap generation)
- Sitemap generation functions
- Main execution that generates sitemaps only
