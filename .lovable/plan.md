
# Megamenu Refactor — Fix All 3 Visual Issues

## Problems Identified from Screenshots

### Issue 1 — Letter Templates menu (image-218)
Items display full descriptions which are verbose (e.g. "Dispute poor workmanship, project abandonment, cost overruns, or service issues."). On a 13-column grid, descriptions truncate awkwardly mid-sentence. The `line-clamp-2` allows 2 lines of description but some names already wrap, making rows uneven.

**Fix**: Shorten the description shown in the menu to a tight 1-line version (first 4–5 words with "..."), or switch to icon + name only (no description) for a cleaner, more scannable list. Given the 3-column grid and 13 categories, the cleanest approach is a compact icon + name layout with a short one-line subtext.

### Issue 2 — Guides menu (image-216)
The `category.name.replace(' & ', ' ')` transform creates awkward names ("Utilities Telecommunications", "Contractors Home Improvement"). The `line-clamp-1` on the description (which uses `.split('.')[0]`) truncates mid-word. Items with 2-line names (Utilities Telecommunications, E-commerce Online Services) misalign the grid.

**Fix**: Keep the `&` in category names. Switch descriptions to a pre-defined short tagline (3–5 words) that never wraps, e.g. "Billing & service disputes". Use `line-clamp-1` only on the short tagline, not the full description.

### Issue 3 — Resources menu (image-217)
The right column stacks: 4 Free Tools (with descriptions) + "Popular State Laws" header + 6 state links + "Browse all" = exceeds viewport height on a 14" laptop (~768px). The last 1–2 items and the "Browse all 50 states →" link are clipped.

**Fix**: Reduce the Resources menu height by:
- Making Free Tools items use compact single-line layout (title + short description on same line, no block stacking)
- Reducing the state links from 6 to 4 (CA, TX, NY, FL — the 4 most popular)
- Moving "Browse all 50 states →" to be inline rather than a separate list item

## Implementation Plan

### File: `src/components/layout/MegaMenu.tsx`

**Change 1 — Letter Templates grid**: Replace the full `description` prop with a short menu tagline. Add a `menuLabel` field to the ListItem or derive a 40-char truncation. The cleaner approach: define a `SHORT_DESCRIPTIONS` map keyed by category ID, or truncate to first clause before the comma.

Since `templateCategories` doesn't have a short label, the cleanest solution is to truncate descriptions inline: use only the text up to the first comma, or first 40 characters. This avoids touching data files.

**Change 2 — Guides grid**: Remove the `.replace(' & ', ' ')` so names render correctly ("Utilities & Telecommunications"). Use the truncated description approach (first clause) for consistency with the Templates menu.

**Change 3 — Resources menu**: Make the right column more compact:
- Switch `ResourceListItem` for Free Tools to a slim 1-row layout with title and icon (no description paragraph, or inline description)  
- Reduce `notableStateLinks` to 4 entries: CA, TX, NY, FL
- Keep "Browse all 50 states →" as the 5th item inline

**Change 4 — Resources menu max-height**: Add `max-h-[calc(100vh-80px)] overflow-y-auto` on the content `div` as a safety net so it can never overflow the viewport.

## Exact Changes

```text
File: src/components/layout/MegaMenu.tsx
```

1. **`notableStateLinks`** — trim from 6 to 4 entries (remove MA, IL)

2. **`ResourceListItem` component** — remove the description `<p>` block to make each item a single compact row (icon + title), keeping it clean and short

3. **Letter Templates `NavigationMenuContent`** — in the `<ul>` grid, pass only `title` and `icon` (no description) so each cell is compact and uniform height. Add `description` back as a tooltip or keep a truncated version (first sentence only, max 50 chars via slice)

4. **Guides `NavigationMenuContent`** — fix the `.replace(' & ', ' ')` → keep category name as-is. Use truncated description (before first comma)

5. **Resources outer div** — add `max-h-[calc(100vh-5rem)] overflow-y-auto` so it can never clip

6. **Resources Free Tools section** — switch to compact single-line items (icon + title, no description) since descriptions are already shown on the actual pages

## Summary Table

| Menu | Issue | Fix |
|---|---|---|
| Letter Templates | Long descriptions make rows uneven, last item overflows | Remove/truncate descriptions in grid cells |
| Guides | `replace()` strips `&`, `line-clamp-1` on long text clips mid-word | Keep `&`, use short first-clause text |
| Resources | Right column too tall, clips Popular State Laws section | Compact Free Tools items, reduce state list to 4, add max-height safety net |

No data files, no new components, no routing changes — only `MegaMenu.tsx` is touched.
