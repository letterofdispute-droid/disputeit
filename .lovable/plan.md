

# Implement Server-Side Pagination for Blog Posts

## Problem

The `/articles` page fetches **all ~2,800 published blog posts** in a single query using `select('*')`. This means:
- Full HTML `content` for every post is transferred (huge payload)
- PostgREST silently caps results at 1,000 rows, so posts beyond that are invisible
- The heavy query strains the database and contributes to 503/500 errors
- Only 12 posts are displayed per page, making 99%+ of fetched data wasted

## Fix

### 1. Server-side pagination with lean column selection (`ArticlesPage.tsx`)

Replace the "fetch everything" query with a paginated query that only selects the columns needed for the card UI:

```typescript
const { data, error, count } = await supabase
  .from('blog_posts')
  .select('slug, title, excerpt, category, category_slug, author, published_at, read_time, featured_image_url, featured, views', { count: 'exact' })
  .eq('status', 'published')
  .order('published_at', { ascending: false, nullsFirst: false })
  .range(offset, offset + POSTS_PER_PAGE - 1);
```

Key changes:
- **Drop `content` from select** -- saves massive payload (content is only needed on the individual article page)
- **Use `.range()`** for true server-side pagination instead of fetching all and slicing client-side
- **Use `{ count: 'exact' }`** to get the total post count for pagination controls without fetching all rows
- **Query key includes page number** so React Query caches each page separately

### 2. Separate featured/hero post query (page 1 only)

Fetch the latest post separately for the hero section on page 1, then fetch the grid posts with an offset:

- Page 1: hero post (1 query, limit 1) + grid posts (1 query, limit 12, offset 1)
- Page 2+: grid posts only (1 query, limit 12, offset based on page)

### 3. Update `ArticleCategoryPage.tsx` with same pattern

Apply the same lean select + server-side pagination to the category page.

### 4. Update the `BlogPost` interface

Remove the requirement for `content` in the listing interface since it won't be fetched for card views. The `getReadTime` helper already has a fallback for when `read_time` is set, so dropping `content` won't break it.

## Technical Details

- **Current payload**: ~2,800 posts x full HTML content = potentially 50-100MB+ of data per page load
- **After fix**: 12-13 posts x card fields only = ~10-20KB per page load
- **Pagination math**: total pages calculated from `count` returned by Supabase, not from array length
- **Static fallback**: preserved for error states -- if paginated query fails, fall back to static posts
- **React Query cache**: each page cached independently with key `['blog-posts', page]`

