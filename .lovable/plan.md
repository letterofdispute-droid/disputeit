

# Fix Plan: Articles Page Bugs

## Summary

Two issues need to be fixed on the public-facing articles system:

1. **Missing Pagination**: The `/articles/{category}` page (ArticleCategoryPage) has no pagination
2. **Category Filters Not Working**: The ArticleCategoryPage uses static data instead of database, so it doesn't show dynamically generated blog posts

---

## Root Cause Analysis

### Bug 1: No Pagination on Category Pages

| Page | Has Pagination | Data Source |
|------|----------------|-------------|
| `/articles` (ArticlesPage.tsx) | Yes (lines 316-368) | Database via Supabase |
| `/articles/{category}` (ArticleCategoryPage.tsx) | No | Static file only |

The `ArticleCategoryPage` currently:
- Uses `getBlogPostsByCategory()` from static `blogPosts.ts` data file (line 14)
- Does NOT query the Supabase database
- Has no pagination logic at all

### Bug 2: Category Shows Empty When Posts Exist

The problem is that `ArticleCategoryPage` only reads from static data:
```typescript
const posts = category ? getBlogPostsByCategory(category) : [];  // Static only!
```

Meanwhile, all the AI-generated blog posts are stored in the Supabase `blog_posts` table and never fetched on this page.

---

## Solution

Update `ArticleCategoryPage.tsx` to:
1. Fetch posts from the database (like ArticlesPage does)
2. Filter by the current category
3. Add pagination using the same pattern as ArticlesPage
4. Show proper empty state when no posts in category

---

## Implementation Details

### Changes to ArticleCategoryPage.tsx

```typescript
import { useState } from 'react';
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

const POSTS_PER_PAGE = 12;

const ArticleCategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Fetch from database filtered by category
  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ['blog-posts-category', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('category_slug', category)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category,
  });

  // Pagination
  const posts = dbPosts || [];
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ... rest of component with loading state and pagination UI
};
```

### Key Changes Summary

1. **Add database query**: Use `useQuery` to fetch posts from `blog_posts` table
2. **Filter by category**: Add `.eq('category_slug', category)` to query
3. **Add pagination state**: Use `useSearchParams` for URL-based pagination
4. **Add pagination UI**: Copy pattern from ArticlesPage
5. **Add loading skeleton**: Show loading state while fetching
6. **Improve empty state**: Better message when category has no posts

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ArticleCategoryPage.tsx` | Add database query, pagination, loading state |

---

## Expected Behavior After Fix

1. **Database Integration**: Category pages show posts from the database, including AI-generated articles
2. **Pagination**: When more than 12 posts exist in a category, pagination controls appear
3. **Empty State**: Clear message when a category has no published posts with a link to view all articles
4. **Loading State**: Skeleton UI while posts are loading

---

## Technical Details

### Pagination Component Usage

Reuse the existing pagination pattern from ArticlesPage:
- Show first, last, current, and adjacent pages
- Show ellipsis for gaps
- Previous/Next buttons conditional on current position
- URL-based state for shareable links

### Query Caching

The `queryKey: ['blog-posts-category', category]` ensures:
- Each category has its own cache
- Navigation between categories triggers fresh data
- Re-navigation to same category uses cached data

