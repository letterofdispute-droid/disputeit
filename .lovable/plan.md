

# Fix: White Screen Caused by Hook Order Violation

## Root Cause
In `StateRightsCategoryPage.tsx` (line 103-105), there's an early `return <Navigate>` **before** the `usePageSeo` hook call on line 116. This violates React's Rules of Hooks — hooks must always be called in the same order, never after conditional returns. This causes a runtime error that crashes the entire app, producing a white screen.

## Fix
Move the `usePageSeo` hook call above the early return guard. Pass empty-string fallbacks when parameters aren't available — the hook result won't be used in that case since the component will redirect anyway.

**File:** `src/pages/StateRightsCategoryPage.tsx`
- Move the `usePageSeo` call (currently at line 116-120) to before the guard clause (line 103)
- Use conditional fallback values that don't depend on data computed after the guard

This is likely the only violation since the other pages with early returns (`StateRightsStatePage`, `SmallClaimsStatePage`, `CategoryGuidePage`) already have the hook before the return.

