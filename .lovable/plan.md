

# Complete Em Dash Cleanup - Third Attempt

The previous two attempts did NOT successfully replace em dashes in the largest files. There are still **887 instances remaining** across 12 files.

## Remaining Files (verified just now)

**Source files (812 instances across 7 files):**

1. `src/data/consumerRightsContent.ts` - ~683 instances (powers /guides/refunds)
2. `src/data/seoContent.ts` - ~69 instances
3. `src/data/templates/refundsTemplates.ts` - ~5 instances
4. `src/data/templates/contractors/landscapingTemplates.ts` - ~1 instance
5. `src/pages/HowItWorksPage.tsx` - ~5 instances
6. `src/pages/ArticlesPage.tsx` - ~3 instances (code comments)
7. `src/hooks/useSemanticLinkScan.ts` - ~1 instance

**Edge functions (75 instances across 5 files):**

8. `supabase/functions/scan-for-smart-links/index.ts` - ~10 instances
9. `supabase/functions/scan-for-semantic-links/index.ts` - ~5 instances
10. `supabase/functions/process-embedding-queue/index.ts` - 1 instance (regex)
11. `supabase/functions/fetch-category-images/index.ts` - ~2 instances
12. `supabase/functions/generate-blog-content/index.ts` - already has the prevention rule, but line 72 itself contains an em dash in the instruction text "NEVER use em dashes (--)" which is fine as a reference

## Approach

Read each file fully and perform the replacement of every `—` with `-`. The two largest files (`consumerRightsContent.ts` at ~683 instances and `seoContent.ts` at ~69 instances) will need to be rewritten since they have too many instances for line-by-line edits.

## Database Check

The `pages` table was already cleaned. The `blog_posts` table was already cleaned. No additional database work needed.

## Impact

This will finally fix the /guides/refunds page and all other pages that display content from these data files.

