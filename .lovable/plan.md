

# De-duplicating the Letter Templates and Guides Mega Menus

## The Problem
Both "Letter Templates" and "Guides" dropdowns show the **identical** 13-category grid. The only difference is the URL prefix (`/templates/` vs `/guides/`) and footer text. This is wasted navigation real estate and confusing for users.

## Recommended Approach: Merge Into a Single "Letter Templates" Dropdown With Two Paths

Remove the standalone "Guides" top-level menu item. Instead, add a **secondary column or footer row** inside the existing "Letter Templates" dropdown that links to guides. This eliminates the duplication while keeping guides discoverable.

### Option A — Footer CTA Row (Minimal Change, Recommended)

Keep the single 3-column category grid under "Letter Templates". In the footer bar, add a second link for guides alongside "Browse all templates":

```text
┌─────────────────────────────────────────────────────┐
│  Refunds & Purchases  │ Landlord & Housing │ Travel │
│  Damaged Goods        │ Utilities          │ ...    │
│  ...                  │ ...                │ ...    │
├─────────────────────────────────────────────────────┤
│ 📄 Browse all templates · 631+      📖 Consumer Rights Guides →  │
│                           ✨ Not sure? Get AI help                │
└─────────────────────────────────────────────────────┘
```

- Remove the "Guides" `NavigationMenuItem` entirely
- Add a "Consumer Rights Guides" link in the footer of the Templates panel
- Pros: Simplest change, no duplication, clean
- Cons: Guides are slightly less prominent

### Option B — Two-Tab Panel (More Prominent)

Replace both menus with a single "Browse" dropdown that has **tabs** at the top: `Templates | Guides`. Clicking a tab switches the grid's link prefix. Footer updates accordingly.

```text
┌─ [Templates] [Guides] ─────────────────────────────┐
│  Refunds & Purchases  │ Landlord & Housing │ Travel │
│  ...                                               │
├─────────────────────────────────────────────────────┤
│ Browse all templates · 631+        ✨ Get AI help   │
└─────────────────────────────────────────────────────┘
```

- Pros: Both equally prominent, single source of truth
- Cons: More code, adds state management for active tab

---

## My Recommendation: **Option A** (Footer CTA)

It is the cleanest UX. Guides are a Tier 2 educational resource — they don't need equal nav prominence to the Tier 1 templates (the primary conversion points). A clear footer link like **"📖 Read Consumer Rights Guides →"** is sufficient and keeps the nav simple.

## Technical Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | 1. Remove the "Guides" `NavigationMenuItem` block entirely. 2. Add a `Link to="/guides"` in the Templates footer bar alongside the existing "Browse all templates" link. Style it as a secondary CTA (e.g., `BookOpen` icon + "Consumer Rights Guides →"). |

No other files need changes — routes, pages, and data stay the same.

