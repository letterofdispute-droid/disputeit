

# Fix: Back Link and Pill Badge on Same Line

## Problem
The back link uses `inline-flex` which keeps it inline with the pill badge `div` (also `inline-flex`). Both elements sit on the same line since the parent is `text-center` and neither element forces a line break. The `mb-8` margin has no visible effect because the pill is right next to it horizontally, not below it.

## Fix
On all three pages, add a wrapping `<div>` around the Link (or change `inline-flex` to just `flex` with `justify-center`) so it becomes a block-level element and forces the pill badge onto the next line.

### Files to change (identical fix in each):
- `src/pages/SmallClaimsEscalationPage.tsx` (line 32)
- `src/pages/SmallClaimsCostCalculatorPage.tsx` (line 33)
- `src/pages/SmallClaimsDemandLetterPage.tsx` (line 32)

### Change
Replace `inline-flex` with `flex justify-center` on the Link className. This makes it a block-level flex container (centered), pushing the pill badge below with the `mb-8` gap.

Before:
```
className="inline-flex items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-8 transition-colors"
```

After:
```
className="flex justify-center items-center gap-1 text-sm text-primary-foreground/60 hover:text-primary-foreground mb-8 transition-colors"
```

