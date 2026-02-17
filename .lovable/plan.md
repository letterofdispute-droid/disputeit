

# Fix: "Create Letter" Button Not Scrolling to Letters Section

## Problem

The "Create Letter" button in the header links to `/#letters`. This fails in two scenarios:

1. **User is already on `/`**: The pathname doesn't change, so React Router doesn't trigger navigation, and nothing happens.
2. **User navigates from another page**: The `ScrollToTop` component forces a scroll to `(0, 0)`, overriding the `#letters` hash anchor.

## Solution

Update `ScrollToTop.tsx` to handle hash-based scrolling. When a URL contains a hash (e.g., `#letters`), scroll to that element instead of scrolling to the top.

## Technical Details

**File: `src/components/ScrollToTop.tsx`**

- Add `hash` from `useLocation()` alongside `pathname`
- When `hash` is present, find the element by ID and call `scrollIntoView({ behavior: 'smooth' })`
- Use a small `setTimeout` to allow the page to render before scrolling
- When no hash is present, keep the existing scroll-to-top behavior

**File: `src/components/layout/Header.tsx`**

- Change the "Create Letter" link from `/#letters` to use an `onClick` handler that manually scrolls when already on the homepage, or navigates + scrolls when on another page. Alternatively, keep the link as-is since the `ScrollToTop` fix will handle it — but add a small guard: if on `/` already, programmatically scroll to `#letters`.

This is a minimal, two-file fix.

