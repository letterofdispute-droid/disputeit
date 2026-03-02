

# Why Your Live Site Shows Generic Meta Tags (and How to Fix It)

## The Problem

Your site is a **Single Page Application (SPA)**. Every route (`/state-rights/california`, `/templates/refunds`, etc.) serves the exact same `index.html` file from the server. That file has these hardcoded homepage meta tags:

```text
<title>Dispute Letter Templates - Professional Complaint Letters That Get Results | Letter of Dispute</title>
<meta name="description" content="Stop guessing what to write. 500+ professionally written..." />
```

The `SEOHead` component (via `react-helmet-async`) only updates these tags **after JavaScript loads and executes** in the browser. When you "View Source" or when Google crawls the page, they see the raw HTML before JavaScript runs - which is always the homepage defaults.

**Your database SEO data is correct. The `usePageSeo` hook works. But it only affects the client-side DOM, not the server-rendered HTML.**

## The Fix: Build-Time Meta Tag Injection

Since you already have a `build-static.mjs` script that runs at build time (and fetches from the database), extend it to **generate per-route HTML files** with the correct meta tags baked in. This is the only approach that works on Lovable's hosting (no SSR available).

### Implementation

**1. New build script: `scripts/inject-page-meta.mjs`**
- After the Vite build, read `dist/index.html` as a template
- Fetch all rows from the `pages` table (slug, meta_title, meta_description, featured_image_url) via REST API
- For each page with meta data: create `dist/{slug}/index.html` with the correct `<title>`, `<meta name="description">`, `<link rel="canonical">`, OG tags, and Twitter tags replaced
- Pages without custom meta keep the SPA fallback behavior (homepage defaults until JS loads)

**2. Update `vite.config.ts`**
- Add the new script call inside `staticFileGenerator`'s `closeBundle` hook, after existing steps

**3. Key details**
- Fetch pages in batches of 500 to handle 1,200+ rows
- Only generate files for pages that have a non-null `meta_title`
- Replace the 6 hardcoded meta values in `index.html` (title, description, canonical, og:title, og:description, og:image) using string replacement
- Preserve all other HTML (scripts, styles, overlay, etc.)
- Handle nested slugs like `state-rights/california/vehicle` by creating the correct directory structure

### Expected result
- `dist/state-rights/california/index.html` will contain:
  ```html
  <title>California Consumer Rights Explained | Letter of Dispute</title>
  <meta name="description" content="Know your California consumer rights..." />
  ```
- Google and "View Source" will see the correct, unique meta tags
- React still hydrates and takes over normally

### Scope
- ~1,200 HTML files generated at build time (only those with meta data)
- Build time increase: ~10-15 seconds (one DB fetch + file writes)
- No runtime/frontend changes needed

