

# Fix: Mega Menu Right-Edge Clipping

## Problem
The 980px-wide dropdown panel overflows the right side of the viewport. The third column's text is cut off (e.g., "Healthcare & Medical Bill..." instead of "Healthcare & Medical Billing").

## Root Cause
In `src/components/ui/navigation-menu.tsx`, the `NavigationMenuViewport` wrapper uses `left-0`, which anchors the dropdown to the left edge of the `NavigationMenu` component. Since the nav menu isn't flush with the left edge of the screen, the 980px panel extends past the right viewport edge.

## Fix

### File: `src/components/ui/navigation-menu.tsx`
Change the viewport wrapper's positioning from `left-0` to `right-0` (or use a negative left offset) so the panel stays within the viewport:

```tsx
// Current:
<div className={cn("absolute left-0 top-full flex justify-center")}>

// Change to:
<div className={cn("absolute left-1/2 -translate-x-1/2 top-full flex justify-center")}>
```

This centers the dropdown relative to the navigation menu, preventing right-edge overflow. If the nav is too far right for centering to work, an alternative is to simply use `right-0` to anchor to the right edge instead.

### No changes needed to `MegaMenu.tsx`
The 980px width is fine — the issue is purely about viewport positioning.

| File | Change |
|------|--------|
| `src/components/ui/navigation-menu.tsx` | Update viewport wrapper from `left-0` to centered positioning (`left-1/2 -translate-x-1/2`) |

