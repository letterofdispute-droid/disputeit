
# Phase 3.2, 4, and 5: Custom Campaign Creator, Activity Feed, and Maintenance Tools

## Phase 3.2 -- Custom Campaign Creator

Add a "New Campaign" button and dialog to the Coverage tab, allowing ad-hoc pillar + cluster campaigns without needing a hardcoded template.

### What it does
- A "New Campaign" button appears in the Keyword Campaigns section header
- Opens a dialog with fields: Campaign Name, Vertical (dropdown with custom option), Pillar Title, and up to 10 cluster article ideas (title + article type + target keyword)
- On submit, creates a `content_plan` row and `content_queue` entries
- Immediately visible in the Keyword Campaigns section

### Technical details

**New file:** `src/components/admin/seo/CustomCampaignDialog.tsx`
- Dialog form with dynamic cluster rows (add/remove up to 10)
- Each cluster row: title input, article type select (how-to, mistakes, rights, sample, faq, case-study, comparison, checklist), target keyword input
- Vertical dropdown uses `KNOWN_VERTICALS` from KeywordManager + custom input option
- On submit: inserts into `content_plans` then batch-inserts into `content_queue`

**Modified file:** `src/components/admin/seo/TemplateCoverageMap.tsx`
- Import and render `CustomCampaignDialog` in the KeywordCampaignsSection header
- Add "New Campaign" button next to the section title

---

## Phase 4 -- Activity Feed

Add a "Recent Activity" card to the SEO Dashboard showing the last 10 operational events across all SEO workflows.

### What it does
- Displays a compact timeline below the stats bar: "45 keywords imported 2h ago", "12 articles generated yesterday", "230 links applied 3 days ago"
- Sources events from existing tables using timestamp-based queries (no new tables needed)

### Technical details

**New file:** `src/components/admin/seo/ActivityFeed.tsx`
- Queries 5 sources in parallel:
  1. `keyword_targets` -- latest batch imports (GROUP BY batch_id, max imported_at)
  2. `content_queue` -- recently generated items (status = 'generated', generated_at DESC)
  3. `blog_posts` -- recently published (published_at DESC)
  4. `link_suggestions` -- recently applied (applied_at DESC)
  5. `daily_publish_jobs` -- recent auto-publish runs
- Merges all events into a single timeline sorted by timestamp
- Shows max 10 items with icon, description, and relative time
- Compact card design that fits between CoverageStats and the Tabs

**Modified file:** `src/pages/admin/SEODashboard.tsx`
- Import and render `ActivityFeed` between `CoverageStats` and the `Tabs` component

---

## Phase 5 -- Maintenance Tools

### 5.1 Article Health Score (Analytics tab)

Add a per-article health indicator to the Analytics tab showing completeness of each published article.

**New file:** `src/components/admin/seo/analytics/ArticleHealthTable.tsx`
- Fetches published articles with: featured_image_url, meta_title, meta_description, primary_keyword, related_templates
- Cross-references with `article_embeddings` for inbound/outbound link counts
- Calculates health score (0-10) based on:
  - Has featured image (1 pt)
  - Has meta title (1 pt)  
  - Has meta description (1 pt)
  - Has primary keyword (1 pt)
  - Has secondary keywords (1 pt)
  - Has related templates (1 pt)
  - Has inbound links > 0 (1 pt)
  - Has outbound links > 0 (1 pt)
  - Word count > 1000 (1 pt)
  - Has middle images (1 pt)
- Sortable table with color-coded score badges
- Filter: "Show only unhealthy (score < 7)"

**Database:** New RPC `get_article_health_data` to join blog_posts with article_embeddings and return health-relevant fields in one query (avoids N+1)

**Modified file:** `src/components/admin/seo/analytics/ContentPerformance.tsx`
- Add ArticleHealthTable below the existing content

### 5.2 GSC-Driven Declining Content (Search Console tab)

Add a "Declining" sub-tab to the Search Console panel showing articles losing ranking position.

**Modified file:** `src/components/admin/seo/SearchConsolePanel.tsx`
- Add a 5th sub-tab: "Declining" with a TrendingDown icon
- Queries `gsc_performance_cache` to find queries where current position is worse than earlier position (requires at least 2 data points per query)
- Shows: query, page, previous position, current position, delta, suggested action
- Actions: "Update content", "Add internal links", "Improve meta tags" (informational badges)

**Database:** New RPC `get_declining_queries` that compares the latest fetched_at positions vs. earlier ones for the same query, returning those with position regression > 3 spots

---

## Implementation Order

1. Database migration: `get_article_health_data` RPC + `get_declining_queries` RPC
2. `CustomCampaignDialog.tsx` (new) + update `TemplateCoverageMap.tsx`
3. `ActivityFeed.tsx` (new) + update `SEODashboard.tsx`
4. `ArticleHealthTable.tsx` (new) + update `ContentPerformance.tsx`
5. Update `SearchConsolePanel.tsx` with Declining tab

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/admin/seo/CustomCampaignDialog.tsx` |
| Create | `src/components/admin/seo/ActivityFeed.tsx` |
| Create | `src/components/admin/seo/analytics/ArticleHealthTable.tsx` |
| Create | DB migration (2 RPCs) |
| Modify | `src/components/admin/seo/TemplateCoverageMap.tsx` |
| Modify | `src/pages/admin/SEODashboard.tsx` |
| Modify | `src/components/admin/seo/analytics/ContentPerformance.tsx` |
| Modify | `src/components/admin/seo/SearchConsolePanel.tsx` |
