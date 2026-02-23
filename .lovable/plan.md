

# SEO Command Center: Structural Audit and Workflow Overhaul

## Current State Assessment

The SEO Command Center has 8 tabs: Discover, Search Console, Coverage, Queue, Links, Calendar, Analytics, Keywords. Each works in isolation. Here is what exists and what is broken or missing, answering each of your questions first.

---

## Answers to Your Questions

### 1. "How will you know which vertical is this?" (when uploading a mini-campaign XLSX)

**Current behavior:** The XLSX importer maps sheet tab names to verticals using a hardcoded `SHEET_NAME_MAP`. If the sheet name is "housing" it maps to "housing". But if you create a new sheet called "rent reduction" or "landlord negotiation," it gets silently ignored.

**Problem:** There is no way to manually assign a vertical when the sheet name does not match. No dropdown, no "create new vertical" option, no fallback.

**Fix needed:** Add a vertical assignment step after parsing -- show the detected sheets with an editable vertical dropdown (including a "custom" option). Also allow typing a new vertical name that gets added to the taxonomy.

---

### 2. "How will I know which keywords are new and which are old and unused?"

**Current behavior:** The Keywords tab shows a simple table with Total, Seeds, Used, Unused per vertical. There is no timestamp, no "imported batch" concept, no way to see which keywords are from today's upload vs. last month's upload.

**Problem:** After uploading a new campaign, all keywords blend together. You cannot tell which were just added.

**Fix needed:** Add an `imported_at` or `batch_id` column to `keyword_targets`. Show a "Recently Added" badge or filter. Add a "Last Import" section showing what just arrived.

---

### 3. "What to do with unused keywords?"

**Current behavior:** You can click "Plan All Keywords" which runs `plan-from-keywords` to group unused keywords into article topics and queue them. Or you can plan per-vertical with the lightning bolt icon.

**Problem:** There is no explanation or guidance in the UI about what "Plan" actually does. No preview of what articles will be created before committing. No way to exclude specific keywords from planning.

**Fix needed:** Add a "Preview Plan" step before committing. Show which article topics would be created, with which keywords, before inserting into the queue. Allow deselecting keywords.

---

### 4. "Will a new campaign enter the Template Coverage screen?"

**Current behavior:** No. The Template Coverage Map is hardcoded to `allTemplates` from `src/data/allTemplates.ts`. Keyword-based campaigns create content plans with slugs like `housing-kw-rent-reduction` which are explicitly filtered OUT of the coverage map (the code checks `templateSlugs.has(p.template_slug)` and excludes anything not in the static template list).

**Problem:** Keyword campaigns are invisible in Coverage. They only appear in the Queue tab.

**Fix needed:** Add a second section to the Coverage tab (or a toggle) showing "Keyword Campaigns" alongside "Template Coverage." This gives visibility into campaigns that are not template-driven.

---

### 5. "How do we get a complete overview of our actions?"

**Current behavior:** There is no unified activity log or dashboard summary. Each tab has its own stats but they do not cross-reference. You cannot see "last week I uploaded 200 keywords, planned 45 articles, generated 30, published 25, added 150 internal links" in one place.

**Problem:** No single-pane-of-glass view of SEO operations.

**Fix needed:** Transform the top `CoverageStats` bar into a comprehensive "SEO Health Dashboard" that shows: keywords imported, articles planned, articles generated, articles published, internal links applied, GSC sync status -- all with trend indicators (vs. last period).

---

### 6. "All metrics must be 100% synced across all tabs"

**Current behavior:** Each component fetches its own data independently. The CoverageStats bar counts links via `link_suggestions` table. The Analytics tab counts links differently (fetches all rows and filters client-side). The LinkSuggestions tab has its own count. These can show different numbers.

**Specific problem found:** `ContentPerformance.tsx` line 43 fetches ALL `link_suggestions` rows without a limit -- this will cap at 1,000 rows (PostgREST default), while `CoverageStats.tsx` uses `count: 'exact'` with `head: true` which returns the true count. So the Analytics tab will show max 1,000 while the top bar shows the real number (e.g., 46,183).

