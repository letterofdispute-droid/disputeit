
# Server-Side Pagination for Link Suggestions

## Problem

Currently, link suggestions are fetched with a `.limit(200)` cap and rendered all at once in a scrollable div. At 20,000+ suggestions, this will freeze the browser and miss most results.

## Solution

Add server-side pagination using Supabase `.range()` and the existing `QueuePagination` component.

## Changes

### 1. Hook: `src/hooks/useLinkSuggestions.ts`

- Add `page` and `pageSize` (default 50) parameters to the hook
- Replace `.limit(200)` with `.range(offset, offset + pageSize - 1)`
- Add a separate count query using `{ count: 'exact', head: true }` with the same status filter to get `totalCount`
- Remove client-side category/targetType filtering (move to server-side `.eq()` filters)
- Remove the outbound count join from the main query (fetch it only for the current page's source IDs to keep it fast)
- Return `totalCount` and `totalPages` from the hook

New hook signature:
```typescript
useLinkSuggestions(status?, categorySlug?, targetType?, page, pageSize, isScanRunning?)
```

Query changes:
```typescript
const offset = (page - 1) * pageSize;
let query = supabase
  .from('link_suggestions')
  .select('*, blog_posts(title, slug, category_slug)', { count: 'exact' })
  .order('relevance_score', { ascending: false })
  .range(offset, offset + pageSize - 1);

if (status) query = query.eq('status', status);
if (categorySlug) query = query.eq('blog_posts.category_slug', categorySlug);
// targetType filter also server-side
if (targetType) query = query.eq('target_type', targetType);
```

### 2. Component: `src/components/admin/seo/LinkSuggestions.tsx`

- Add `currentPage` state (default 1)
- Pass `categoryFilter` and `targetTypeFilter` directly to the hook instead of filtering client-side
- Reset `currentPage` to 1 when any filter changes
- Remove the `filteredSuggestions` useMemo (no longer needed -- server does filtering)
- Remove `max-h-[600px] overflow-y-auto` from the list container (pagination handles the volume)
- Import and render `QueuePagination` below the suggestions list
- Clear selected IDs on page change

### 3. No database changes needed

The existing `link_suggestions` table already has indexes on `status` and `relevance_score`.

## Result

- Page loads 50 items at a time instead of 200+ in a scrollable div
- Server-side filtering means accurate counts and no missing items
- Scales to 20,000+ suggestions without browser lag
- Reuses the existing `QueuePagination` component for consistent UI
