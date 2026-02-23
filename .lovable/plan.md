

# Google Search Console Integration — IMPLEMENTED ✅

## What Was Built

### 1. Database: `gsc_performance_cache` table
- Stores GSC query/page metrics with date ranges
- Admin-only RLS policies
- Indexed on query, impressions, position, fetched_at

### 2. Edge Function: `fetch-gsc-data`
- Authenticates via Google Service Account JWT
- Pulls up to 5,000 query+page rows from last 28 days (US filter)
- Caches in `gsc_performance_cache`, auto-clears stale data

### 3. Edge Function: `gsc-recommendations`
- AI-powered analysis combining GSC data with existing blog posts + keyword targets
- Returns: uncovered queries, quick wins (meta improvements), position opportunities, cannibalization warnings

### 4. UI: Search Console tab in SEO Dashboard
- Stats cards: total clicks, impressions, avg CTR, avg position
- Sub-tabs: Queries table, Opportunities, Quick Wins, Warnings
- Sync button + AI Analysis button

### 5. Enhanced Topic Discovery
- `suggest-content-topics` now includes GSC top queries in AI prompt when available
- Data-driven suggestions instead of guesswork

## Secrets Required
- `GOOGLE_SERVICE_ACCOUNT_KEY` — Google Cloud service account JSON key
- `GSC_SITE_URL` — Your site URL in GSC (e.g., `https://disputeletters.com`)
