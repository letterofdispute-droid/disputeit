

# Fix Orphan Articles: Reconcile Counts + Dedicated Orphan Rescue Scan

## The Real Problem

Of the 879 reported orphans, **595 are phantom orphans** -- they already have applied links pointing to them, but the `inbound_count` counter in `article_embeddings` was never updated. Only **281 articles** are truly unlinked. Running the existing `reconcile_link_counts()` database function will immediately fix the phantom 595, dropping the number to ~284.

For the remaining true orphans, we need a dedicated scan that specifically finds and creates inbound links for them.

## Plan

### Step 1: Add "Reconcile Counts" button to the Orphan Alert section

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

Add a "Reconcile Counts" button next to the orphan alert that calls the existing `reconcile_link_counts` RPC. This will:
- Parse actual article HTML to count real inbound/outbound links
- Update `inbound_count` and `outbound_count` in `article_embeddings`
- Immediately reduce the orphan count from 879 to ~284
- Show a toast with results (e.g., "Updated 595 inbound counts, 200 outbound counts")

This button should be available any time orphans are shown, as a quick "re-sync" action.

### Step 2: Create a dedicated "Rescue Orphans" edge function

**New file: `supabase/functions/rescue-orphans/index.ts`**

This function specifically targets orphan articles (inbound_count = 0) and finds articles that should link TO them using reverse semantic matching. Key differences from the general scan:

- **Only processes orphan targets** -- queries `article_embeddings` where `inbound_count = 0`
- **Creates reverse suggestions only** -- for each orphan, finds semantically similar articles that could link TO the orphan
- **Respects existing link caps** -- checks the source article's outbound count before suggesting
- **Uses the same self-chaining pattern** for reliability
- **Tracked via `semantic_scan_jobs`** with a sentinel category `__rescue_orphans__`
- **Does NOT touch or re-scan existing links** -- only adds new inbound suggestions for orphans

The flow:
1. Fetch a batch of orphan articles (those with embeddings + inbound_count = 0)
2. For each orphan, use `match_semantic_links` RPC to find similar articles
3. For each candidate source, check outbound cap and create a reverse suggestion
4. Self-chain until all orphans are processed

### Step 3: Add "Rescue Orphans" button to the UI

**File: `src/components/admin/seo/links/SemanticScanPanel.tsx`**

In the orphan alert section, add a "Rescue Orphans" button that:
- Calls the new edge function
- Shows progress via the existing scan job polling mechanism
- Is disabled when a scan is already running

### Step 4: Wire up the hook

**File: `src/hooks/useSemanticLinkScan.ts`**

Add a new mutation for the orphan rescue function and expose it.

### Step 5: Register the edge function

**File: `supabase/config.toml`**

Add `[functions.rescue-orphans]` with `verify_jwt = false`.

## Recommended Workflow After Implementation

1. Click **"Reconcile Counts"** first -- this will drop orphans from 879 to ~284 instantly
2. Click **"Rescue Orphans"** -- this scans only those ~284 true orphans and creates inbound suggestions
3. Review and approve the new suggestions in the Link Review tab
4. Apply the approved links

## Technical Details

### Reconcile button (SemanticScanPanel.tsx)

- Calls `supabase.rpc('reconcile_link_counts')` directly
- Shows loading state and result toast
- Refreshes orphan list and embedding stats after completion

### Rescue Orphans function (rescue-orphans/index.ts)

```
For each orphan (inbound_count = 0, has embedding):
  1. Use orphan's embedding to find similar articles via match_semantic_links
  2. For each candidate:
     - Skip if candidate IS the orphan
     - Skip if candidate outbound count >= maxLinksPerArticle
     - Skip if suggestion already exists (source -> orphan)
     - Select quality anchor text from orphan's anchor_variants
     - Create link_suggestion: source=candidate, target=orphan
  3. Update orphan's next_scan_due_at to prevent re-processing
  4. Track progress via semantic_scan_jobs
```

Batch size: 10 orphans per invocation, self-chains until done.

### Files Changed
- `src/components/admin/seo/links/SemanticScanPanel.tsx` -- add Reconcile + Rescue buttons
- `src/hooks/useSemanticLinkScan.ts` -- add rescue mutation + reconcile mutation
- `supabase/functions/rescue-orphans/index.ts` -- new edge function
- `supabase/config.toml` -- register new function
