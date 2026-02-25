

# Mega Menu Fix - Compact 3-Column Layout

## Problem

The current 2-column layout at 760px is too wide and overflows the viewport, especially on laptops. The panels extend past the right edge of the screen. The Resources panel with 9 free tools stacks vertically way too long.

## Changes

### Templates & Guides Panel (`CategoryGrid`)
- Switch from **2-column** (`grid-cols-2 w-[760px]`) to **3-column** (`grid-cols-3 w-[620px]`)
- Reduce card padding from `p-4 gap-x-6` to `p-3 gap-x-3`
- Shrink icon container from `size-11` to `size-9` and icon from `size-6` to `size-5`
- Truncate descriptions to shorter text (first sentence fragment)
- 13 items in 3 cols = 5 rows - much more compact vertically

```text
┌────────────────────────────────────────────────────┐
│  (icon) Refunds    (icon) Housing    (icon) Travel │
│  Get money…        Repairs…          Flight…       │
│                                                    │
│  (icon) Damaged    (icon) Utilities  (icon) Finance│
│  ...               ...              ...            │
│  ... 5 rows total for 13 categories ...            │
│ ────────────────────────────────────────────────── │
│  📄 Browse all · 550+        ✨ Not sure? AI help  │
└────────────────────────────────────────────────────┘
```

### Resources Panel
- Reduce width from `w-[760px]` to `w-[580px]`
- Keep 2-column layout (General 5 items + Free Tools 9 items)
- Apply same compact card styling (smaller icons, tighter padding)
- For Free Tools column: use a more compact list style (smaller icon, single-line descriptions)

### Shared Card Styling
- Icon container: `size-9 rounded-lg bg-muted` (down from size-11)
- Icon: `size-5` (down from size-6)
- Card: `flex gap-x-3 rounded-lg p-3 hover:bg-accent/50` (tighter gaps)
- Description text: `text-xs` instead of `text-sm` for compactness

## File Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | Change Templates/Guides to 3-col grid at 620px width; reduce card padding/icon sizes; compact Resources panel to 580px with tighter spacing |

No changes needed to `navigation-menu.tsx` - the viewport component already uses `rounded-3xl` and adapts to content width.

