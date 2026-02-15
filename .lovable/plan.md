

# Global Search: Unified Content Discovery

## What This Solves

Right now, visitors who want to quickly find a specific template or article have two options: browse through categories manually, or use the AI assistant (which feels heavyweight for a simple lookup). A search bar gives users instant access to all content -- templates, articles, and guides -- with just a few keystrokes.

## The Approach: Command Palette (Cmd+K) Style Search

Rather than cluttering the header with a full search bar, we'll add a compact search icon/trigger in the header that opens a full-screen command palette overlay. This is the pattern used by Stripe, Vercel, and most modern SaaS sites. It works beautifully on both desktop and mobile.

## How It Works

1. **Search trigger in the header** -- A small search icon (magnifying glass) next to the nav items on desktop, and in the mobile menu. Clicking it opens the search overlay.

2. **Keyboard shortcut** -- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere on the site to open search instantly.

3. **Unified search overlay** -- Uses the existing `cmdk` library (already installed) to create a fast, filterable command palette that searches across:
   - **Templates** (500+ static, instant client-side filtering by title, description, category)
   - **Blog Articles** (database query with debounced server-side search on title/excerpt)
   - **Category pages** (13 categories, instant match)

4. **Grouped results** -- Results are grouped by type (Templates, Articles, Categories) with icons and category badges so users can scan quickly.

5. **Direct navigation** -- Clicking a result navigates directly to the full hierarchical URL (e.g., `/templates/housing/repair-maintenance/damp-mould-complaint`).

## What Gets Built

### 1. New Component: `GlobalSearch.tsx`
A command palette component using `cmdk` (already installed) that:
- Opens via search icon click or Cmd+K
- Searches templates client-side (instant, no API calls)
- Searches articles server-side with debounce (hits the `blog_posts` table)
- Shows category quick-links as a default view when no query is typed
- Tracks searches via existing `trackSiteSearch` analytics

### 2. Header Updates
- **Desktop**: Add a search icon button between the nav and CTA buttons
- **Mobile**: Add a search icon in the mobile header bar (next to the hamburger menu)
- Both trigger the same `GlobalSearch` overlay

### 3. Hero Update (Optional Enhancement)
Keep the existing AI assistant prompt as-is, but add a small "or search manually" text link below it that opens the same global search. This gives users who prefer a simple search an obvious path.

## Technical Details

### Template Search (Client-Side)
Templates are already loaded as static data (`allTemplates` array, ~500 items). We filter in-memory using a simple lowercase includes match on `title` and `shortDescription`. Results are instant with zero latency.

### Article Search (Server-Side, Debounced)
Articles live in the database. We query with:
```sql
SELECT slug, title, excerpt, category_slug, featured_image_url
FROM blog_posts
WHERE status = 'published'
AND (title ILIKE '%query%' OR excerpt ILIKE '%query%')
ORDER BY views DESC
LIMIT 5
```
This runs after a 300ms debounce to avoid hammering the database on every keystroke.

### Result Limits
- Templates: Show top 5 matches (sorted by relevance -- exact title match first, then partial)
- Articles: Show top 5 matches (sorted by views)
- Categories: Show top 3 matching categories
- Total max visible: ~13 results, keeping the overlay clean

### Component Structure
```
src/components/search/
  GlobalSearch.tsx       -- Main command palette with Dialog + Command
```

### Files to Edit
1. **Create** `src/components/search/GlobalSearch.tsx` -- The command palette component
2. **Edit** `src/components/layout/Header.tsx` -- Add search trigger (desktop + mobile)
3. **Edit** `src/components/home/Hero.tsx` -- Add "or search manually" link below AI prompt

### Analytics Integration
Uses the existing `trackSiteSearch()` function from `useGTM.ts` and the Supabase `trackEvent` from `useAnalytics` -- same pattern as `CategorySearch` already does.

