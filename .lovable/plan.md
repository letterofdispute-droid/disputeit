
# Fix: Sync Link Suggestion Counts

## Problem

Two different numbers are displayed:
- **"4,233 link suggestions found"** -- from the last scan job's `total_suggestions` field (only counts what that one job discovered)
- **"Pending: 6,344"** -- the actual database count of all pending suggestions across all scan jobs

Both numbers are technically correct, but they represent different things. This is confusing.

## Solution

Update the scan completion message to clarify it shows the job-specific count, and also display the total pending count for context.

## Changes

### File: `src/components/admin/seo/links/SemanticScanPanel.tsx`

Update the scan completion banner (around line 368) from:

```
Scan complete — 4,233 link suggestions found
```

To:

```
Scan complete — 4,233 new suggestions from this scan
```

This makes it clear that the number refers to the output of the specific scan job, not the total across all scans. The "Pending: 6,344" stat bar below already shows the true total.
