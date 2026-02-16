

# Add Missing Blog Categories and Re-Categorize Articles

## The Problem

The bulk article generation pipeline has a hardcoded `CATEGORY_MAP` that funnels all 13 template verticals into just 3 generic blog categories. This means ~4,600 articles about insurance, healthcare, housing, travel, vehicles, etc. are all mislabeled under "Consumer Rights" or "Complaint Guides."

## What Will Change

### Step 1: Create 10 new blog categories in the database

Insert rows into `blog_categories` for each missing vertical:

| Slug | Name |
|------|------|
| `insurance` | Insurance Claims |
| `healthcare` | Healthcare & Medical Billing |
| `utilities` | Utilities & Telecommunications |
| `vehicle` | Vehicle & Auto |
| `employment` | Employment & Workplace |
| `housing` | Landlord & Housing |
| `travel` | Travel & Transportation |
| `financial` | Financial Services |
| `ecommerce` | E-commerce & Online Services |
| `hoa` | Neighbor & HOA Disputes |

Names match the existing template category names from `templateCategories.ts` for consistency.

The existing categories (`consumer-rights`, `complaint-guides`, `legal-tips`, `contractors`) remain untouched for now -- `refunds` and `damaged-goods` will continue mapping to `consumer-rights`.

### Step 2: Re-categorize existing published articles

Run an UPDATE query that joins `blog_posts` to `content_queue` to `content_plans` to determine each article's true template vertical, then sets the correct `category` and `category_slug`.

Approximate redistribution (based on content_plan linkage):
- `consumer-rights` (2,752) will split into: consumer-rights (~1,000 refunds+damaged-goods), employment, healthcare, ecommerce
- `complaint-guides` (1,349) will split into: housing, hoa, travel, vehicle, utilities
- `legal-tips` (518) will split into: financial, insurance

Articles without a content_plan linkage stay in their current category.

### Step 3: Update the CATEGORY_MAP in `bulk-generate-articles`

```text
Before:
  'insurance'   -> 'legal-tips'
  'healthcare'  -> 'consumer-rights'
  'housing'     -> 'complaint-guides'
  ...

After:
  'insurance'   -> 'insurance'
  'healthcare'  -> 'healthcare'
  'housing'     -> 'housing'
  ...
```

The `refunds` and `damaged-goods` verticals remain mapped to `consumer-rights` since they don't have their own categories.

### Step 4: Update the frontend blog data

**`src/data/blogPosts.ts`**: Update the `blogCategories` array to include all new categories (this is used as a fallback/seed list alongside the database).

### Step 5: Update article display pages

**`src/pages/ArticlesPage.tsx`** and **`src/pages/ArticleCategoryPage.tsx`**: Verify these pages dynamically load categories from the database (via `blog_categories` table) rather than relying on the hardcoded list. If hardcoded, update to use database queries.

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| Database migration | SQL | Create 10 new blog_categories rows |
| Database migration | SQL | Re-categorize existing articles via UPDATE with JOIN |
| `supabase/functions/bulk-generate-articles/index.ts` | Modify | Update CATEGORY_MAP to use vertical-specific slugs |
| `src/data/blogPosts.ts` | Modify | Add new categories to the blogCategories array |
| `src/pages/ArticlesPage.tsx` | Check/Modify | Ensure categories load from database |
| `src/pages/ArticleCategoryPage.tsx` | Check/Modify | Ensure category filtering works with new slugs |

## What Stays the Same

- All existing articles remain published -- only their `category` and `category_slug` fields change
- The `contractors` category (8 articles) is untouched
- `content_plans` and `content_queue` tables are not modified
- Template pages and letter generation are completely unaffected
- SEO URLs for articles (`/articles/:slug`) don't include category, so no broken links

## Risk Mitigation

- The re-categorization UPDATE only touches articles that have a `content_plan_id` linking them to a known template vertical. Orphan articles keep their current category.
- A dry-run SELECT will be executed first to verify counts before the UPDATE.
