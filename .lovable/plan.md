

# Emergency: Restore 24,000+ Stripped Links and Fix Scanner

## Damage Assessment

- 5,406 posts had their content modified by the scanner
- ~24,440 internal links were stripped (removed the `<a>` tag, kept text)
- Average posts should have ~6.8 outbound links; most now have 0-2
- The `article_embeddings.outbound_count` is now out of sync (shows old counts)

## Restoration Strategy

Since the database content was modified in place and there's no content versioning, we need a two-phase approach:

### Phase 1: Immediate -- Disable the Scanner's Fix Mode

Modify the edge function to **refuse "fix" mode entirely** for now. Make it scan-only so no more damage can occur.

### Phase 2: Re-Add Links Using Semantic Scan System

The project already has a robust semantic linking pipeline:
1. `scan-for-semantic-links` -- finds link opportunities using vector embeddings
2. `link_suggestions` table -- stores approved link candidates
3. `apply-links-bulk` -- inserts links into article content

**Restoration plan:**
1. Create a new edge function `restore-stripped-links` that:
   - Targets all 5,406 modified posts (identified by `updated_at > 2 hours ago`)
   - For each post, triggers a semantic scan to find link opportunities
   - Auto-approves suggestions with relevance >= 70
   - Applies them in batches
2. This won't be an exact restoration but will re-add meaningful, validated internal links based on actual content relevance

### Phase 3: Reconcile Link Counters

Run the existing `reconcile_link_counts` RPC to sync `article_embeddings.outbound_count` with actual link counts in post content.

### Phase 4: Fix the Scanner Permanently

Rewrite the scanner to be **read-only by default**:
- Remove Pattern 10 entirely (orphan stripping was the destructive pattern)
- Remove `stripAnchorTag` function -- the scanner should NEVER delete content
- The scanner's only job: detect old URL patterns (`/blog/`, `/category/`, absolute URLs) and rewrite them to correct relative paths
- Add a hard safeguard: if more than 50 links would be stripped in a single batch, abort

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/fix-broken-links/index.ts` | Remove Pattern 10, remove stripAnchorTag, add safety limit, make scan-only default |
| `supabase/functions/restore-stripped-links/index.ts` | NEW: batch re-scan affected posts via semantic scan, auto-approve + apply links |
| `src/components/admin/seo/BrokenLinkScanner.tsx` | Add "Restore Links" button for affected posts, remove stripped stat, add safety warnings |

## Execution Order

1. Deploy fixed scanner (prevents more damage)
2. Reconcile link counters (sync outbound_count with reality)  
3. Run semantic re-scan on all 5,406 affected posts (restores links)
4. Apply approved suggestions in bulk

## Technical Details

### restore-stripped-links edge function

```text
For each batch of 50 affected posts:
  1. Query posts WHERE updated_at > cutoff_time
  2. For each post, invoke scan-for-semantic-links with postId
  3. Auto-approve suggestions with relevance >= 70
  4. Self-chain to next batch
```

### Safety guardrails for fixed scanner

- Maximum 10 links can be modified per post per run
- No stripping -- only URL pattern rewrites
- Dry-run (scan) mode is the ONLY mode; "fix" requires explicit confirmation parameter
- Log every change for audit trail

