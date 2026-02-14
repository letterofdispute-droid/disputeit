

# Fix Remaining Outbound Cap Bypass Issues

## Issues Found

### Issue 1: Reverse suggestions ignore the outbound cap
When Article A is scanned, the bidirectional logic creates reverse suggestions where OTHER articles (B, C, D) become the source. But it never checks if B, C, or D are already at their outbound cap. This is already happening -- one article has 10 pending suggestions (8 forward + 2 reverse), exceeding the configured cap of 8.

### Issue 2: apply-links-bulk has no cap enforcement
The bulk apply function inserts all approved links without checking if a post already has too many applied links. If an admin approves 12 suggestions for one article, all 12 get applied.

## Fix 1: Add outbound cap check to reverse suggestions

In `scan-for-semantic-links/index.ts`, before inserting a reverse suggestion, check how many approved/applied/pending outbound links the candidate article already has. Skip if at or above the cap.

```text
Location: Lines 288-327, inside the reverse loop

Before creating the reverse suggestion for candidateEmbed.content_id:
1. Count existing link_suggestions where source_post_id = candidateEmbed.content_id 
   AND status IN ('approved', 'applied', 'pending')
2. If count >= maxLinksPerArticle, skip this candidate
```

Including 'pending' in the reverse check prevents over-generation even before approval.

## Fix 2: Add outbound cap to apply-links-bulk

In `apply-links-bulk/index.ts`, when processing each post's suggestions, limit how many actually get applied so the total (already-applied + new) does not exceed the cap.

```text
Location: Lines 115-234, inside the per-post loop

Before applying suggestions for a post:
1. Count existing applied links for that post (status = 'applied')
2. Calculate remaining slots = MAX_OUTBOUND (8) - existing applied count
3. Only process up to remainingSlots suggestions for that post
4. Mark excess suggestions as 'rejected' with a reason
```

The cap value (8) should be stored in site_settings so both functions read the same value, or passed as a parameter. Since the edge function already receives parameters, we'll accept an optional `maxOutboundPerArticle` parameter with a default of 8.

## Files Changed

- `supabase/functions/scan-for-semantic-links/index.ts` -- add outbound cap check in the reverse suggestion loop
- `supabase/functions/apply-links-bulk/index.ts` -- add outbound cap enforcement before inserting links

No database migrations needed.

## Technical Details

### scan-for-semantic-links change (reverse loop):

```typescript
// Before creating reverse suggestion, check candidate's outbound count
const { count: candidateOutbound } = await supabaseAdmin
  .from('link_suggestions')
  .select('id', { count: 'exact', head: true })
  .eq('source_post_id', candidateEmbed.content_id)
  .in('status', ['approved', 'applied', 'pending']);

if ((candidateOutbound || 0) >= maxLinksPerArticle) continue;
```

### apply-links-bulk change:

```typescript
// At start of per-post processing loop:
const { count: alreadyApplied } = await supabaseAdmin
  .from('link_suggestions')
  .select('id', { count: 'exact', head: true })
  .eq('source_post_id', postId)
  .eq('status', 'applied');

const MAX_OUTBOUND = maxOutboundPerArticle || 8;
const remainingSlots = MAX_OUTBOUND - (alreadyApplied || 0);

if (remainingSlots <= 0) {
  // Mark all as rejected
  for (const s of postSuggestions) {
    await supabaseAdmin
      .from('link_suggestions')
      .update({ status: 'rejected', hierarchy_violation: 'Outbound cap reached' })
      .eq('id', s.id);
  }
  continue;
}

// Only process up to remainingSlots suggestions (sorted by relevance_score desc)
const cappedSuggestions = postSuggestions
  .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
  .slice(0, remainingSlots);
```
