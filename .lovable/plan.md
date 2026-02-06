
# Serve Sitemaps from Your Domain

## Goal
Make sitemaps accessible at `disputeletters.com/sitemap.xml` like every other website, instead of the ugly Supabase function URL.

## Strategy: Hybrid Static + Dynamic

Since templates and categories rarely change but blog posts are added frequently, we'll use a hybrid approach:
- Static pages, categories, templates → generated at build time, served from domain
- Blog posts → fetched from database at build time (updated on each deploy)

---

## Changes Required

### 1. Update Build Script Output Location

**File:** `scripts/build-static.mjs`

Change output from `dist/` to `public/` so sitemaps are included in the deployed static files and accessible at root URLs.

```text
Before: const distDir = path.join(__dirname, '..', 'dist');
After:  const publicDir = path.join(__dirname, '..', 'public');
```

### 2. Update robots.txt

**File:** `public/robots.txt`

Point to the clean domain URL instead of the Supabase function.

```text
Before: Sitemap: https://koulmtfnkuapzigcplov.supabase.co/functions/v1/generate-sitemap
After:  Sitemap: https://disputeletters.com/sitemap.xml
```

### 3. Fetch Blog Posts from Database at Build Time

**File:** `scripts/build-static.mjs`

Replace the static file read with a Supabase query to get all published blog posts. This ensures the blog sitemap includes all database content.

Add Supabase client initialization and query:

```text
// At top of file
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Replace loadBlogPosts function
async function loadBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, category_slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  
  if (error) {
    console.log('   ⚠️ Could not fetch blog posts from database');
    return [];
  }
  
  return data.map(post => ({
    slug: post.slug,
    categorySlug: post.category_slug,
    lastmod: post.updated_at?.split('T')[0] || BUILD_DATE
  }));
}
```

### 4. Update Sitemap Index URLs

**File:** `scripts/build-static.mjs`

Change the sitemap index to use the actual domain:

```text
Before: <loc>${SITE_URL}/sitemap-static.xml</loc>
After:  <loc>https://disputeletters.com/sitemap-static.xml</loc>
```

(Note: SITE_URL is already set to https://disputeletters.com so this may be fine)

---

## Result After Deploy

| URL | Content |
|-----|---------|
| `disputeletters.com/sitemap.xml` | Sitemap index pointing to sub-sitemaps |
| `disputeletters.com/sitemap-static.xml` | Static pages (home, about, pricing, etc.) |
| `disputeletters.com/sitemap-categories.xml` | All categories + subcategories + guides |
| `disputeletters.com/sitemap-templates.xml` | All 400+ letter templates |
| `disputeletters.com/sitemap-blog.xml` | All published blog articles |

---

## Trade-off Consideration

With this approach, new blog posts require a **publish/deploy** to appear in the sitemap. This is standard for most static sites and is fine for SEO because:

1. Search engines don't crawl sitemaps constantly - typically every few days
2. You can trigger a deploy after adding new content
3. New posts are still discoverable through internal links immediately

If you need real-time sitemap updates without deploying, we can keep the edge function as a fallback and have the sitemap index reference it for just the blog portion.

---

## Technical Notes

- The build script runs automatically on every deploy via the Vite plugin
- Environment variables (`VITE_SUPABASE_URL`) are available during build
- Files in `public/` are served at root URLs after deploy
- No changes needed to the edge function - it can remain as a backup or be removed later
