

# Mega Menu Redesign - Tailwind UI Style

## Design Direction

Adopt the clean, spacious card style from the reference: each item gets a **rounded icon container** (44px circle, light gray bg that turns white on hover), bold title, and muted description. The overall panel uses a **rounded-3xl container** with subtle shadow and outline, and a **tinted footer banner**.

## Layout

### Letter Templates Panel
- **2-column grid** (like the reference) instead of cramped 4-col
- Each card: `flex gap-x-6 rounded-lg p-4 hover:bg-accent/50`
- Icon in a `size-11 rounded-lg bg-muted` container, icon color changes to primary on hover
- Scrollable if needed, but 13 items in 2 cols = 7 rows which fits fine
- Footer banner: tinted background strip with template count + AI help CTA

```text
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │ (icon)  Refunds      │  │ (icon)  Housing      │      │
│  │         Get money…   │  │         Repairs…     │      │
│  ├──────────────────────┤  ├──────────────────────┤      │
│  │ (icon)  Travel       │  │ (icon)  Damaged      │      │
│  │         Flight…      │  │         Broken…      │      │
│  │  ... 2-col grid continues for all 13 ...       │      │
│  └──────────────────────┘  └──────────────────────┘      │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│  (tinted bg) 550+ Templates  ·  Not sure? Get AI help    │
└──────────────────────────────────────────────────────────┘
```

### Guides Panel
Same 2-column layout for consistency.

### Resources Panel
- **2-column grid** for all resource items (general + free tools mixed or grouped)
- Same card styling as templates
- Footer: Popular State Laws chips + "Browse all 50"

## Visual Details

1. **Container**: `rounded-3xl bg-popover shadow-lg ring-1 ring-border` (matches reference's `rounded-3xl outline outline-1`)
2. **Cards**: `group relative flex gap-x-6 rounded-lg p-4 hover:bg-accent/50` 
3. **Icon circle**: `size-11 rounded-lg bg-muted group-hover:bg-background flex items-center justify-center` with icon `size-6 text-muted-foreground group-hover:text-primary`
4. **Title**: `text-sm font-semibold text-foreground`
5. **Description**: `mt-1 text-sm text-muted-foreground`
6. **Footer banner**: `bg-muted/50 px-8 py-6 rounded-b-3xl` with template count and CTA
7. **Panel width**: `max-w-3xl` (~768px) for Templates/Guides, `max-w-2xl` (~672px) for Resources

## File Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | Rewrite card components to match Tailwind UI pattern: icon circles, spacious padding, 2-col grid, rounded-3xl container, tinted footer banner |
| `src/components/ui/navigation-menu.tsx` | Update `NavigationMenuViewport` to use `rounded-3xl` and adjust shadow/border styling to match |

