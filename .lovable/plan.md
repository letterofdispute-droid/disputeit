
# Plan: Enhanced Pages Dashboard with Pagination and SEO Fields

## Overview
Transform the existing `AdminPages` dashboard to match the `AdminBlog` pattern, adding:
- Backend pagination (100 pages per page)
- SEO meta title and description display in the table
- Debounced search with backend filtering
- Total count and draft count display in header

---

## Changes Required

### 1. Update AdminPages.tsx

**Add new state variables:**
- `debouncedSearch` for debounced search input
- `currentPage` for pagination
- `totalCount` for total pages count
- `draftCount` for draft pages count

**Update the Page interface** to include `meta_title` and `meta_description` fields.

**Implement backend pagination:**
- Use `.range()` for paginated queries (100 items per page)
- Add `count: 'exact'` to get total count
- Move filtering to backend with `.eq()` and `.ilike()`

**Update table display:**
- Add SEO meta title and description below each page title (same pattern as AdminBlog)
- Truncate long descriptions with `truncate max-w-md`

**Add pagination component:**
- Import and use `QueuePagination` component
- Display "Showing X-Y of Z items" info

**Update header:**
- Show total count and draft count like AdminBlog

---

## Technical Details

```text
+------------------------------------------+
|  Pages Dashboard                         |
|  X total pages • Y drafts                |
+------------------------------------------+
| [Search...] [All] [Published] [Draft]    |
+------------------------------------------+
| Title          | Slug | Status | Updated |
|----------------|------|--------|---------|
| Page Title     | /url | pub    | Jan 1   |
|   Meta: SEO... |      |        |         |
|   Desc: ...    |      |        |         |
+------------------------------------------+
| Showing 1-100 of 500  [< 1 2 3 ... >]   |
+------------------------------------------+
```

### Key Code Changes:

1. **Constants:**
   - `const PAGES_PER_PAGE = 100;`

2. **State additions:**
   ```tsx
   const [debouncedSearch, setDebouncedSearch] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [totalCount, setTotalCount] = useState(0);
   const [draftCount, setDraftCount] = useState(0);
   ```

3. **Query modification:**
   ```tsx
   const { data, error, count } = await supabase
     .from('pages')
     .select('id, title, slug, status, parent_id, sort_order, author, created_at, updated_at, meta_title, meta_description', { count: 'exact' })
     .order('sort_order', { ascending: true })
     .range((currentPage - 1) * PAGES_PER_PAGE, currentPage * PAGES_PER_PAGE - 1);
   ```

4. **Table cell for SEO display:**
   ```tsx
   <TableCell>
     <div className="space-y-1">
       <p className="font-medium">{page.title}</p>
       {page.meta_title && (
         <p className="text-xs text-muted-foreground/70 truncate max-w-md">
           <span className="font-medium">Meta:</span> {page.meta_title}
         </p>
       )}
       {page.meta_description && (
         <p className="text-xs text-muted-foreground/60 truncate max-w-md">
           {page.meta_description}
         </p>
       )}
     </div>
   </TableCell>
   ```

---

## Implementation Sequence

1. Add imports for `QueuePagination`, `Card`, `CardContent`, `Loader2`
2. Add new state variables and constants
3. Add debounce effect for search
4. Add reset-to-page-1 effect when filters change
5. Update `fetchPages` to use backend pagination and filtering
6. Add `fetchDraftCount` function
7. Update Page interface with SEO fields
8. Update header to show counts
9. Update table columns and cells to display SEO info
10. Add `QueuePagination` component below table
11. Remove client-side filtering logic (move to backend)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminPages.tsx` | Complete refactor with pagination and SEO fields |

No database changes required - the `pages` table already has `meta_title` and `meta_description` columns.
