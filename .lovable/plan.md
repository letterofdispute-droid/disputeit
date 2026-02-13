

# Fix Blog Posts Not Loading

## Problem
The `blog_posts` query on `/articles` is returning HTTP 500 errors. The page gets stuck showing skeleton loaders with no content because:
1. The query errors but React Query retries keep it in "loading" state
2. When it finally gives up, there's no error-state UI — the fallback to static data only checks if `dbPosts` is empty, not if the query errored

## Fix

### 1. Reload schema cache (immediate)
Run `NOTIFY pgrst, 'reload schema'` again to clear the stale cache that's causing the 500s.

### 2. Make ArticlesPage resilient (`src/pages/ArticlesPage.tsx`)
- Add `retry: 2` and `retryDelay: 1000` to both React Query calls (blog_posts and blog_categories)
- Handle the **error state**: when the query fails after retries, fall back to static blog posts from `src/data/blogPosts.ts` instead of showing empty skeletons forever
- Change the loading check: only show skeletons when `isLoading && !error` — if there's an error, skip straight to the static fallback

### 3. Make ArticleCategoryPage resilient (`src/pages/ArticleCategoryPage.tsx`)
- Same pattern: add retry + error fallback to static data

### Technical Detail

Current code (line ~136):
```typescript
const posts = dbPosts && dbPosts.length > 0 ? dbPosts : staticBlogPosts.map(...)
```

This only works when `dbPosts` is `undefined` (no error). But during an error, React Query may set data to `undefined` **and** `isLoading` to `false` only after all retries — during retries it shows loading forever. The fix adds:

```typescript
const { data: dbPosts, isLoading, isError } = useQuery({
  queryKey: ['blog-posts'],
  queryFn: async () => { ... },
  retry: 2,
  retryDelay: 1000,
});

// Show skeletons only while genuinely loading (not errored)
// When errored, fall through to static fallback immediately
```

This ensures blog content is always visible even when the database API is temporarily down.