**Fix needed:**
- Create a shared `useSEOMetrics` hook that fetches all core metrics once using server-side aggregation (count: exact or RPC)
- All components consume from this single source of truth
- Eliminate duplicate queries and client-side counting

---

### 7. "How do we add a new template and create a pillar with clusters?"

**Current behavior:** Templates are hardcoded in TypeScript files under `src/data/templates/`. Adding a template requires editing code. There is no admin UI to create templates. The Coverage tab only shows what is in `allTemplates`.

For creating a pillar + clusters: You can use the ClusterPlanner dialog per template, but there is no way to create an ad-hoc pillar topic that is not tied to an existing template.

**Problem:** The entire template system is code-driven, not database-driven. Adding a new template or a custom pillar campaign requires developer intervention.

**Fix needed (phased):**
- Phase 1: Add a "Custom Campaign" creator in the Coverage or Keywords tab that lets you define a pillar topic + up to 10 cluster article ideas, assign them a vertical, and queue them -- without needing a template in the codebase
- Phase 2 (future): Migrate templates to database for full admin CRUD

---

## What is Missing: The Author/Admin Natural Flow

Putting myself in your position, here is the complete workflow and where it breaks:

### Discovery Flow (Where do I write next?)
1. Check GSC for real search queries -- EXISTS (Search Console tab)
2. Run AI Topic Discovery for gap analysis -- EXISTS (Discover tab)
3. Research keywords externally (SEMrush) -- EXTERNAL
4. Upload keywords -- EXISTS (Keywords tab)
5. **MISSING: See a unified "Opportunity Board" that merges GSC queries + AI suggestions + keyword campaigns into one prioritized list**

### Planning Flow (What exactly will be created?)
1. Plan keywords into articles -- EXISTS
2. **MISSING: Preview what will be created before committing**
3. **MISSING: See keyword campaigns alongside template coverage**
4. **MISSING: Create ad-hoc campaigns (pillar + clusters) without a template**

### Production Flow (Generate and publish)
1. Queue shows items ready to generate -- EXISTS
2. Generate articles -- EXISTS
3. Auto-publish daily -- EXISTS
4. **MISSING: Post-publish checklist (internal links added? Images generated? Embedding indexed?)**

### Maintenance Flow (Keep things healthy)
1. Internal link scanning -- EXISTS
2. Broken link detection -- EXISTS
3. **MISSING: Stale content detection (articles older than X months with declining traffic)**
4. **MISSING: Re-optimization suggestions (articles that rank 11-20 that need updating)**
5. **MISSING: Consolidated health score per article (has featured image? has internal links? has meta tags? keywords present?)**

---

## Implementation Plan

### Phase 1: Data Consistency (Critical)

**Task 1.1 -- Shared SEO Metrics Hook**
- Create `src/hooks/useSEOMetrics.ts` that fetches all core counts via server-side aggregation
- Metrics: total articles, published articles, total keywords, unused keywords, internal links (applied + pending), GSC last sync date, queue stats
- All components (CoverageStats, ContentPerformance, LinkSuggestions stats) consume from this hook
- Single query cache key so numbers are always consistent

**Task 1.2 -- Fix Analytics Link Count Bug**
- `ContentPerformance.tsx` must use `count: 'exact'` instead of fetching all rows
- Same pattern for any other component doing client-side counting

### Phase 2: Keyword Manager Improvements

**Task 2.1 -- Vertical Assignment UI**
- After XLSX parse, show a mapping table: "Sheet Name -> Detected Vertical -> [Dropdown to override]"
- Add a "Custom / New Vertical" option in the dropdown
- Only proceed with import after user confirms the mapping

**Task 2.2 -- Import Batch Tracking**
- Add `batch_id` (uuid) and `imported_at` (timestamp) columns to `keyword_targets`
- Each import creates a batch; the Keywords tab shows "Latest Import: 47 keywords added 2 hours ago"
- Add a "New" badge next to recently imported keywords
- Add filter: "Show only latest import" vs. "Show all"

