

# Fix: Serve Complete Paginated Blog Sitemap on Your Domain

## Problem

The build script (`scripts/build-static.mjs`) fetches blog posts with a single REST API call, which hits the 1,000-row PostgREST limit. Result: `letterofdispute.com/sitemap-blog.xml` only contains ~1,000 posts instead of all ~5,000+.

The edge function (`generate-sitemap`) correctly paginates into 5 pages of 1,000, but its sitemap index points to the Supabase function URL -- not your domain.

## Solution

Update the build script to:

1. **Fetch ALL blog posts using pagination** -- loop in batches of 1,000 until no more results
2. **Generate multiple blog sitemap files** -- `sitemap-blog-1.xml`, `sitemap-blog-2.xml`, etc. (1,000 URLs each)
3. **Update the sitemap index** to reference all paginated blog sitemaps on `letterofdispute.com`

## Changes

### File: `scripts/build-static.mjs`

**1. Replace `loadBlogPosts()` with paginated fetching:**

```javascript
async function loadBlogPosts() {
  console.log('   Fetching blog posts from database (paginated)...');
  const allPosts = [];
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,category_slug,updated_at&order=published_at.desc&offset=${offset}&limit=${BATCH_SIZE}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) break;
    const data = await response.json();
    allPosts.push(...data.map(post => ({
      slug: post.slug,
      categorySlug: post.category_slug,
      lastmod: post.updated_at?.split('T')[0] || BUILD_DATE
    })));
    hasMore = data.length === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  return allPosts;
}
```

**2. Generate paginated blog sitemaps (1,000 URLs per file):**

Instead of one `sitemap-blog.xml`, generate `sitemap-blog-1.xml`, `sitemap-blog-2.xml`, etc.

**3. Update `generateSitemapIndex()` to list all blog pages:**

```xml
<sitemap>
  <loc>https://letterofdispute.com/sitemap-blog-1.xml</loc>
</sitemap>
<sitemap>
  <loc>https://letterofdispute.com/sitemap-blog-2.xml</loc>
</sitemap>
<!-- ...up to page 5+ -->
```

**4. Write all files to both `dist/` and `public/`**

## Result

- `letterofdispute.com/sitemap.xml` will reference all paginated blog sitemaps
- Each `sitemap-blog-N.xml` will contain up to 1,000 article URLs
- All 5,000+ blog posts will be included
- Everything served from your own domain -- no Supabase function URLs
- `robots.txt` already points to `letterofdispute.com/sitemap.xml` so no change needed there

## What Stays the Same

- The edge function (`generate-sitemap`) remains as a backup but is no longer the primary sitemap
- `sitemap-static.xml`, `sitemap-categories.xml`, `sitemap-templates.xml` are unchanged
- `robots.txt` unchanged
