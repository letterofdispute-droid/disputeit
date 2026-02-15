
# Reduce Smart Scan AI Cost and Add Cost Warning

## Problem

Smart Scan makes **one AI call per article**, which consumed $10+ of AI credits across ~4,800 articles. There is no cost estimate or warning before starting a scan, and no way to limit how many articles to process.

## Solution

Three changes to prevent surprise costs:

### 1. Add a cost estimate before scanning

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

Before the Smart Scan button triggers, show an estimate:
- Query the count of scannable articles for the selected category
- Display: "This will process ~X articles using AI. Estimated cost: ~$Y"
- Add a confirmation dialog before starting

The estimate formula: each article uses roughly 2,000-4,000 tokens input + 500 output with Gemini 2.5 Flash. At current rates, that is approximately $0.001-0.002 per article. For 2,752 articles, that is ~$3-5.

### 2. Add a "max articles" limit option

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

Add an optional input field: "Max articles to process" (default: 100). This lets you test quality on a small batch before committing to a full category scan.

Pass this as a `limit` parameter to the edge function.

**File: `supabase/functions/scan-for-smart-links/index.ts`**

Accept a `maxArticles` parameter. When creating the scan job, set `total_items` to `min(available_articles, maxArticles)` and stop the batch chain once that limit is reached.

### 3. Switch to a cheaper model for bulk scans

**File: `supabase/functions/scan-for-smart-links/index.ts`**

Change the model from `google/gemini-2.5-flash` to `google/gemini-2.5-flash-lite` for bulk scans. This is the cheapest model available and is well-suited for this classification/extraction task. The quality difference for link suggestion extraction is minimal.

## Technical Details

### SemanticScanPanel.tsx changes

- Add a `maxArticles` number input (default 100) next to the category selector
- Before starting Smart Scan, query `article_embeddings` count for the selected category (filtered by scannable status)
- Show an `AlertDialog` confirmation: "Process up to X articles (~$Y estimated). Continue?"
- Pass `maxArticles` to the `smartScan` mutation

### scan-for-smart-links/index.ts changes

- Accept `maxArticles` parameter in `SmartScanRequest`
- When creating the job, cap `total_items` at `maxArticles`
- In the batch loop, add a completion check: if `processed_items >= maxArticles`, finalize the job
- Change model from `google/gemini-2.5-flash` to `google/gemini-2.5-flash-lite`

### useSemanticLinkScan.ts changes

- Update the `smartScanMutation` to accept and pass `maxArticles` parameter

## Result

- Users see cost estimates before scanning
- Default limit of 100 articles prevents accidental $10 burns
- Cheaper model reduces per-article cost by ~60-70%
- Full category scans are still possible by increasing the limit manually
