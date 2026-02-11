

# Fix: Article with NULL Published Date Always Appearing as Hero

## Problem
One article ("Your Entitlement When an E-commerce Order Arrives Incomplete") has a NULL `published_at` value despite having `status = 'published'`. PostgreSQL sorts NULLs first in descending order, so it always appears as the "Most Recent" hero article on the archive page.

## Fix (Two Parts)

### 1. Fix the data
Run an SQL update to set `published_at = NOW()` for any published posts that have a NULL `published_at`. This fixes the one affected row.

### 2. Prevent future occurrences
Update the database query in `src/pages/ArticlesPage.tsx` (line 118) to use `nullsFirst: false` on the sort, so any future posts with missing dates don't jump to the top:

```typescript
.order('published_at', { ascending: false, nullsFirst: false })
```

Apply the same fix in `src/pages/ArticleCategoryPage.tsx` (line 44) which has the same sorting pattern.

### Files to modify
- `src/pages/ArticlesPage.tsx` -- add `nullsFirst: false` to query sort
- `src/pages/ArticleCategoryPage.tsx` -- add `nullsFirst: false` to query sort
- Database: one-time UPDATE to fix the NULL `published_at` value

### Author avatars status
No changes needed -- the avatars are displaying correctly with the `.jpg` extension on both the archive and article pages.

