

# Mega Menu Refinements: Consistent Styling + Get Started Dropdown

## Three Changes

### 1. Free Tools — Use `MenuCard` style (same as Letter Templates)
Currently uses `CompactMenuCard` (inline icon, no description below). Switch to `MenuCard` which has the gray square icon background and description below the title.

The panel width stays at ~700px with a 2-column grid layout, same as Letter Templates but with fewer items per column.

### 2. Learn — Use `MenuCard` style for the links column
Same change: swap `CompactMenuCard` to `MenuCard` for the three Guides & Knowledge items so they get the gray icon box and description below.

### 3. Get Started — Convert from direct link to dropdown
Add a dropdown with the "General" items that were removed earlier:

```text
┌──────────────────────────────────────┐
│  ○ How It Works    Getting started   │
│  ○ FAQ             Common questions  │
│  ○ About Us        Our mission       │
│  ○ Contact         Get in touch      │
└──────────────────────────────────────┘
```

Uses `MenuCard` style for consistency. Single-column, ~400px wide. No footer needed — it is a simple list.

## Technical Changes

| File | Change |
|------|--------|
| `src/components/layout/MegaMenu.tsx` | 1. In Free Tools dropdown, replace `CompactMenuCard` with `MenuCard` for both `assessmentTools` and `courtTools`. 2. In Learn dropdown, replace `CompactMenuCard` with `MenuCard` for the three guide links. 3. Add a `getStartedItems` array with How It Works, FAQ, About, Contact (with icons and descriptions). 4. Convert "Get Started" from a direct `Link` to a `NavigationMenuTrigger` + `NavigationMenuContent` with a single-column `MenuCard` grid (~400px). |

### Get Started Items

```typescript
const getStartedItems = [
  { title: 'How It Works', description: 'Step-by-step guide', href: '/how-it-works', icon: Sparkles },
  { title: 'FAQ', description: 'Common questions answered', href: '/faq', icon: FileQuestion },
  { title: 'About Us', description: 'Our mission & story', href: '/about', icon: BookOpen },
  { title: 'Contact', description: 'Get in touch', href: '/contact', icon: Mail },
];
```

Will need to import `Mail` from lucide-react.

