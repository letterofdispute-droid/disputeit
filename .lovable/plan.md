

# Fix: Show All Categories in Scan Dropdown

## Problem

The "Scan Category" dropdown only shows "Complaint Rights" because the query fetches individual rows from `article_embeddings` (4,627 rows) but hits the default 1,000-row limit. Since rows are ordered alphabetically, only "complaint-guides" appears in the first 1,000 results.

## Solution

Replace the client-side dedup approach with a direct query to the `blog_categories` table, which has exactly 4 clean rows with proper display names.

## Technical Change

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

Replace lines 68-81 (the `fetchCategories` effect):

**Before:**
```typescript
// Fetch distinct blog categories from article_embeddings
useEffect(() => {
  const fetchCategories = async () => {
    const { data } = await supabase
      .from('article_embeddings')
      .select('category_id')
      .order('category_id');
    if (data) {
      const unique = [...new Set(data.map(d => d.category_id))];
      setBlogCategories(unique.map(id => ({ id, label: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })));
    }
  };
  fetchCategories();
}, []);
```

**After:**
```typescript
// Fetch blog categories from dedicated table
useEffect(() => {
  const fetchCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('slug, name')
      .order('name');
    if (data) {
      setBlogCategories(data.map(c => ({ id: c.slug, label: c.name })));
    }
  };
  fetchCategories();
}, []);
```

This will show all 4 categories (Complaint Guides, Consumer Rights, Contractors, Legal Tips) with their proper display names from the database.
