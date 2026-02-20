
# Megamenu Visual Redesign — Reference-Matched Card Layout

## What the Reference Images Show (vs. Current)

The reference designs (image-219, image-220, image-221) share a clear visual pattern that's very different from the current implementation:

| Attribute | Current | Reference Target |
|---|---|---|
| Icon size | Tiny (3.5 × 3.5 in a small box) | Large icon tile (~32–40px) with a soft colored/neutral square background |
| Description | 1-line clamp, very short | Full 2-line description — readable, informative |
| Row spacing | Tight `gap-1` / `p-2.5` | Generous — items breathe, ~`py-3` between rows |
| Column headers | Styled "uppercase tracking-wider" labels | Plain gray text, left-aligned, larger than current |
| Item density | 3 columns × 4–5 rows (very packed) | 3 columns × 3 rows max, or 2 columns × 3 rows for resources |
| Hover state | `bg-accent/10` subtle tint | Implied subtle hover, nothing aggressive |
| Overall feel | Dashboard-like, dense | Clean SaaS / product navigation |

## Changes by Menu Panel

### 1 — Letter Templates panel
- Replace `ListItem` with a new `CardItem` component
- Icon: render at `h-8 w-8` inside a `p-2 rounded-xl` tile with the category color tinted background (like `bg-[color]/10`)
- Title: `text-sm font-semibold` (bold, not just medium)
- Description: full `description.split('.')[0]` (first sentence, not just first comma-clause) — shown on 2 lines with `line-clamp-2 text-xs text-muted-foreground mt-0.5`
- Grid: keep 3 columns but increase row gap to `gap-x-2 gap-y-1`
- Each cell padding: `p-3` instead of `p-2.5`
- Remove the inline banner (the "Not sure which letter?" prompt box) and replace with a cleaner footer row that includes both "Browse all templates →" and a "Get AI Help" button inline

### 2 — Guides panel
- Same `CardItem` treatment: large icon with category-colored background, bold title, 2-line description
- Category name used as-is (no string replacement)
- Short description: `category.description.split('.')[0]` (first full sentence, naturally short)
- Grid: 3 columns, generous padding

### 3 — Resources panel
- Restructure as a **2-column card grid** (General + Free Tools side by side), no column headers with uppercase tracking — just plain `text-sm text-muted-foreground font-medium` section labels
- Each item in the `ResourceCardItem` component: larger icon (`h-5 w-5`), bold title, description shown (currently stripped — bring descriptions back since there's space at this card size)
- Popular State Laws: move to a thin `border-t` footer strip at bottom of the panel, displaying CA / TX / NY / FL as inline chips → "Browse all 50 →"
- Overall panel width stays `w-[520px]`

## Component Changes

### New `CardItem` component (replaces `ListItem` for Templates + Guides)
```text
- Large icon in colored rounded tile
- Bold title
- 2-line description
- Generous padding
- Hover: subtle bg tint + slight shadow or border change
```

### Updated `ResourceCardItem` component (replaces `ResourceListItem`)
```text
- Icon: h-5 w-5 in a soft gray/primary-tinted tile
- Title: font-semibold
- Description: shown (text-xs text-muted-foreground), 1-line clamp
- Layout: flex row, icon left, text right
- Padding: py-2.5 px-3
```

## File Changed

Only `src/components/layout/MegaMenu.tsx` — no data files, no routing, no new files.

## Detailed Steps

1. Add `CardItem` component at top of file — `icon`, `title`, `description`, `href` props, with large icon tile using category color
2. Add `ResourceCardItem` component — `icon`, `title`, `description`, `href`, icon in neutral soft-tinted square
3. **Letter Templates panel**: Replace `<ListItem>` with `<CardItem>`, pass `description={category.description.split('.')[0]}`, replace the `bg-primary/5 rounded-lg border` banner with a clean 2-button footer row (Browse all | AI Help)
4. **Guides panel**: Replace inline `<Link>` blocks with `<CardItem>`, pass `description={category.description.split('.')[0]}`, remove the top pick banner or convert to a slim 1-line footer note
5. **Resources panel**: Replace `<ResourceListItem>` with `<ResourceCardItem>` bringing back descriptions, move Popular State Laws to a bottom `border-t` strip of inline chips
6. Ensure all panels retain `max-h-[calc(100vh-5rem)] overflow-y-auto` safety guard
