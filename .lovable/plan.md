

## Goal
Add an "Indexed Pages" metric to the GSC panel by calling the Google Search Console Sitemaps API, which returns submitted vs indexed URL counts per sitemap.

## Approach

### 1. Extend `fetch-gsc-data` edge function
- After fetching search analytics, also call the Sitemaps API:  
  `GET https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps`
- The existing OAuth scope (`webmasters.readonly`) already covers this endpoint — no changes needed there.
- Extract `submitted` and `indexed` counts from the sitemap response's `contents` array.
- Return these counts alongside the existing search analytics response.

### 2. Store index coverage data
- Add a new table `gsc_index_status` (or reuse `site_settings`) to cache the indexed/submitted counts so the UI doesn't need a fresh API call every page load.
- Fields: `id`, `submitted_count`, `indexed_count`, `sitemaps` (jsonb for per-sitemap breakdown), `fetched_at`.
- Singleton pattern (single row, upserted on each sync).

### 3. Update the UI
- In `SearchConsolePanel.tsx`, query `gsc_index_status` and display two new stat cards in the existing 4-card grid (making it 6 cards or replacing the grid layout):
  - **Indexed Pages**: e.g. "142"
  - **Index Coverage**: e.g. "92%" (indexed / submitted)
- Show these alongside Total Clicks, Impressions, CTR, and Position.

### Technical details

**Sitemaps API response shape:**
```json
{
  "sitemap": [
    {
      "path": "https://example.com/sitemap.xml",
      "contents": [
        { "type": "web", "submitted": "154", "indexed": "142" }
      ]
    }
  ]
}
```

**New migration:**
```sql
CREATE TABLE public.gsc_index_status (
  id text PRIMARY KEY DEFAULT 'singleton',
  submitted_count integer NOT NULL DEFAULT 0,
  indexed_count integer NOT NULL DEFAULT 0,
  sitemaps jsonb DEFAULT '[]',
  fetched_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: admin + service_role
```

**Edge function addition** (in `fetch-gsc-data`):
- Call sitemaps endpoint, sum all `contents[].submitted` and `contents[].indexed` across all sitemaps.
- Upsert into `gsc_index_status`.

**Frontend addition:**
- New query for `gsc_index_status` singleton.
- Two new cards: "Indexed Pages" and "Coverage %".

