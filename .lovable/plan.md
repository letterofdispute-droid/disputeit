
# Route-Specific SEO Content Injection

## Problem Identified

The static HTML files **are being generated** correctly:
- `dist/templates/refunds/index.html` (category pages)
- `dist/templates/refunds/refunds/refund-trial-conversion/index.html` (template pages)

But Lovable hosting uses standard **SPA routing** - ALL routes serve the same `dist/index.html`, which only contains homepage content.

## Solution: Unified Static HTML Generator

Since we can't control server-side routing on Lovable hosting, we need to **replace the generated `index.html` files** so they can work as SPA entry points with route-specific content.

### How It Will Work

```text
BUILD PROCESS:
┌──────────────────────────────────────────────────────────────────┐
│ 1. Vite builds React app → dist/index.html                      │
│ 2. build-static.mjs generates static files at each route        │
│ 3. NEW: Each static file includes:                              │
│    • Route-specific SEO meta tags                               │
│    • Route-specific body content (for bots)                     │
│    • React SPA entry script (for humans)                        │
│    • Loading overlay                                            │
└──────────────────────────────────────────────────────────────────┘

RESULT:
dist/
├── index.html                          ← Homepage content + React SPA
├── templates/
│   ├── index.html                      ← All Templates page + React SPA
│   └── refunds/
│       ├── index.html                  ← Refunds category + React SPA
│       └── refunds/
│           └── refund-trial-conversion/
│               └── index.html          ← Template content + React SPA
```

Each `index.html` file becomes a **complete standalone entry point** that:
1. Contains route-specific SEO content (visible to bots)
2. Includes the React SPA scripts (for interactive features)
3. Has the loading overlay (smooth transition for humans)

### Key Insight

The current `build-static.mjs` already generates complete HTML files, but they're **standalone static pages without React**. We need to modify them to be **React SPA entry points with SEO content**.

---

## Implementation Plan

### Step 1: Modify `build-static.mjs` to Generate SPA-Ready HTML

Update the HTML generator functions to:
1. Include the same `<head>` assets as the main `index.html` (CSS, JS bundles)
2. Add the loading overlay
3. Include route-specific SEO content in the `#root` div

**Changes to `generateTemplateHTML()`, `generateCategoryHTML()`, etc.:**

```javascript
// Before: Standalone static HTML
return `<!DOCTYPE html>
<html>
<head>
  <title>${template.seoTitle}</title>
  <!-- No React scripts -->
</head>
<body>
  <main>Static content only</main>
</body>
</html>`;

// After: SPA entry point with SEO content
return `<!DOCTYPE html>
<html>
<head>
  <title>${template.seoTitle}</title>
  ${overlayCSS}
  ${reactScriptLinks} <!-- from main index.html -->
</head>
<body>
  ${overlayHTML}
  <div id="root">
    ${seoStaticContent} <!-- route-specific content -->
  </div>
  ${reactScripts} <!-- from main index.html -->
</body>
</html>`;
```

### Step 2: Extract React Assets from Built `index.html`

After Vite builds, read `dist/index.html` to extract:
- CSS link tags from `<head>`
- JS script tags from `<body>`

```javascript
function extractReactAssets() {
  const indexHtml = fs.readFileSync('dist/index.html', 'utf-8');
  
  // Extract <link> and <script> tags
  const cssLinks = indexHtml.match(/<link[^>]+stylesheet[^>]+>/g) || [];
  const scriptTags = indexHtml.match(/<script[^>]*src[^>]+><\/script>/g) || [];
  
  return {
    headAssets: cssLinks.join('\n'),
    bodyScripts: scriptTags.join('\n')
  };
}
```

### Step 3: Update Script Execution Order

Modify `vite.config.ts` to ensure proper build order:

1. Vite builds React app → `dist/index.html`
2. `build-static.mjs` reads the built assets and generates route-specific HTML files
3. `inject-homepage-content.mjs` updates the homepage `dist/index.html`

### Step 4: Route-Specific Content

Each page type gets appropriate SEO content:

| Page Type | SEO Content |
|-----------|-------------|
| Homepage | Hero, all categories, how it works, FAQ |
| `/templates` | All 13 categories grid |
| `/templates/:categoryId` | Category description + subcategories list |
| `/templates/:categoryId/:subcategorySlug` | Subcategory + templates list |
| `/templates/:categoryId/:subcategorySlug/:templateSlug` | Template details + breadcrumbs |

---

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/build-static.mjs` | Major rewrite - generate SPA-ready HTML with React assets |
| `scripts/inject-homepage-content.mjs` | Keep for homepage-specific injection |
| `vite.config.ts` | Adjust script execution order |

---

## Expected Results

### Before (Current)
```
view-source:https://letterofdispute.com/templates/refunds/refunds/refund-trial-conversion

<div id="root">
  <div id="seo-static-content">
    <h1>Professional Dispute Letters, Without the Guesswork</h1>  ← WRONG! This is homepage content
    ...
  </div>
</div>
```

### After (Fixed)
```
view-source:https://letterofdispute.com/templates/refunds/refunds/refund-trial-conversion

<div id="root">
  <div id="seo-static-content">
    <h1>Refund Request for Trial Conversion</h1>  ← CORRECT! Template-specific content
    <nav class="breadcrumb">Home → Templates → Refunds → Refunds → ...</nav>
    <p>Generate a professional refund request letter for trial conversion issues...</p>
  </div>
</div>
```

---

## Technical Considerations

### Why This Works

1. **Lovable hosting serves `index.html` files**: If a request comes to `/templates/refunds/refunds/refund-trial-conversion`, and there's an `index.html` at that path, it will be served
2. **Each `index.html` is a complete SPA**: React loads and takes over, providing full interactivity
3. **Bots see route-specific content**: The SEO content matches the page URL

### Performance Impact

- Build time: Slightly longer (generating more complex HTML)
- Bundle duplication: Yes, React scripts referenced in each HTML file (but they're cached)
- Runtime: No impact - same React SPA experience

---

## Summary

The key insight is that **Lovable hosting does serve static `index.html` files from nested directories** - we just need each one to be a complete React SPA entry point with route-specific SEO content, not a standalone static page.
