

# Replace Remaining Em-Dashes in Data Files

## Problem
Em-dashes (`—`) are still visible on guide pages and other content. The previous cleanup missed 4 large data files containing ~765 occurrences total.

## Files to Fix

| File | Occurrences | Content Type |
|------|------------|--------------|
| `src/data/consumerRightsContent.ts` | ~674 | All 13 guide pages (introductions, rights, FAQs, tips, deadlines, etc.) |
| `src/data/seoContent.ts` | ~69 | SEO content blocks for template categories |
| `src/data/templates/refundsTemplates.ts` | ~17 | Refund template descriptions |
| `src/data/templates/contractors/landscapingTemplates.ts` | ~3 | Landscaping template sections |

## What Will NOT Be Changed
- `supabase/functions/generate-embeddings/index.ts` and `supabase/functions/process-embedding-queue/index.ts` - these use em-dashes inside regex character classes (`/[-\u2013\u2014:|]/`) for text splitting, which is correct behavior and should stay.

## Approach
Global find-and-replace of `—` with `-` in each of the 4 files listed above. No logic changes, purely string replacement.

