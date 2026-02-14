

# Add Outbound Link Cap Per Article

## Problem

There is no cumulative outbound link cap. The `maxLinksPerArticle = 5` parameter only limits suggestions per scan batch. Running the scan multiple times stacks suggestions without checking how many links an article already has. SEO best practice recommends keeping internal links at roughly 5-10 per article for blog-length content.

## Solution

### 1. Add `max_outbound` enforcement in the edge function

Before generating suggestions for a source article, count its existing approved + applied links. If already at or above the cap, skip it entirely.

**In `scan-for-semantic-links/index.ts`, inside `processOneArticle()`:**
- Query `link_suggestions` for the source article where `status IN ('approved', 'applied')`
- If count >= `maxLinksPerArticle`, return 0 (skip)
- Otherwise, generate only `maxLinksPerArticle - existingCount` new suggestions

This makes the cap cumulative across scan runs.

### 2. Normalize inbound cap

The table default is `max_inbound = 20`, but `generate-embeddings` sets it to `50`. We should align these. Recommended: set both to `20` (SEO best practice -- too many inbound links dilute link equity).

**Database migration:**
- Update all `article_embeddings` rows where `max_inbound = 50` back to `20`
- Fix the `generate-embeddings` function to use `20` instead of `50`

### 3. Make the outbound cap configurable in Advanced Settings

The UI already has an "Advanced Settings" section in `SemanticScanPanel.tsx`. Add a slider for "Max outbound links per article" (range 3-15, default 8) that gets passed to the edge function.

## Technical Details

### Edge function change (`scan-for-semantic-links/index.ts`):

```typescript
// At the start of processOneArticle():
const { count: existingOutbound } = await supabaseAdmin
  .from('link_suggestions')
  .select('id', { count: 'exact', head: true })
  .eq('source_post_id', source.content_id)
  .in('status', ['approved', 'applied']);

const remainingSlots = maxLinksPerArticle - (existingOutbound || 0);
if (remainingSlots <= 0) return 0;

// Then use remainingSlots instead of maxLinksPerArticle for .slice()
```

### Edge function change (`generate-embeddings/index.ts`):

Change `max_inbound: 50` to `max_inbound: 20` (line ~1019).

### Database migration:

```sql
UPDATE article_embeddings SET max_inbound = 20 WHERE max_inbound = 50;
```

### UI change (`SemanticScanPanel.tsx`):

Add a "Max outbound links" slider in the Advanced Settings section (default 8, range 3-15). Pass the value to the edge function call.

## Files changed

- `supabase/functions/scan-for-semantic-links/index.ts` -- add cumulative outbound cap check
- `supabase/functions/generate-embeddings/index.ts` -- fix max_inbound from 50 to 20
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- add outbound cap slider
- 1 database migration (normalize inbound caps)
