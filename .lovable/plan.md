

# Plan: Fix Small Claims Page -- Hero + Real SVG Map + Polish

## Problem

1. **Hero looks terrible** -- dark overlay on a background image creates poor contrast and feels dated compared to the clean homepage hero
2. **US Map is ugly** -- uses crude hand-drawn rectangular shapes instead of proper geographic state outlines
3. **General polish** -- the page could use some refinement

---

## Task 1: Fix the Hero Section

Replace the dark background-image hero with a clean, modern hero matching the homepage pattern (light background, geometric accents, proper typography).

**Changes to `src/pages/SmallClaimsPage.tsx`:**
- Remove the `bg-[var(--gradient-hero)]` dark hero with background image overlay
- Use a clean light hero with geometric background elements (circles, subtle lines) matching the homepage `Hero.tsx` pattern
- Fix button styling -- use `variant="accent"` for primary CTA, clean `variant="outline"` for secondary
- Add subtle animations (`animate-fade-in`, `animate-fade-up`)

---

## Task 2: Replace US Map with Real SVG

Copy the uploaded `us.svg` (from simplemaps.com, free for commercial use) into the project assets and rebuild `USMap.tsx` to use the real geographic paths.

**Steps:**
- Copy `user-uploads://us.svg` to `public/images/us-map.svg` (for reference/attribution)
- Rewrite `src/components/small-claims/USMap.tsx` to extract the real SVG path `d` attributes from the uploaded file for all 50 states + DC
- Each state path uses the proper `id` attribute (MA, NY, CA, etc.) that matches `smallClaimsData` codes
- Keep the same interactive behavior: hover tooltips, click-to-navigate, color coding by filing limit
- The map will look like an actual US map instead of crude rectangles

**Technical approach:**
- Extract all `<path>` elements from the uploaded SVG (each has `id="XX"` matching state codes)
- Store the `d` attribute strings in a `STATE_PATHS` record, replacing the current crude ones
- Use the same `viewBox="0 0 1000 589"` from the source SVG
- Apply fill colors based on filing limits, with hover/active states
- Keep tooltips and navigation

---

## Task 3: General Polish

- Clean up spacing between hero and "What Is Small Claims Court" section
- Ensure the map section has a subtle background to visually separate it
- Make the legend more compact on mobile

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/SmallClaimsPage.tsx` | Replace dark hero with clean light hero |
| `src/components/small-claims/USMap.tsx` | Replace crude paths with real SVG state paths from uploaded file |

