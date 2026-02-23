

# Google Search Console Integration for Data-Driven SEO Recommendations

## Overview

Integrate the Google Search Console (GSC) API into the SEO Command Center to pull real search performance data (queries, clicks, impressions, CTR, position) and use AI to generate actionable recommendations. This turns the "Discover" tab from a content-gap guessing tool into a data-driven decision engine.

## How GSC Authentication Works

Google Search Console API requires a **Google Cloud Service Account** with access to your GSC property. There is no built-in connector for GSC in the platform, so we handle it via a service account JSON key stored as a secret.

**You will need to:**
1. Create a Google Cloud project (or use an existing one)
2. Enable the "Search Console API"
3. Create a Service Account and download the JSON key
4. Add the service account email as a user in your GSC property (read-only access is sufficient)
5. Paste the JSON key content as a secret when prompted

## What Gets Built

### 1. New Database Table: `gsc_performance_cache`

Stores daily GSC data snapshots so we don't hit API rate limits and can show trends over time.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `query` | text | Search query from GSC |
| `page` | text | Landing page URL |
| `clicks` | integer | Total clicks |
| `impressions` | integer | Total impressions |
| `ctr` | float | Click-through rate |
| `position` | float | Average position |
| `date_range_start` | date | Start of data period |
| `date_range_end` | date | End of data period |
| `fetched_at` | timestamp | When data was pulled |
| `country` | text | Country filter (optional) |

### 2. New Edge Function: `fetch-gsc-data`

Connects to Google Search Console API using service account credentials:
- Fetches top queries (by impressions) for the last 28 days
- Fetches top pages performance
- Fetches queries where the site ranks (positions 5-30) but has low CTR -- these are the "quick win" opportunities
- Stores results in `gsc_performance_cache`
- Supports filtering by country (default: US)

### 3. New Edge Function: `gsc-recommendations`

AI-powered analysis that combines GSC data with existing site data:
- Reads cached GSC data
- Cross-references with existing `keyword_targets`, `content_plans`, and `blog_posts`
- Identifies:
  - **Uncovered queries**: Queries getting impressions but no dedicated content
  - **Underperforming pages**: Pages with high impressions but low CTR (needs better titles/meta)
  - **Position opportunities**: Queries at positions 8-20 that could move to page 1 with more content
  - **Cannibalization**: Multiple pages competing for the same query
- Returns structured recommendations with suggested actions

### 4. New UI Tab: "Search Console" in SEO Dashboard

Added as a new tab alongside Discover, Coverage, Queue, etc.

**Sections:**
- **Query Performance Table**: Top queries with clicks, impressions, CTR, position, and trend indicators
- **Opportunity Cards**: AI-generated recommendations grouped by action type (create content, optimize existing, build links)
- **Coverage Gaps**: Queries where you rank but have no dedicated article -- with a one-click "Plan Article" button that creates a content queue item
- **Quick Wins**: Pages with high impressions but low CTR where meta title/description improvements could drive immediate gains
- **Fetch Controls**: Button to pull fresh GSC data, shows last fetch timestamp

### 5. Enhanced Topic Discovery

The existing "Discover" tab will optionally consume GSC data to make AI suggestions more accurate:
- Instead of guessing what topics to cover, it can see which queries already bring impressions
- The `suggest-content-topics` edge function will include GSC query data in its AI prompt when available

## Files to Create/Modify

| File | Change |
|------|--------|
| Database migration | Create `gsc_performance_cache` table with RLS policies (admin-only) |
| `supabase/functions/fetch-gsc-data/index.ts` | NEW: Fetches data from GSC API using service account, stores in cache table |
| `supabase/functions/gsc-recommendations/index.ts` | NEW: AI analysis combining GSC data with existing site data |
| `src/components/admin/seo/SearchConsolePanel.tsx` | NEW: Full GSC dashboard UI with query table, opportunity cards, and fetch controls |
| `src/pages/admin/SEODashboard.tsx` | Add "Search Console" tab |
| `supabase/functions/suggest-content-topics/index.ts` | Enhance to optionally include GSC query data in AI prompt |

## Technical Details

### GSC API Authentication (Service Account)

The edge function will:
1. Read the `GOOGLE_SERVICE_ACCOUNT_KEY` secret (JSON string)
2. Generate a JWT signed with the service account private key
3. Exchange it for an access token via Google's OAuth2 endpoint
4. Call `POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`

### API Calls Made

```text
POST /searchAnalytics/query
{
  "startDate": "28 days ago",
  "endDate": "today",
  "dimensions": ["query", "page"],
  "rowLimit": 1000,
  "startRow": 0
}
```

### AI Recommendation Prompt Structure

The AI receives:
- Top 200 GSC queries with metrics
- List of existing blog post slugs and their categories
- Existing keyword targets and their usage status
- Content plan coverage data

It returns structured JSON with:
- Uncovered query opportunities (with suggested vertical, article type, keywords)
- Optimization suggestions for existing pages
- Cannibalization warnings

### Rate Limiting and Caching

- GSC data is cached in the database; fetching is manual (button click) or daily via cron
- Cache expiry: 24 hours (configurable)
- Google API quota: 1,200 queries/minute (more than enough)

## Implementation Order

1. Store the Google Service Account key as a secret
2. Create the cache table
3. Build `fetch-gsc-data` edge function
4. Build `SearchConsolePanel.tsx` UI
5. Build `gsc-recommendations` edge function
6. Wire into SEO Dashboard as a new tab
7. Enhance Topic Discovery with GSC data

