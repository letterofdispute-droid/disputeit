

# Two Changes: Menu Cleanup + State Rights Map Fix

## 1. MegaMenu Restructure

### Remove from Free Tools:
- Remove "State Rights Lookup" from `courtTools` array (line 51)
- Remove the entire "Popular State Laws" footer bar from Free Tools dropdown (lines 215-230)

### Fix Learn dropdown:
- Remove the duplicate "Knowledge Center" entry (lines 257-262) — it points to `/articles`, same as "All Articles"
- Add "State Rights Lookup" as a MenuCard in the Guides & Knowledge column (icon: MapPin, description: "Laws for your state", href: /state-rights)
- Move the "Popular State Laws" badge bar into the Learn dropdown footer, alongside the existing "Browse all articles" link

The Learn footer will show both: `Browse all articles →` on the left, and the state law badges (CA, TX, NY, FL + "Browse all 50 →") on the right or below.

### File: `src/components/layout/MegaMenu.tsx`
- Remove `State Rights Lookup` entry from `courtTools` array
- Remove "Popular State Laws" footer from Free Tools `NavigationMenuContent`
- Remove "Knowledge Center" `MenuCard` from Learn column
- Add "State Rights Lookup" `MenuCard` to Learn's Guides & Knowledge column
- Add state law badges to Learn's footer bar

## 2. State Rights Page — Replace Rectangle Map with Real US Map SVG

The current `USMapIllustration` component (lines 34-128 in StateRightsPage.tsx) renders ugly gray rectangles. Replace it with the same approach used in `src/components/small-claims/USMap.tsx`: fetch `/images/us-map.svg`, inject it, color states, and add interactivity.

### File: `src/pages/StateRightsPage.tsx`
- Remove the entire `USMapIllustration` component (lines 34-128)
- Create a new `StateRightsMap` component that:
  - Fetches `/images/us-map.svg` via `fetch()` and injects via `dangerouslySetInnerHTML`
  - Highlights the currently `selectedState` in primary color
  - Colors all other states in a subtle muted tone
  - On click, calls `onStateSelect(code)` to update the parent's `selectedState`
  - Adds state abbreviation labels at path centroids (same as USMap.tsx)
  - Uses light fills appropriate for the dark hero background (primary-foreground tones instead of accent)
- Update the hero section to render `StateRightsMap` instead of `USMapIllustration`, passing `selectedState` and `onStateSelect={setSelectedState}`

### Technical approach (mirroring USMap.tsx pattern):
```typescript
function StateRightsMap({ selectedState, onStateSelect }: { 
  selectedState: string; 
  onStateSelect: (code: string) => void; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Fetch SVG
  useEffect(() => {
    fetch('/images/us-map.svg')
      .then(r => r.text())
      .then(text => {
        const cleaned = text
          .replace('stroke:#000; fill: none;', 'stroke-linejoin: round;')
          .replace(/fill:#f9f9f9/g, 'fill:hsl(var(--primary-foreground) / 0.15)');
        setSvgContent(cleaned);
      });
  }, []);

  // Apply interactivity after SVG injection
  useEffect(() => {
    // Style paths, highlight selectedState, add click handlers
    // Add state abbreviation labels
  }, [svgContent, selectedState]);
}
```

Key differences from USMap.tsx:
- Uses lighter fills suitable for dark background (primary-foreground tones)
- On click, updates parent state selection instead of navigating
- Highlights selectedState persistently (not just on hover)
- No tooltip needed (the lookup tool below serves that purpose)
- No color scale legend needed (not showing filing limits)

