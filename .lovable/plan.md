

# Replace Em Dashes (—) with Regular Hyphens (-) Across Codebase

## Scope

Found ~1,100+ instances of "—" (em dash) across 30+ files in `src/` and `supabase/`. The bulk is in:

- `src/data/consumerRightsContent.ts` - ~683 matches (guides data)
- `src/data/seoContent.ts` - SEO content
- `src/data/templates/refundsTemplates.ts` - template descriptions
- `src/data/templates/contractors/landscapingTemplates.ts` - template text
- `src/pages/HowItWorksPage.tsx` - page copy
- `src/pages/CategoryGuidePage.tsx` - guide page text
- `src/pages/ArticlesPage.tsx` - code comments
- `src/pages/admin/AdminUsers.tsx` - fallback display values
- `src/components/` (8 files) - UI text and code comments
- `supabase/functions/` (10 files) - log messages, comments, prompts
- `src/hooks/useAuth.tsx` - log message

## Approach

Simple global find-and-replace of `—` with `-` in every file where it appears. No exceptions - comments, user-facing text, log messages, template content, AI prompts all get the same treatment.

### Special case: `AdminUsers.tsx`
The fallback `'—'` used for stats display (`stats?.total ?? '—'`) will become `'-'` which is fine as a placeholder.

### Special case: `process-embedding-queue/index.ts`
Contains `[-–—:|]` regex that splits on em dashes. This will change to `[-–-:|]` which is functionally equivalent since `-` is already in the character class. We should keep the regex working by replacing only the em dash character there too.

## Files to edit (all instances of — become -)

**Data files (user-facing content):**
1. `src/data/consumerRightsContent.ts` (~683 instances)
2. `src/data/seoContent.ts`
3. `src/data/templates/refundsTemplates.ts`
4. `src/data/templates/contractors/landscapingTemplates.ts`

**Pages:**
5. `src/pages/HowItWorksPage.tsx`
6. `src/pages/CategoryGuidePage.tsx`
7. `src/pages/ArticlesPage.tsx`
8. `src/pages/admin/AdminUsers.tsx`

**Components:**
9. `src/components/admin/blog/ImageBackfillCard.tsx`
10. `src/components/admin/analytics/SiteSearchReport.tsx`
11. `src/components/admin/storage/ImageOptimizer.tsx`
12. `src/components/admin/seo/TemplateCoverageMap.tsx`
13. `src/components/admin/seo/queue/GenerationProgress.tsx`
14. `src/components/admin/seo/links/SemanticScanPanel.tsx`
15. `src/components/admin/seo/links/LinkActions.tsx`
16. `src/components/letter/GeneratingOverlay.tsx`

**Hooks:**
17. `src/hooks/useAuth.tsx`

**Edge functions:**
18. `supabase/functions/backfill-blog-images/index.ts`
19. `supabase/functions/apply-links-bulk/index.ts`
20. `supabase/functions/scan-for-semantic-links/index.ts`
21. `supabase/functions/process-embedding-queue/index.ts`
22. `supabase/functions/optimize-storage-images/index.ts`
23. `supabase/functions/fetch-category-images/index.ts`
24. `supabase/functions/scan-for-smart-links/index.ts`

**Also check the Stripe checkout file we just edited:**
25. `supabase/functions/create-letter-checkout/index.ts` (the `—` in the product name)

