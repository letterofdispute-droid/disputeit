
# Analytics Intelligence Layer — Page Performance Monitoring & Content Strategy Integration

## The Good News: You're Already Collecting the Data

This is the key insight. Since day one, the site has been recording `page_view` events with full context: `page_path`, `session_id`, `referrer`, `first_touch` / `last_touch` attribution, and screen width. As of today there are **4,974 page view events** already stored across real page paths — `/`, `/dashboard`, `/articles`, `/state-rights`, dozens of individual article URLs, and more.

The data is there. What's missing is a **"Page Performance" lens** that presents it as actionable intelligence — specifically the "which pages are underperforming, and what should we do about it" view you're describing.

---

## What You're Asking For (Translated to Concrete Features)

The idea maps directly to three things:

1. **A Page Performance report** — A ranked table of every page by views, unique visitors, and engagement signals. Highlights underperformers with clear visual indicators ("this page got 2 views in 30 days — it's invisible").

2. **An AI-powered "Why is this underperforming?" button** — For any low-traffic page, an AI analysis that reads the page's content plan coverage, keyword targets, internal link count, article type distribution, and views — then produces a specific content strategy recommendation: "This template page has no related articles. Creating a How-To guide and a Sample Letter would likely triple its visibility."

3. **A bridge to the SEO Command Center** — So the insight flows directly into action: the recommendation creates a content plan or adds keywords, without leaving the screen.

---

## What Currently Exists (So We Don't Duplicate)

| Already Built | Where |
|---|---|
| `page_view` events with `page_path` stored | `analytics_events` table |
| Funnel tab with top landing pages (top 10) | `AdminAnalytics.tsx` FunnelTab |
| Site Search report (zero-result queries) | `SiteSearchReport.tsx` |
| Content performance by article views | `ContentPerformance.tsx` (SEO Dashboard) |
| Gap analysis by template coverage | `GapAnalysis.tsx` (SEO Dashboard) |
| Attribution by channel (first/last touch) | `AdminAnalytics.tsx` FunnelTab |

**The gap**: None of these surfaces combine page-level traffic data with content strategy recommendations in one place. You have to cross-reference the Funnel tab, the SEO Dashboard, and the Gap Analysis manually.

---

## Implementation Plan

### Phase 1 — Page Performance Tab in Admin Analytics

**New tab: "Pages"** added to `AdminAnalytics.tsx` alongside Revenue, Funnel, Activity, Campaigns, Search.

This tab shows a **sortable, filterable table** of all tracked pages, built entirely from the existing `analytics_events` data that's already in the database:

| Column | Source |
|---|---|
| Page URL | `page_path` from `analytics_events` |
| Total Views | Count of `page_view` events for that path |
| Unique Sessions | Count of distinct `session_id` values |
| Trend | View count this period vs. prior period (30d vs. prev 30d) |
| Last Seen | Most recent `page_view` event timestamp |
| Performance Signal | Color-coded badge: Hot / Normal / Cold / Invisible |

**Performance signal thresholds** (adjustable, based on relative position):
- **Hot** (top 10% of pages by views)
- **Normal** (middle 60%)
- **Cold** (bottom 20%, fewer than 5 views in period)
- **Invisible** (0 or 1 views — pages that have essentially no traffic)

The table will be filterable by page type (articles, templates, guides, category pages, static pages) by detecting patterns in the URL path.

**No new database tables or edge functions needed** — this is purely a query over existing `analytics_events` data, processed client-side using the already-loaded events array that `AdminAnalytics.tsx` fetches.

### Phase 2 — "Diagnose" Button per Page (AI-Powered)

Each row in the Pages table gets a **"Diagnose" button**. Clicking it opens a slide-out panel with an AI-generated content strategy for that specific page.

The panel calls a new **`diagnose-page-performance`** edge function that:

1. Reads the page's view count and trend from the events already passed to it
2. Looks up any related `blog_posts` (for article pages) or `content_plans` (for template pages) from the database
3. Looks up `link_suggestions` — how many internal links point to this page
4. Looks up `keyword_targets` — whether this page's category has unused keyword budget
5. Sends this context to `google/gemini-2.5-flash` with a focused prompt: "Act as an SEO content strategist. This page has had X views in the last 30 days. Here is its content coverage data. Diagnose why it's underperforming and give 3 specific, actionable recommendations."

**Output structure:**
```
Diagnosis Card:
  ├── Traffic signal (Red/Amber/Green)
  ├── Root cause statement (1-2 sentences from AI)
  └── 3 Recommendations:
       ├── Rec 1: "Create a 'How-To' cluster article targeting [keyword]"
       ├── Rec 2: "Add 2 internal links from [related article slugs]"  
       └── Rec 3: "This page has no meta description — add one"
           └── [Quick action buttons where applicable]
```

### Phase 3 — Bridge to Content Action

Two quick-action buttons in the Diagnose panel:
- **"Add to Keyword Pipeline"** — inserts the AI-suggested keyword into `keyword_targets` for the page's vertical, marking it `is_seed = true`. This feeds the existing keyword → plan → generate workflow.
- **"View in SEO Dashboard"** — deep-links to the SEO Command Center's Coverage or Queue tab pre-filtered to the relevant category.

This closes the loop: see the problem → understand why → take action → content is generated.

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/admin/AdminAnalytics.tsx` | Add "Pages" tab to the `TabsList` and `TabsContent`; create `PagePerformanceTab` component inline (same pattern as `FunnelTab`) |
| `supabase/functions/diagnose-page-performance/index.ts` | New edge function — reads page context from DB, calls Gemini, returns structured diagnosis |
| `src/components/admin/analytics/PageDiagnosisPanel.tsx` | New slide-out panel component for displaying the AI diagnosis and action buttons |

No database migrations required. The `analytics_events` table already stores all necessary data.

---

## The "When You Have Users" Part

Right now the data is mostly your own testing sessions (4,974 events, ~430 unique sessions on the homepage). The system is fully ready for real users — every visitor will be tracked automatically via the `usePageView()` hook in `Layout.tsx`. As traffic grows, the Page Performance tab will self-populate with increasingly meaningful signals.

The only additional tracking enhancement worth adding: **scroll depth** (how far users scroll on article pages before leaving). This is currently not tracked and would give a much stronger "engagement" signal than view count alone. It could be added to `useAnalytics.ts` as a `scroll_depth` event type without any schema changes.

---

## Summary: What Gets Built

| Feature | Effort | Value |
|---|---|---|
| Page Performance table tab | 1 session | High — immediate visibility into traffic distribution |
| Performance signal badges (Hot/Cold/Invisible) | Included above | High — at-a-glance page health |
| AI Diagnose button + panel | 1 session | Very High — converts insight to strategy |
| Keyword pipeline bridge button | 30 mins | High — closes the insight-to-action loop |
| SEO Dashboard deep-link | 15 mins | Medium — convenience |
| Scroll depth tracking (optional) | 30 mins | Medium — richer engagement signal |
