

# Fix: Remove All UK References from Topic Discovery

## Problem
Despite previous prompt updates, the AI still generates UK-focused topics because:
1. The example JSON in the prompt includes "insurance ombudsman complaint" -- a UK concept that biases the model
2. British spellings like "analyse" remain in the prompt, reinforcing UK English output
3. The frontend UI also uses British spellings throughout

## Changes

### 1. Edge Function -- `supabase/functions/suggest-content-topics/index.ts`

| Line | Current | Fix |
|------|---------|-----|
| 97 | `analyse site data` | `analyze site data` |
| 132 | `"insurance ombudsman complaint"` | `"how to appeal insurance decision"` |
| 138 | `Produce exactly 3-5 items` | `Produce exactly 3 items` |

### 2. Frontend -- `src/components/admin/seo/TopicDiscovery.tsx`

Replace all British spellings with American English:

| Line | Current | Fix |
|------|---------|-----|
| 271 | `Analyses your live article counts` | `Analyzes your live article counts` |
| 286 | `Analysing site…` / `Re-Analyse` / `Analyse & Suggest Topics` | `Analyzing site…` / `Re-Analyze` / `Analyze & Suggest Topics` |
| 301 | `Analysing site data…` | `Analyzing site data…` |
| 319 | `Analyse & Suggest Topics` | `Analyze & Suggest Topics` |

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/suggest-content-topics/index.ts` | Fix British spelling, replace UK example keyword, reduce to exactly 3 suggestions |
| `src/components/admin/seo/TopicDiscovery.tsx` | Replace all British spellings with American English |
