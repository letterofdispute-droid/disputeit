

# Add Scan Status Indicators to Category Selector

## What it does

Adds a visual indicator next to each category in the "Scan Category" dropdown showing whether it has been scanned, partially scanned, or never scanned. This lets you instantly see which categories still need attention.

## Visual Design

Each category in the dropdown will show a status badge:

- **Green checkmark + date**: Fully scanned (e.g., "Contractors ✓ Today")
- **Orange warning**: Partially scanned / failed (e.g., "Consumer Rights ⚠ 1845/2752")
- **No badge**: Never scanned

## Technical Changes

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

1. **Add a query** to fetch the latest scan job per category from `semantic_scan_jobs` (grouped by `category_filter`, taking the most recent completed or failed job)

2. **Update the category dropdown items** to render status indicators inline:
   ```
   Contractors                    ✓ scanned
   Consumer Rights               ⚠ partial
   Industry News                 — not scanned
   ```

3. **Show a summary below the dropdown** when a category is selected, e.g.:
   - "Last scanned: Today at 14:45 — 21 suggestions found"
   - "Never scanned" for unscanned categories
   - "Scan failed at 1,845 / 2,752 articles" for partial scans

### Query for scan history per category:
```typescript
const { data: categoryScanStatus } = useQuery({
  queryKey: ['category-scan-status'],
  queryFn: async () => {
    const { data } = await supabase
      .from('semantic_scan_jobs')
      .select('category_filter, status, total_items, processed_items, total_suggestions, completed_at')
      .neq('category_filter', '__apply_links__')
      .not('category_filter', 'is', null)
      .in('status', ['completed', 'failed'])
      .order('created_at', { ascending: false });
    
    // Group by category, keep only the latest job per category
    const statusMap = new Map();
    for (const job of data || []) {
      if (!statusMap.has(job.category_filter)) {
        statusMap.set(job.category_filter, job);
      }
    }
    return statusMap;
  },
  staleTime: 30000,
});
```

### Updated dropdown rendering:
Each `SelectItem` will include a small status indicator (checkmark, warning, or dash) and a brief label like "scanned" or "partial" using muted text on the right side.

### Selected category info line:
Below the dropdown, a single line of text shows the scan status for the currently selected category, so you don't have to open the dropdown to check.

## Result

- At a glance, you can see which of your 6 categories have been scanned
- The dropdown shows green checkmarks for completed scans, orange warnings for failed/partial ones
- Selecting a category shows its last scan date and suggestion count
- No new database tables or columns needed -- reads existing `semantic_scan_jobs` data
