
# Show Article Counts in Category Dropdown

## What changes

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

### 1. Fetch counts per category in a single query

Replace the current category fetch (lines 102-113) with a query that fetches categories AND their published article counts together. Use a single aggregation query:

```sql
SELECT category_slug, COUNT(*) as count 
FROM blog_posts 
WHERE status = 'published' 
GROUP BY category_slug
```

Then merge these counts into the `blogCategories` state so each entry has `{ id, label, count }`.

### 2. Show counts in the dropdown

Update the `SelectItem` rendering (line 418) to display:
- "Contractors (8)" instead of just "Contractors"
- "All Categories (4,789)" with the total sum

### 3. Auto-set maxArticles on category change

Keep the existing `useEffect` that sets `maxArticles` when category changes, but source the count from the category list data instead of a separate query. Remove the now-redundant `categoryArticleCount` query.

### Technical detail

- The category list state type changes from `{ id: string; label: string }[]` to `{ id: string; label: string; count: number }[]`
- A single `useQuery` replaces both the manual `useEffect` fetch and the `categoryArticleCount` query
- The "available" label next to "Max articles" still shows the count from the selected category
- Cost estimate continues to use `maxArticles * 0.002`
