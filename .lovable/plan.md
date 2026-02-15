

# Enhanced Global Search Analytics

## The Gap

The new Global Search (Cmd+K) only pushes events to GTM via `trackSiteSearch`. It does **not** write to the `analytics_events` database table. The existing `SiteSearchReport` in the admin dashboard reads exclusively from `analytics_events` where `event_type = 'site_search'` -- so global search activity is invisible in your dashboard.

Meanwhile, `CategorySearch` correctly tracks to **both** GTM and the database. We need to bring GlobalSearch up to the same standard and then add richer tracking.

## What Gets Tracked

Standard site search analytics track these key metrics:

1. **Search queries** -- what users type (already tracked to GTM, missing from DB)
2. **Results count** -- how many results were shown (already tracked to GTM)
3. **Zero-result searches** -- queries that returned nothing (derivable from results count)
4. **Search location** -- where the search was triggered from (hero link, header icon, Cmd+K)
5. **Result clicks (click-through)** -- which result the user selected and its type (template/article/category)
6. **Click position** -- rank of the clicked result (1st, 2nd, 3rd...)
7. **Search refinements** -- when a user modifies their query within the same session
8. **Search exits** -- when a user closes search without clicking any result (abandonment)
9. **Time to click** -- how long between search and result selection
10. **Result type distribution** -- breakdown of templates vs articles vs categories in results

## Implementation

### 1. Add Database Tracking to GlobalSearch (`src/components/search/GlobalSearch.tsx`)

Import `useAnalytics` and fire `site_search` events to the database (matching the pattern in `CategorySearch`):

- **On search** (debounced): Track `site_search` with `search_term`, `results_count`, `search_location`, `result_breakdown` (templates/articles/categories counts), and `trigger_method` (keyboard shortcut, header icon, or hero link)
- **On result click**: Track a new `search_click` event with the selected item's type, slug, position in the list, and time elapsed since search
- **On close without click**: Track `search_exit` event with the last query and whether results were shown

### 2. New Event Types in `useAnalytics` (`src/hooks/useAnalytics.ts`)

Add two new event types to the `EventType` union:
- `search_click` -- fired when a user selects a search result
- `search_exit` -- fired when search closes without a selection

### 3. Enhanced SiteSearchReport (`src/components/admin/analytics/SiteSearchReport.tsx`)

Extend the existing report to display the new data:

- **Click-through rate (CTR)**: Percentage of searches that led to a result click
- **Popular clicked results**: Table showing which specific templates/articles get clicked most from search
- **Result type breakdown**: Pie chart showing template vs article vs category clicks
- **Search-to-click time**: Average time between query and selection
- **Abandonment rate**: Percentage of searches closed without selecting a result
- **Search trigger breakdown**: Where users open search from (header, hero, keyboard)

### 4. Pass Trigger Source Through GlobalSearch

Update `GlobalSearchProps` to accept an optional `triggerSource` prop so the Header and Hero can pass context:
- Header icon click: `trigger_source: 'header'`
- Hero "search manually" link: `trigger_source: 'hero'`
- Keyboard shortcut: `trigger_source: 'keyboard'`

## Files to Edit

1. **`src/hooks/useAnalytics.ts`** -- Add `search_click` and `search_exit` to EventType union
2. **`src/components/search/GlobalSearch.tsx`** -- Add database tracking (site_search, search_click, search_exit events), pass trigger source, track timing
3. **`src/components/admin/analytics/SiteSearchReport.tsx`** -- Add CTR, clicked results table, result type pie chart, abandonment rate, trigger breakdown
4. **`src/components/layout/Header.tsx`** -- Pass `triggerSource="header"` to GlobalSearch
5. **`src/components/home/Hero.tsx`** -- Pass `triggerSource="hero"` to GlobalSearch

## Data Structure

Events written to `analytics_events`:

```
site_search: {
  search_term, results_count, search_location: "global_search",
  trigger_source: "header" | "hero" | "keyboard",
  template_results: number, article_results: number, category_results: number
}

search_click: {
  search_term, result_type: "template" | "article" | "category",
  result_slug, result_title, click_position: number,
  time_to_click_ms: number, total_results: number
}

search_exit: {
  search_term, had_results: boolean, results_count: number,
  trigger_source, session_duration_ms: number
}
```