**Task 2.3 -- Plan Preview**
- Before "Plan All Keywords" executes, show a preview dialog: "This will create N article topics across M verticals. [Show sample titles]. Proceed?"
- Allow deselecting verticals from the plan

### Phase 3: Campaign Visibility

**Task 3.1 -- Keyword Campaigns Section in Coverage**
- Add a collapsible "Keyword Campaigns" section below the Template Coverage map
- Shows all content plans with keyword-based slugs, grouped by vertical
- Each campaign shows: pillar title, cluster count, generation progress, publish status

**Task 3.2 -- Custom Campaign Creator**
- "New Campaign" button in the Coverage or Keywords tab
- Form: Campaign name, Vertical (dropdown), Pillar title, up to 10 cluster article ideas (title + article type + target keyword)
- Creates a content_plan + content_queue entries
- Appears in the Keyword Campaigns section immediately

### Phase 4: Unified Dashboard

**Task 4.1 -- Enhanced CoverageStats**
- Expand the top stats bar to include: GSC status (last sync + trend), Keyword pipeline health (unused count), Recent activity summary
- Add period comparison: "vs. last 7 days" trend arrows

**Task 4.2 -- Activity Feed**
- Small "Recent Activity" card showing the last 10 actions: "45 keywords imported", "12 articles generated", "8 articles published", "230 internal links applied"
- Sourced from existing tables (keyword_targets, content_queue, blog_posts, link_suggestions) with timestamp-based queries

### Phase 5: Maintenance Tools

**Task 5.1 -- Article Health Score**
- In the Analytics tab, add a per-article health indicator
- Checks: has featured image, has meta title/description, has internal links (inbound + outbound), keywords present in content, word count above threshold
- Shows as a score (e.g., 8/10) with specific items flagged

**Task 5.2 -- GSC-Driven Re-optimization**
- In Search Console tab, add a "Declining Content" sub-tab
- Cross-references GSC position data with blog_posts to find articles where position is worsening
- Suggests specific actions: "Update content", "Add internal links", "Improve meta tags"

---

## Technical Details

### Shared Metrics Hook (`useSEOMetrics.ts`)
```text
Queries (all using count: 'exact' or RPC):
- blog_posts where status = 'published' -> published count
- blog_posts total -> total articles
- content_queue by status -> queued/generating/generated/published/failed
- link_suggestions by status -> applied/pending counts
- keyword_targets via get_keyword_stats RPC -> total/used/unused
- gsc_performance_cache -> last fetched_at + total queries
```

### New DB Columns
```text
keyword_targets:
  + batch_id uuid DEFAULT gen_random_uuid()
  + imported_at timestamptz DEFAULT now()
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useSEOMetrics.ts` | Single source of truth for all SEO numbers |
| DB migration | Add batch_id, imported_at to keyword_targets |

### Files to Modify
| File | Change |
|------|--------|
| `src/components/admin/seo/CoverageStats.tsx` | Consume from useSEOMetrics |
| `src/components/admin/seo/analytics/ContentPerformance.tsx` | Fix link count bug, use useSEOMetrics |
| `src/components/admin/seo/KeywordManager.tsx` | Add vertical mapping UI, batch tracking, plan preview |
| `src/components/admin/seo/TemplateCoverageMap.tsx` | Add keyword campaigns section |
| `src/components/admin/seo/SearchConsolePanel.tsx` | Add declining content sub-tab |
| `supabase/functions/import-keywords/index.ts` | Accept batch_id, store imported_at |

### Implementation Order
1. Phase 1 (data consistency) -- foundation for everything else
2. Phase 2 (keyword improvements) -- fixes the immediate workflow pain
3. Phase 3 (campaign visibility) -- answers "where did my campaign go?"
4. Phase 4 (unified dashboard) -- provides the overview
5. Phase 5 (maintenance) -- long-term health

This is a large scope. I recommend starting with Phase 1 + Phase 2 together (they are the most impactful for your daily workflow), then Phase 3, then 4 and 5.

