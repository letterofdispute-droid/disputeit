

# Fix: Replace Hardcoded SEO Patterns with AI-Generated Metadata from Database

## Problem
Category pages (`/templates/travel`, `/templates/healthcare`, etc.) and subcategory pages use hardcoded template-pattern SEO strings like:
- Title: `"{Category} Letter Templates - Free Professional Complaint Letters | Dispute Letters"`  
- Description: `"Browse {N} professional {category} letter templates..."`

These produce **identical or near-identical** meta descriptions across pages. The `pages` table already has entries for all these routes, but `meta_title` and `meta_description` are NULL, and the page components don't read from the database at all.

## Solution

### 1. Create a `usePageSeo` hook
A reusable hook that fetches `meta_title` and `meta_description` from the `pages` table by slug, returning them with fallback to the hardcoded values.

**New file: `src/hooks/usePageSeo.ts`**
- Takes a `slug` (e.g. `templates/travel`) and fallback title/description
- Queries `pages` table for matching slug
- Returns `{ title, description, isLoaded }` — uses DB values when available, falls back to hardcoded

### 2. Update CategoryPage.tsx
- Import and use `usePageSeo` with slug `templates/${categoryId}`
- Pass DB-sourced title/description to `SEOHead` instead of hardcoded pattern

### 3. Update SubcategoryPage.tsx
- Same pattern with slug `templates/${categoryId}/${subcategorySlug}`

### 4. Update AllTemplatesPage.tsx
- Same pattern with slug `templates`

### 5. Run the backfill to populate the NULL metadata
Once the pages read from the database, running "Generate SEO" on the `template` group will populate all 14 category pages with unique, AI-generated metadata via the existing `backfill-page-seo` edge function.

## Files changed
- **New:** `src/hooks/usePageSeo.ts`
- **Edit:** `src/pages/CategoryPage.tsx` — use DB metadata with fallback
- **Edit:** `src/pages/SubcategoryPage.tsx` — use DB metadata with fallback
- **Edit:** `src/pages/AllTemplatesPage.tsx` — use DB metadata with fallback

