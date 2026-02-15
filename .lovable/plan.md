
# Fix: Smart Scan Category Filter + UI Layout

## Problem 1: Category Mismatch (Root Cause of "0 found")

The category dropdown uses **template category IDs** (`refunds`, `housing`, `insurance`, etc.) but blog posts and embeddings use **blog category slugs** (`consumer-rights`, `complaint-guides`, `legal-tips`, `contractors`). These are completely different taxonomies.

When you select "Refunds & Purchases", the scan sends `categorySlug: "refunds"` to the edge function, which filters `article_embeddings.category_id = 'refunds'` -- but no embeddings have that value. The actual values are:

| Blog Category Slug | Article Count |
|---|---|
| consumer-rights | 2,752 |
| complaint-guides | 1,349 |
| legal-tips | 518 |
| contractors | 8 |

## Problem 2: UI Layout

The category dropdown sits *below* the Semantic Scan Panel, making it unclear that you need to pick a category before scanning.

## Fix

### 1. Replace the category dropdown in `SemanticScanPanel` with blog categories

Add a dedicated category selector inside the Semantic Scan Panel itself (Step 2 area) that uses the **actual blog category slugs** from the database, not the template categories. This way the scan buttons always have access to the correct category value.

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

- Add a local category selector (dropdown) inside the Step 2 section, directly above the Smart Scan / Vector Scan buttons
- Options: "All Categories", "consumer-rights", "complaint-guides", "legal-tips", "contractors"
- Use this local value for the scan calls instead of relying on the parent's `categoryFilter` prop (which uses template IDs)
- Fetch distinct `category_id` values from `article_embeddings` to populate the dropdown dynamically

### 2. Keep the parent category filter for link suggestion filtering only

The existing category dropdown in `LinkFilters` continues to filter the *displayed suggestions* by `blog_posts.category_slug`. Since suggestions are joined with `blog_posts`, this still works for reviewing results -- but it should NOT be passed to the scan functions.

## Technical Summary

| Change | File | What |
|--------|------|------|
| Add blog-category dropdown inside scan panel | `SemanticScanPanel.tsx` | New local state + Select using real blog categories |
| Use local category for scan calls | `SemanticScanPanel.tsx` | `handleSmartScan` and `handleSemanticScan` use local value |
| Fetch blog categories dynamically | `SemanticScanPanel.tsx` | Query distinct `category_id` from `article_embeddings` |

No edge function changes needed -- the functions already handle `categorySlug` correctly; they were just receiving the wrong values.
