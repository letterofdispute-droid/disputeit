

# Fix: Smarter Backfill -- Only Generate Images Articles Actually Need

## Root Cause

Two problems discovered:

### 1. Generating unnecessary images (1,365 wasted calls)

The backfill is trying to generate `middle_image_2` for ALL articles where it's NULL. But most articles were intentionally generated with only 1 middle image (no `{{MIDDLE_IMAGE_2}}` placeholder in their content). Of the 1,606 "missing" middle_image_2:
- Only **241** actually need it (their content has a `{{MIDDLE_IMAGE_2}}` placeholder)
- **1,365** never needed one -- the AI chose to include only 1 middle image

### 2. CPU timeout (too much work per invocation)

Generating 3 images + 3 alt texts per post = 6 API calls. With 3 posts per batch, that's 18 API calls per invocation, which exceeds the edge function CPU time limit.

## Real missing image counts

| Type | Actually Missing |
|------|-----------------|
| Featured | 465 |
| Middle 1 | 467 (468 minus 1 that has no placeholder either) |
| Middle 2 | 241 (only those with `{{MIDDLE_IMAGE_2}}` in content) |
| **Total** | **~1,173** (not 2,542) |

## Changes

### 1. Edge Function: Only generate images articles actually need

In `backfill-blog-images/index.ts`:

- For **middle_image_2**: only generate if the article content contains `MIDDLE_IMAGE_2` placeholder
- For **middle_image_1**: only generate if the article content contains `MIDDLE_IMAGE_1` placeholder (nearly all do)
- Reduce batch size from 3 to **1 article per invocation** to avoid CPU timeout
- Skip the separate alt-text API call -- just use the article title as alt text (saves CPU time)
- Keep the self-chaining pattern

### 2. Status query: Reflect actual missing counts

Update the status mode to check content for placeholders, giving accurate counts:

```sql
-- Accurate missing middle_image_2 count
SELECT COUNT(*) FROM blog_posts 
WHERE status = 'published' 
  AND middle_image_2_url IS NULL 
  AND content LIKE '%MIDDLE_IMAGE_2%'
```

### 3. UI: No changes needed

The `ImageBackfillCard` already displays whatever counts the function returns.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/backfill-blog-images/index.ts` | Check content for placeholders before generating middle images; reduce batch to 1; remove alt-text API call; fix status query |

