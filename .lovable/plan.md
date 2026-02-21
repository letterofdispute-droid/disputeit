

# Add Trailing-Slash Canonical Normalization

## Problem
Google may index both `/templates` and `/templates/` as separate URLs, splitting link equity and causing duplicate content signals. The canonical URLs emitted by `SEOHead` don't enforce a consistent trailing-slash policy.

## Solution
Standardize on **no trailing slash** (e.g., `/templates` not `/templates/`) across three layers:

### 1. SEOHead canonical normalization (code change)
**File: `src/components/SEOHead.tsx`**

Add a normalization step that strips trailing slashes from `canonicalPath` before building the canonical URL (preserving `/` for the homepage):

```tsx
// Normalize: strip trailing slash (except bare "/")
const normalizedPath = canonicalPath === '/' 
  ? '/' 
  : canonicalPath.replace(/\/+$/, '');
const canonicalUrl = `${siteUrl}${normalizedPath}`;
```

This ensures every `<link rel="canonical">` and `og:url` across all 34+ pages using SEOHead consistently points to the non-trailing-slash variant.

### 2. Client-side trailing-slash redirect (new component)
**File: `src/components/TrailingSlashRedirect.tsx`**

A small component placed inside `BrowserRouter` that detects if the current URL has a trailing slash and performs a `navigate(pathWithoutSlash, { replace: true })` redirect. This handles users or bots arriving at `/templates/` via internal links.

### 3. Edge-level redirect via `_redirects` file
**File: `public/_redirects`**

Add a hosting-level redirect rule to catch trailing-slash requests before they even hit the SPA:

```text
# Strip trailing slashes (301 permanent redirect)
/*/  /:splat  301
```

This ensures that any external link or crawler hitting `/pricing/` gets a 301 to `/pricing`.

### 4. Update `_headers` for the redirects file
**File: `public/_headers`** -- no changes needed, the `_redirects` file is automatically processed by the hosting layer.

## Files Changed

| File | Change |
|---|---|
| `src/components/SEOHead.tsx` | Normalize canonicalPath to strip trailing slashes |
| `src/components/TrailingSlashRedirect.tsx` | New component: client-side redirect for trailing-slash URLs |
| `src/App.tsx` | Import and add `TrailingSlashRedirect` inside `BrowserRouter` |
| `public/_redirects` | New file: edge-level 301 redirect to strip trailing slashes |

## Impact
- All 75+ indexed pages will emit consistent canonical URLs
- Google will consolidate `/path/` and `/path` into a single index entry
- No user-visible change -- redirects are silent 301s

