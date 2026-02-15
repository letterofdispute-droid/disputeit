

# Revert to Gemini 2.5 Flash and Fix Cost Estimate

## Changes

### 1. Revert model back to Gemini 2.5 Flash

**File: `supabase/functions/scan-for-smart-links/index.ts`** (line 236)

Change `google/gemini-2.5-flash-lite` back to `google/gemini-2.5-flash`.

### 2. Update cost estimate on frontend

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

Update the per-article cost constant from `0.0015` to `0.002` (reflecting Flash pricing: ~2,000-4,000 input tokens + ~500 output tokens per article at Flash rates).

Two locations:
- Line 133: the `estimatedCost` variable
- Line 425: the inline display text

Both will use `0.002` instead of `0.0015`.

### 3. Dynamic estimate when category is selected

The estimate already updates dynamically based on the `maxArticles` input value. No additional query is needed since the user manually sets how many articles to process, and the cost scales with that number. The formula `maxArticles * 0.002` gives a clear estimate (e.g., 3000 articles = ~$6.00).

### Result

- Model: Gemini 2.5 Flash (better quality anchors)
- Cost display: ~$0.002 per article (accurate for Flash)
- Example: 3000 articles shows ~$6.00 instead of ~$4.50

