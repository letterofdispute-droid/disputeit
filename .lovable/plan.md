

# Replace Em Dashes Everywhere - Code Files + Database

## Summary

There are two parts to this cleanup:
1. **Code files**: ~1,100 instances across 25+ files (previous attempt was cancelled)
2. **Database**: 168 blog posts with em dashes in content/title, plus 3 with em dashes in meta_description/excerpt

## Part 1: Code Files (same as before)

Replace all `—` with `-` across all files listed in the original plan. This includes data files, pages, components, hooks, and edge functions. Full list of 25 files remains the same.

## Part 2: Database Cleanup

Run SQL UPDATE statements to replace em dashes in the `blog_posts` table:

```text
UPDATE blog_posts 
SET content = REPLACE(content, '—', '-'),
    title = REPLACE(title, '—', '-'),
    meta_description = REPLACE(meta_description, '—', '-'),
    excerpt = REPLACE(excerpt, '—', '-'),
    meta_title = REPLACE(meta_title, '—', '-')
WHERE content LIKE '%—%' 
   OR title LIKE '%—%' 
   OR meta_description LIKE '%—%' 
   OR excerpt LIKE '%—%'
   OR meta_title LIKE '%—%';
```

This single query will clean all 168+ affected blog posts in one go.

## Part 3: Prevent Future Em Dashes

Update the AI blog content generation prompts (in the edge functions that generate articles) to explicitly instruct the AI not to use em dashes. This goes in:
- `supabase/functions/generate-blog-content/index.ts` - add instruction like "Never use em dashes. Use regular hyphens instead."
- `supabase/functions/bulk-generate-articles/index.ts` - same instruction

## Implementation Order

1. Fix all code files (global find-and-replace of `—` with `-`)
2. Run the database UPDATE query
3. Add "no em dash" instruction to AI generation prompts
4. Deploy updated edge functions

## Impact

- 168 blog posts cleaned in database
- ~1,100 instances fixed in code
- Future AI-generated content will avoid em dashes automatically

