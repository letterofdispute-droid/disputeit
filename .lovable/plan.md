

# Analytics Dashboard Overhaul: Fix Broken Charts + User Journey Paths + Attribution

## Issues Found

1. **Broken charts**: The Activity tab's bar chart and funnel show a giant "Sign Ups = 2" bar (pulled from `profiles` table count) while everything else is 0 (from `analytics_events` which is empty). This creates a visually broken chart with one massive bar and everything else flat.

2. **No user journey path tracking**: Currently only discrete events are tracked -- there's no way to see "Homepage -> Template -> Form -> Purchase" as a connected flow.

3. **No attribution tracking**: No first-touch or last-touch attribution data is captured.

---

## Fix 1: Broken Charts

**Problem**: The Activity funnel mixes data sources -- `signups` comes from `profiles` table count while everything else comes from `analytics_events` (which is empty). This creates a disproportionate bar.

**Solution**:
- Remove the hybrid data sourcing. When `analytics_events` has data, use it consistently. When it doesn't, show "No data yet" placeholders instead of broken bars.
- Add minimum height guards and "empty state" designs so charts look polished even with sparse data.
- Fix the Activity tab's bar chart to use Recharts `BarChart` instead of the custom CSS-based bars that don't scale properly on mobile (the screenshot shows bars overflowing).

---

## Fix 2: User Journey Path Tracking

**Problem**: Events are individual dots with no connection between them. You want to see: "User landed on homepage -> viewed template X -> started form -> purchased."

**Solution**:
- Enhance `useAnalytics` to track a `referrer` (previous page within the site) on every `page_view` event, creating a breadcrumb trail per session.
- Build a **Session Explorer** card in the Funnel tab that groups events by `session_id` and shows the path as a timeline (entry page -> intermediate pages -> exit/conversion point).
- Add a **Top User Paths** visualization showing the most common sequences (e.g., "Home -> Category -> Template -> Form" with frequency counts).

Data structure: Group `analytics_events` by `session_id`, sort by `created_at`, then render as a flow.

---

## Fix 3: First-Touch & Last-Touch Attribution

**Problem**: No attribution data is captured at all currently.

**Solution**:
- On first visit, store `first_touch_source` in `localStorage` by parsing `document.referrer` and UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`). Classify into channels: SEO (Google/Bing referrer), Social (Facebook/Twitter/etc), Email (utm_medium=email), Direct (no referrer), Paid (utm_medium=cpc/ppc).
- On every event, include `first_touch` (from localStorage, never changes) and `last_touch` (current referrer/UTM at time of event) in `event_data`.
- Build an **Attribution** section in the Funnel tab with two side-by-side pie charts:
  - **First Touch**: Shows which channel originally brought users (answers "how did they discover us?")
  - **Last Touch**: Shows which channel was active before conversion (answers "what drove the purchase?")
- Filter attribution data to show only sessions that resulted in a purchase for conversion-focused analysis.

---

## Files to Modify

### `src/hooks/useAnalytics.ts`
- Add `getAttribution()` helper that reads UTM params and `document.referrer` on first load, stores in localStorage as `first_touch_attribution`.
- Compute `last_touch_attribution` on each event from current referrer/UTMs.
- Include both in every event's `event_data`.
- Track previous page path for journey linking.

### `src/pages/admin/AdminAnalytics.tsx`
- **Fix Activity tab**: Replace custom CSS bar chart with Recharts BarChart. Add empty state handling when all values are 0. Remove hybrid `profiles`/`analytics_events` mixing for signups.
- **Enhance Funnel tab**:
  - Add **Session Explorer** card: Groups events by session_id, shows entry -> exit path with timestamps.
  - Add **Top Paths** card: Aggregates most common page sequences.
  - Add **Attribution** section: Two pie charts for first-touch and last-touch channel distribution.
  - Add **Attribution Table**: Tabular breakdown showing channel, sessions, conversions, and conversion rate per channel.

### New analytics event data shape

Each event's `event_data` will now include:
```text
{
  ...existing fields,
  referrer: "https://google.com",
  first_touch: { source: "google", medium: "organic", campaign: null, channel: "SEO" },
  last_touch: { source: "direct", medium: null, campaign: null, channel: "Direct" },
  prev_page: "/housing" (internal referrer)
}
```

### Channel Classification Logic

```text
UTM source present? -> Use utm_source + utm_medium
  utm_medium = "cpc" or "ppc" -> "Paid Search"
  utm_medium = "email" -> "Email"
  utm_medium = "social" -> "Social"
  
No UTM but has referrer?
  google/bing/yahoo/duckduckgo -> "Organic Search"
  facebook/twitter/instagram/linkedin/reddit -> "Social"
  Other external domain -> "Referral"
  
No referrer at all -> "Direct"
```

---

## Implementation Scope

- Fix the broken charts (empty states, consistent data sourcing, Recharts for Activity bars)
- Add attribution tracking to the analytics hook
- Build Session Explorer, Top Paths, and Attribution visualizations in the Funnel tab
- All within existing files, no new database changes needed (attribution data stored in the existing `event_data` JSONB column)

