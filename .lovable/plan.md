

# Pre-Flight Audit: Apply Links to Articles

## Critical Bug Found: Wrong URL for Cross-Category Links

After reviewing the entire `apply-links-bulk` edge function line by line, I found **one critical bug** that would produce **broken links (404s)** on your site.

### The Bug

When building the URL for an article link, the function uses the **source** article's `category_slug` instead of the **target** article's category. This means if an article in "legal-tips" links to an article in "consumer-rights", the generated link would be:

```
/articles/legal-tips/some-consumer-rights-article  (WRONG - 404)
```

instead of:

```
/articles/consumer-rights/some-consumer-rights-article  (CORRECT)
```

**Impact:** 1,532 out of 28,334 approved suggestions would get the wrong URL. That's ~5.4% of all links leading to 404 pages.

**Root cause:** Line 451 passes `suggestion.blog_posts?.category_slug` (the source post's category) to `buildTargetUrl`, but the target article's actual category is available in `suggestion.article_embeddings.category_id` (already fetched but unused for the URL).

### The Fix

In `supabase/functions/apply-links-bulk/index.ts`, change the `buildTargetUrl` call to use the target's category from `article_embeddings`:

```typescript
// BEFORE (line 451):
const targetUrl = buildTargetUrl(suggestion, suggestion.blog_posts?.category_slug);

// AFTER:
const targetEmbed = (suggestion as any).article_embeddings;
const targetCategorySlug = targetEmbed?.category_id || suggestion.blog_posts?.category_slug || 'general';
const targetUrl = buildTargetUrl(suggestion, targetCategorySlug);
```

This is a 2-line change in the edge function.

## Everything Else Checks Out

Here is the full audit of what's already working correctly:

### Server-Side Reliability
- Self-chaining with retry (2 attempts, 3-second delay, 10-second abort timeout)
- `try/finally` blocks guarantee the next batch is triggered even if current crashes
- `pg_cron` recovery job auto-resumes stalled jobs after 5 minutes
- Stuck apply jobs (>10 min) are auto-cancelled before new runs start

### Data Integrity
- If a database save fails after marking suggestions "applied", they revert to "approved" (lines 524-533)
- Suggestions that can't find a suitable insertion point are rejected with a reason (line 480)
- Outbound link cap enforced per article -- excess suggestions rejected (lines 403-414)
- Duplicate link prevention: checks `content.includes(href=targetUrl)` before inserting (line 303)
- Atomic counter increments for inbound/outbound counts via RPC

### Link Quality
- Paragraphs must be at least 40 chars, not first or last paragraph
- Max 2 existing links per paragraph before skipping
- Generated sentences use Gemini Flash-lite with tone/quality validation
- Anchor phrases validated for 2-6 word length

### Pillar Content
- Pillar articles automatically get a CTA link to their template (lines 496-513)
- Template URL format `/templates/{slug}` -- NOTE: this is a latent bug for future template-type suggestions (they need `/templates/:category/:subcategory/:slug`), but currently all 28,334 approved suggestions are type "article" so it won't affect this run

## Summary

| Check | Status |
|-------|--------|
| Error handling and retries | OK |
| Data rollback on save failure | OK |
| Outbound link cap enforcement | OK |
| Duplicate link prevention | OK |
| Self-chaining reliability | OK |
| Link insertion quality | OK |
| Article URL generation | BUG -- uses source category instead of target category |
| Template URL generation | Latent bug (not triggered by current data) |
| Pillar CTA injection | OK |

## Files to Edit

1. **`supabase/functions/apply-links-bulk/index.ts`** -- Fix `buildTargetUrl` call to use target article's category from `article_embeddings.category_id` instead of source post's `category_slug`

