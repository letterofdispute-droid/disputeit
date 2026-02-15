# Fix: Category Scan Shows 0 Results (Already Scanned)

## Problem

The scan correctly filters by category, but all articles have already been scanned recently. Each scan sets `next_scan_due_at` to 7 days in the future, so subsequent scans find 0 eligible articles and immediately complete with "0 suggestions found."

This is by design to prevent duplicate work, but there's no UI option to force a re-scan.

## Solution

Add a "Force Re-scan" option that resets `next_scan_due_at` for the selected category before starting the scan. This is similar to the existing "Force Re-embed All" button for embeddings.

## Changes

### 1. `SemanticScanPanel.tsx` - Add re-scan logic

Before calling `smartScan()` or `semanticScan()`, reset the `next_scan_due_at` timestamps for the selected category (or all categories). Add a visual indicator showing how many articles are eligible vs already scanned.

### 2. `useSemanticLinkScan.ts` - Add `resetScanTimestamps` mutation

New mutation that sets `next_scan_due_at = NULL` on `article_embeddings` for the given category filter, making all articles eligible for scanning again.

### 3. UI behavior

- Both "Smart Scan (AI)" and "Vector Scan" buttons will automatically reset scan timestamps before starting, so selecting a category and clicking scan always works.
- A small info line will show "X articles eligible / Y total" for the selected category so you can see the scan scope.

## Technical Details

### File: `src/hooks/useSemanticLinkScan.ts`

Add a new mutation:

```typescript
const resetScanTimestampsMutation = useMutation({
  mutationFn: async (categorySlug?: string) => {
    let query = supabase
      .from('article_embeddings')
      .update({ next_scan_due_at: null })
      .eq('embedding_status', 'completed');
    
    if (categorySlug) {
      query = query.eq('category_id', categorySlug);
    }
    
    const { error } = await query;
    if (error) throw error;
  },
});
```

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

- Update `handleSmartScan` and `handleSemanticScan` to call `resetScanTimestamps` first (awaiting it) before triggering the scan.
- Add a scannable articles count query that shows how many articles are in the selected category.