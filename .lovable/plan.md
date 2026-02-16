

# Complete Em Dash Cleanup (Code Files + Pages Table)

## Status Check

- Database `blog_posts` table: DONE (0 remaining)
- Database `pages` table: 2 rows still have em dashes (About, Pricing pages)
- Code files: 927 instances across 20 files in `src/`
- Edge functions: 166 instances across 10 files in `supabase/functions/`

## Part 1: Code Files (20 files)

Global find-and-replace of all `—` with `-` in these files:

**Data files (bulk of instances):**
1. `src/data/consumerRightsContent.ts` (~683 instances - this powers the /guides/refunds page you're seeing)
2. `src/data/seoContent.ts`
3. `src/data/templates/refundsTemplates.ts`
4. `src/data/templates/contractors/landscapingTemplates.ts`

**Pages:**
5. `src/pages/HowItWorksPage.tsx`
6. `src/pages/CategoryGuidePage.tsx`
7. `src/pages/ArticlesPage.tsx`
8. `src/pages/admin/AdminUsers.tsx`

**Components:**
9-16. Various admin/letter components (ImageBackfillCard, SiteSearchReport, ImageOptimizer, TemplateCoverageMap, GenerationProgress, SemanticScanPanel, LinkActions, GeneratingOverlay)

**Hooks:**
17. `src/hooks/useAuth.tsx`
18. `src/hooks/useGenerationJob.ts`

**Other data:**
19-20. Any remaining files from the search results

## Part 2: Edge Functions (10 files)

Replace `—` with `-` in all edge function files, with one exception:
- In `generate-embeddings/index.ts`, the regex patterns like `[-\u2013\u2014:|,;]` that split on em dashes need to keep working - replace the literal `—` in those regexes too since we're eliminating em dashes from all content

## Part 3: Database - Pages Table

Run SQL to clean the 2 remaining pages:

```text
UPDATE pages 
SET content = REPLACE(content, '—', '-'),
    meta_description = REPLACE(meta_description, '—', '-'),
    title = REPLACE(title, '—', '-')
WHERE content LIKE '%—%' OR meta_description LIKE '%—%' OR title LIKE '%—%';
```

## Part 4: Prevention (AI Prompts)

Add "Never use em dashes (—). Use regular hyphens (-) instead." to:
- `supabase/functions/generate-blog-content/index.ts`
- `supabase/functions/bulk-generate-articles/index.ts`

## Impact

- Fixes the /guides/refunds page you're currently viewing
- Cleans all 927 code instances + 166 edge function instances
- Cleans 2 remaining database pages
- Prevents future AI-generated content from using em dashes
