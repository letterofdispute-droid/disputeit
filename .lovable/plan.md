

# Fix Middle Images Overflowing on Mobile

## Problem

On mobile screens, middle images inside blog articles extend beyond the right edge of the viewport. This happens because the `.article-middle-image` figure element doesn't have proper width constraints and the prose container may not handle overflow correctly on small screens.

## Solution

Add width constraints and overflow protection to the `.article-middle-image` class in `src/index.css`:

1. Add `max-width: 100%` and `overflow-hidden` to the `.article-middle-image` container
2. Add `box-sizing: border-box` to ensure padding/borders don't cause overflow
3. Ensure the prose container itself clips overflow on mobile

**File: `src/index.css`** (lines ~217-222)

Update the `.article-middle-image` styles:
```css
.article-middle-image {
  @apply my-10 rounded-xl overflow-hidden shadow-lg max-w-full box-border;
}
.article-middle-image img {
  @apply w-full h-auto my-0 block;
}
```

Also add a mobile safety rule for the prose container to prevent any child from exceeding viewport:
```css
.prose {
  @apply overflow-x-hidden max-w-full;
}
```

This is a CSS-only fix -- no component changes needed.

