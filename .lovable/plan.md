

# Fix Category Scan Status for Cooldown-Skipped Scans

## What happened

Your Legal Tips scan **did run** -- it found 518 articles but processed 0 because all 518 were already scanned within the last 7 days (from an earlier "All Categories" run). The scan completed successfully but skipped everything due to the cooldown.

The problem is the status indicator misclassifies this:
- Status = "completed" + processed (0) < total (518) = shows as **"partial"** (orange warning) or **"—"** (if query hasn't refreshed)
- It should show as **"scanned"** (green check) because these articles genuinely have been scanned already

## Changes

### 1. Fix status classification logic (`SemanticScanPanel.tsx`)

**Current logic** (broken):
```
isComplete = status === 'completed'
isPartial = status === 'failed' || processed_items < total_items
isComplete = isComplete && !isPartial  // Always false when skipped!
```

**Fixed logic**: A completed job where items were skipped due to cooldown is still "complete" -- the articles were scanned previously. Only mark as "partial" if the job actually **failed**:

```typescript
const isComplete = job.status === 'completed';
const isPartial = job.status === 'failed' && job.processed_items < job.total_items;
```

This means:
- Completed + 0 processed (cooldown skip) = green check "scanned"
- Completed + all processed = green check "scanned"  
- Failed + partial progress = orange warning "partial"

### 2. Show "skipped (cooldown)" in status summary

When a completed scan processed 0 items but had total > 0, show a more informative message:
> "All 518 articles skipped (within 7-day cooldown). Use Force re-scan to override."

### 3. Better scan completion message

When the "Scan complete" banner shows "0 new suggestions / Scanned 0 articles", clarify that articles were skipped:
> "Scan complete -- all articles within cooldown period. Check Force re-scan to override."

## Files to edit

- **src/components/admin/seo/links/SemanticScanPanel.tsx** -- Fix `getCategoryScanInfo` classification, update status summary text, improve completion banner message

## To actually scan Legal Tips

You need to check the **"Force re-scan"** checkbox before clicking Smart Scan or Vector Scan. That resets the 7-day cooldown timestamps so the scan will process all 518 articles.
