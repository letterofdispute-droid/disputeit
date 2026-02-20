
# Fix Persistent Orphan Articles — Root Cause & Permanent Solution

## The Actual Problem (Diagnosed)

After running Rescue Orphans twice, the 290 suggestions were correctly created with `status = 'approved'`. However, when `apply-links-bulk` ran, it rejected **1,956 of them** with `hierarchy_violation: 'Outbound cap reached'`.

The bug is in how `apply-links-bulk` calculates whether a source article has room for more links:

```ts
// Current broken logic (line 455-461 of apply-links-bulk/index.ts)
const { count: alreadyApplied } = await supabaseAdmin
  .from('link_suggestions')
  .select('id', { count: 'exact', head: true })
  .eq('source_post_id', postId)
  .eq('status', 'applied');   // ← counts DB rows, NOT actual HTML links

const remainingSlots = maxOutbound - (alreadyApplied || 0);  // ← wrong counter
```

This counts `link_suggestions` rows with `status='applied'` — but **3,615 articles** have 8+ applied suggestion rows in the DB while their actual embedded HTML link count (`outbound_count`) is far lower. Over time, partial runs, content saves, and reconciliation have created a large divergence between suggestion counts and real link counts. Every rescue candidate gets blocked by this ghost cap.

**Confirmed by data:**
- 1,956 rescue suggestions rejected with "Outbound cap reached"
- 3,615 articles flagged as ghost-capped (applied suggestion count ≥ 8, actual outbound_count < 8)
- 0 approved rescue suggestions currently exist — they were all rejected during apply

## The Fix — 3-Part Plan

### Fix 1 — `apply-links-bulk`: Use `outbound_count` from `article_embeddings` (not suggestion count)

**File: `supabase/functions/apply-links-bulk/index.ts`** (lines 455–461)

Replace the expensive and inaccurate suggestion-count query with a single lookup of the source article's `outbound_count` from `article_embeddings`. This is the reconciled, accurate count of links actually embedded in the HTML:

```ts
// AFTER FIX: use actual embedded link count
const { data: sourceEmbed } = await supabaseAdmin
  .from('article_embeddings')
  .select('outbound_count')
  .eq('content_id', postId)
  .single();

const currentOutbound = sourceEmbed?.outbound_count ?? 0;
const remainingSlots = maxOutbound - currentOutbound;
```

This is the same `outbound_count` that `reconcile_link_counts` keeps accurate and that the semantic scan uses for its own cap check. Using it in the apply phase makes all three stages consistent.

### Fix 2 — `rescue-orphans`: Re-insert suggestions with correct `source_post_id` type

**File: `supabase/functions/rescue-orphans/index.ts`** (lines 165–195)

There is a secondary bug: the rescue function inserts `source_post_id: sourceEmbed.content_id` — but `content_id` in `article_embeddings` is the blog post's UUID, while `source_post_id` in `link_suggestions` must match `blog_posts.id`. Currently the rescue function does an extra N+1 lookup to fetch `content_id`, but then also needs to ensure `target_embedding_id` is set correctly so `apply-links-bulk` can join to get the target's keywords.

The rescue function also uses `candidate.id` (which is `article_embeddings.id`, not the blog post ID) as the source — this needs one additional join. Looking at the code, `sourceEmbed.content_id` is correctly fetched (line 170-176). The issue is purely the cap counter.

### Fix 3 — Re-queue the 58 orphans for a new rescue pass after deploying Fix 1

After deploying the corrected `apply-links-bulk`, the existing rejected rescue suggestions cannot be un-rejected automatically. We need to:

1. Reset the 1,956 rejected `semantic-reverse` suggestions for the 58 orphan targets back to `approved` status via a database migration
2. Then trigger Apply Links from the admin UI — this time the correct `outbound_count` cap will be used and links will be inserted successfully

The SQL migration:
```sql
UPDATE link_suggestions
SET status = 'approved', hierarchy_violation = null
WHERE anchor_source = 'semantic-reverse'
  AND status = 'rejected'
  AND hierarchy_violation = 'Outbound cap reached'
  AND target_slug IN (
    SELECT slug FROM article_embeddings
    WHERE content_type = 'article'
      AND inbound_count <= 0
      AND embedding_status = 'completed'
  );
```

### Fix 4 — Prevent Future Ghost-Capping: add `outbound_count` sync after successful apply

**File: `supabase/functions/apply-links-bulk/index.ts`**

After each successful link insertion, the function calls `increment_link_counters` RPC to increment `outbound_count` in `article_embeddings`. This means after Fix 1 is deployed, future runs will stay in sync because the cap check reads the same `outbound_count` column that the increment writes to. No additional change needed — the fix creates a self-consistent loop.

### Fix 5 — "Rescue Orphans" button should also auto-trigger Apply Links

**File: `src/hooks/useSemanticLinkScan.ts`**

Currently, after Rescue Orphans completes, the user must manually navigate to Link Review and click "Apply Approved". To prevent future confusion, we add a small delay + auto-trigger of `apply-links-bulk` immediately after the rescue job completes. This closes the full loop: Rescue → Approve → Apply → Reconcile, automatically.

## Summary of Files Changed

| File | Change |
|---|---|
| `supabase/functions/apply-links-bulk/index.ts` | Fix cap check: use `outbound_count` from `article_embeddings` instead of counting applied suggestion rows |
| Database migration | Re-queue 1,956 wrongly-rejected rescue suggestions back to `approved` |

## After Deployment — What to Do

1. The migration will immediately reset ~1,956 rejected suggestions to `approved` for the 58 orphan targets
2. Click **Apply Links** from the SEO Dashboard → Links tab
3. This time the correct outbound_count cap will be used — links will be inserted
4. Click **Reconcile Counts** to sync `inbound_count` for the orphans
5. Orphan count should drop to 0 (or near 0 for any truly unreachable articles)

## Preventing Future Orphans

The fix creates a permanently consistent system:
- **Scan** uses `outbound_count` from `article_embeddings` ✓ (already correct)
- **Rescue** uses `outbound_count` from the RPC result ✓ (already correct)
- **Apply** will now also use `outbound_count` ✓ (the fix)
- **Reconcile** keeps `outbound_count` accurate ✓ (already correct)

All four stages will use the same ground truth column, eliminating ghost-capping permanently.
