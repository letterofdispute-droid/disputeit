

# Fix: Allow Scan to Resume Instead of Always Restarting

## Problem

The recent fix (auto-reset `next_scan_due_at` before every scan) means clicking Smart Scan always restarts from the beginning instead of continuing from where it stopped. Your 2,095 suggestions are safe, but a new scan would re-process all articles unnecessarily.

## Solution

Add a "Force Re-scan" checkbox (default OFF) so that:
- **OFF (default)**: Scan picks up only unprocessed articles -- perfect for resuming after a credit interruption
- **ON**: Resets all timestamps first, re-scanning everything from scratch

## Changes

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

1. Add a `forceRescan` state variable (default `false`)
2. Add a checkbox labeled "Force re-scan (ignore cooldown)" below the category dropdown
3. Update `handleSmartScan` and `handleSemanticScan` to only call `resetScanTimestamps` when `forceRescan` is `true`

**Before:**
```typescript
const handleSmartScan = async () => {
  const cat = scanCategory !== 'all' ? scanCategory : undefined;
  await resetScanTimestamps(cat);  // Always resets
  smartScan({ categorySlug: cat, maxLinksPerArticle: maxOutboundLinks });
};
```

**After:**
```typescript
const handleSmartScan = async () => {
  const cat = scanCategory !== 'all' ? scanCategory : undefined;
  if (forceRescan) {
    await resetScanTimestamps(cat);
  }
  smartScan({ categorySlug: cat, maxLinksPerArticle: maxOutboundLinks });
};
```

Same change for `handleSemanticScan`.

4. Add a small checkbox UI element:
```tsx
<div className="flex items-center gap-2 mt-2">
  <Checkbox checked={forceRescan} onCheckedChange={setForceRescan} />
  <label className="text-sm text-muted-foreground">
    Force re-scan (ignore 7-day cooldown)
  </label>
</div>
```

## What This Means for You

- **Right now**: Leave the checkbox OFF, select your category, click Smart Scan -- it will resume from where it stopped and only process the remaining articles
- **Later**: If you want to re-scan everything fresh, check the box first
- Your existing 2,095 suggestions are safe in the database regardless

