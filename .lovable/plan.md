

# Articles Page Redesign - Hero Latest Article Layout

## Overview

Redesign the `/articles` page to feature the most recent article as a prominent full-width hero card at the top, followed by a clean grid of remaining articles below. This creates a magazine-style layout that immediately draws attention to the newest content.

## Design Concept

```text
┌─────────────────────────────────────────────────────┐
│  Hero Section (Knowledge Center heading)            │
└─────────────────────────────────────────────────────┘
│  Category Filter Badges                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────┬───────────────────────┐    │
│  │                     │  Category Badge        │    │
│  │   Featured Image    │  LATEST ARTICLE TITLE  │    │
│  │   (large)           │  Excerpt text...       │    │
│  │                     │  Author · Date · Read  │    │
│  │                     │  [Read Article →]      │    │
│  └─────────────────────┴───────────────────────┘    │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Article  │  │ Article  │  │ Article  │          │
│  │ Card 2   │  │ Card 3   │  │ Card 4   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Card 5   │  │ Card 6   │  │ Card 7   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Pagination                                         │
└─────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Latest Article Hero Card
- The most recent article (first in the list) gets a full-width, two-column card layout
- Left side: large featured image with hover zoom effect
- Right side: category badge, title (larger font), full excerpt, author info, date, read time, and a prominent "Read Article" button
- On mobile: stacks vertically (image on top, content below)

### 2. Remove Separate "Featured Articles" Section
- Currently there are two separate sections: "Featured Articles" and "Latest Articles"
- Merge into one flow: the latest article is the hero, everything else follows in the grid
- Featured badge still shown on articles marked as featured, but no separate section

### 3. Improved Article Cards in Grid
- Add subtle hover elevation and border-primary accent on hover
- Ensure consistent card heights with line-clamped titles (2 lines) and excerpts (2 lines)
- Author name shown on each card

### 4. Visual Polish
- Add a subtle gradient overlay on the hero card image for better text contrast if text overlaps
- Slightly reduce hero section padding to bring content higher
- Add "Most Recent" label/badge on the hero card

## Technical Details

### File: `src/pages/ArticlesPage.tsx`
- Extract the first post from `posts` array as `latestPost`
- Remaining posts go into paginated grid (skip first post on page 1)
- Replace the separate featured/regular sections with:
  1. A hero card component for `latestPost` (only on page 1)
  2. A unified grid for the rest
- The hero card uses a `grid grid-cols-1 md:grid-cols-2` layout with the image on the left and content on the right

### No new files needed
All changes are contained within `ArticlesPage.tsx`.

