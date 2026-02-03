
# Fix: Step Number Badges Being Cut Off

## Problem
The yellow step number badges (01, 02, 03, 04) are being cut off at the top of the cards because:
1. The badge uses `absolute -top-4` positioning (16px above the card boundary)
2. The card has `overflow-hidden` which clips anything outside its bounds

## Solution
Move the step number badge outside the overflow-hidden container, or remove overflow-hidden and redesign the card structure.

**Recommended approach:** Restructure the StepCard so the badge sits **outside** the card container that has `overflow-hidden`, giving it proper space to render.

## Changes Required

### File: `src/components/home/HowItWorks.tsx`

**Current structure:**
```
<div className="relative group"> (outer wrapper)
  └── <div className="relative bg-card overflow-hidden"> (card - clips badge!)
        └── <div className="absolute -top-4"> (badge - INSIDE, gets clipped)
```

**New structure:**
```
<div className="relative group pt-5"> (outer wrapper with top padding for badge)
  ├── <div className="absolute -top-1 left-1/2 z-10"> (badge - OUTSIDE card)
  └── <div className="relative bg-card overflow-hidden"> (card - no longer clips badge)
```

**Specific changes:**
1. Add `pt-5` to the outer wrapper div to create space for the badge
2. Move the step number badge div to be a sibling of the card (not inside it)
3. Position the badge with `absolute -top-1` and add `z-10` to ensure it's above the card
4. Remove the badge from inside the card's padding area

This ensures the badge floats above the card visually without being clipped by overflow-hidden.
