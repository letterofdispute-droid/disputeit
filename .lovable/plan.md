

# Mega Menu Visual Redesign

## Problem

The current mega menus are visually flat, dense, and stacked. All 13 categories appear in a uniform 3-column grid with identical styling, making it hard to scan. The Resources panel has lopsided columns (5 vs 9 items). Everything blends together with no visual hierarchy.

## Design Approach

### Letter Templates Panel

**Layout**: 4-column compact grid with category-colored left border accents instead of large icon tiles. This reduces vertical height significantly (4 rows instead of 5) and feels more organized.

- Each card: thin left border in category color, icon inline with title (smaller, 16px), description below in muted text
- Add a subtle "Featured" highlight on the first 4 popular categories (slight background tint)
- Footer stays: "Browse all" + "AI Help"

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │▎🧾 Refunds  │ │▎🏠 Housing  │ │▎✈️ Travel   │ │▎📦 Damaged  │  │
│  │  Get money…  │ │  Repairs…    │ │  Flight…     │ │  Broken…     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │▎📶 Utilities│ │▎💳 Financial│ │▎🛡 Insurance│ │▎🚗 Vehicle  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │▎🩺 Health   │ │▎💼 Employ   │ │▎🛒 Ecommerce│ │▎🏘 HOA      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│  ┌─────────────┐                                                   │
│  │▎🔨 Contract │     550+ professional letter templates            │
│  └─────────────┘                                                   │
│  ───────────────────────────────────────────────────────────────── │
│  📄 Browse all templates →                    ✨ Not sure? AI help │
└─────────────────────────────────────────────────────────────────────┘
```

### Guides Panel

Same 4-column layout as Templates for consistency.

### Resources Panel

**Redesign**: 3-column layout with visual grouping using section headers and a "featured tool" highlight.

```text
┌──────────────────────────────────────────────────────────────────────┐
│  GENERAL              FREE TOOLS               FREE TOOLS (cont.)   │
│  ────────             ──────────               ──────────────────    │
│  How It Works         Do I Have a Case?        State Rights Lookup   │
│  FAQ                  Small Claims Guide       Deadlines Calculator  │
│  Knowledge Center     Court Cost Calculator    Consumer News         │
│  About Us             Demand Letter Compare    Analyze My Letter     │
│  Contact              Escalation Flowchart                           │
│  ─────────────────────────────────────────────────────────────────── │
│  Popular State Laws: [CA] [TX] [NY] [FL]  Browse all 50 →           │
└──────────────────────────────────────────────────────────────────────┘
```

- Split free tools across 2 columns (5 + 4) to balance with the 5 general items
- Larger icon tiles on the free tools to visually distinguish them as "products"
- Section headers get a subtle underline accent

## Specific Visual Improvements

1. **Cards**: Replace rounded-xl icon containers with a **left border accent** (3px solid, category color) on each card. More refined, less bulky.
2. **Hover**: Add a gentle `translate-x-1` on hover for a polished interaction feel.
3. **Spacing**: Tighter padding (p-2.5 instead of p-3), gap-2 instead of gap-1 in the grid for consistent whitespace.
4. **Section headers**: Uppercase, letter-spaced, with a thin accent underline.
5. **Width**: Templates/Guides panel goes from 860px to 920px for the 4-col layout. Resources from 540px to 680px for 3 columns.
6. **Last row fill**: When 13 items don't fill the 4-col grid evenly (3 rows of 4 + 1), the last card spans or sits neatly with a promotional banner ("550+ templates") filling the remaining space.

## File Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | Rewrite CardItem styling (left-border accent, compact layout, 4-col grid), restructure Resources into 3 balanced columns, adjust panel widths, add section header styling, add hover transitions |

No new files or dependencies needed.

