
# Fix Sitemaps: Use Edge Function (The ONLY Reliable Solution)

## Why Static Files Don't Work on Lovable

Lovable hosting uses SPA routing where:
1. ALL requests go through `index.html` first
2. React Router's `path="*"` catches everything not defined
3. Static XML files get intercepted and routed to `<NotFound />`

This is why the main `sitemap.xml` might work (if there's special handling) but sub-sitemaps fail.

## The Solution: Dynamic Edge Function Sitemaps

You already have a `generate-sitemap` edge function! It just needs to be properly configured and the URLs fixed.

### Current Edge Function Issues

1. References wrong paths: `/sitemaps/static.xml` (subdirectory that doesn't exist)
2. Missing template sitemap generation
3. Not connected via URL rewriting

## Implementation Plan

### Step 1: Update Edge Function to Include ALL Content

Modify `supabase/functions/generate-sitemap/index.ts`:

| Section | Change |
|---------|--------|
| Sitemap Index | Point to `?type=static`, `?type=categories`, `?type=templates`, `?type=blog` |
| Static Sitemap | Already complete |
| Categories Sitemap | Add subcategory URLs (missing!) |
| Templates Sitemap | NEW - Generate 400+ template URLs |
| Blog Sitemap | Already fetches from database |

### Step 2: Configure URL Routing

Add Netlify-style redirects or use the edge function as API endpoint:

**Option A: Direct API calls**
Update the sitemap index to reference:
```xml
<loc>https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap?type=static</loc>
```

**Option B (Better): Serve via `/api/sitemap` route**
The edge function responds at `/functions/v1/generate-sitemap` which can be accessed as:
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap?type=index`
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap?type=static`
- etc.

### Step 3: Update robots.txt

Point to the edge function URL for the sitemap:
```text
Sitemap: https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap
```

## Technical Changes

### Edge Function Updates

```typescript
// In generateSitemapIndex - fix the URLs to use the edge function:
function generateSitemapIndex(today: string): string {
  const baseUrl = 'https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap';
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}?type=static</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=categories</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=templates</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=blog</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}
```

### Add Templates Sitemap (NEW)

```typescript
case 'templates':
  xml = generateTemplatesSitemap(today);
  break;

function generateTemplatesSitemap(today: string): string {
  // Include all 400+ templates with hierarchical URLs
  // /templates/:categoryId/:subcategorySlug/:templateSlug
}
```

### Add Subcategories to Categories Sitemap

```typescript
// Add all subcategory URLs like:
// /templates/contractors/plumbing
// /templates/housing/repairs
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-sitemap/index.ts` | Major update - fix URLs, add templates, add subcategories |
| `public/robots.txt` | Point sitemap to edge function URL |
| `scripts/build-static.mjs` | Remove (no longer needed for sitemaps) |

## Result

- `/functions/v1/generate-sitemap` → Main sitemap index (works)
- `/functions/v1/generate-sitemap?type=static` → Static pages (works)
- `/functions/v1/generate-sitemap?type=categories` → All categories + subcategories (works)
- `/functions/v1/generate-sitemap?type=templates` → All 400+ templates (works)
- `/functions/v1/generate-sitemap?type=blog` → All blog posts from database (works)

Google Search Console can access all sitemaps via the edge function URL.

## Why This Is The Only Solution

Static files on Lovable hosting get intercepted by React Router. Edge functions bypass this entirely because they're served from the backend function endpoint, not the static hosting.
