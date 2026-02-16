

# Award-Winning Hero Redesign - Light, Geometric, Modern

## Design Direction

Flip from dark-navy-centered to a **light, asymmetric layout** with decorative geometric SVG shapes, inspired by modern SaaS/legal-tech sites (think Linear, Vercel, Stripe aesthetic). Keep all existing content and functionality - just reimagine the visual treatment and layout.

## Key Design Moves

### 1. Light Background with Geometric Accents
- Replace the dark navy hero with a **light background** (`bg-background` / near-white)
- Text becomes dark (`text-foreground`) instead of white
- Add **floating geometric SVG shapes** - circles, rounded rectangles, dotted grids, and abstract angular forms in muted primary/accent colors with low opacity
- Subtle animated movement on the shapes using CSS (slow float/rotate)

### 2. Asymmetric Layout (Left-Aligned Content)
- Break out of the centered `max-w-3xl mx-auto text-center` box
- Content shifts **left-aligned** on desktop (centered on mobile)
- Right side gets a decorative composition: overlapping geometric shapes, maybe a stylized letter/document illustration built from SVG primitives
- Use a two-column grid on desktop: `lg:grid lg:grid-cols-2`

### 3. Geometric SVG Elements
Hand-coded inline SVGs (no external dependencies):
- **Large soft circle** (top-right) in accent/amber at 10% opacity
- **Dotted grid pattern** (bottom-right) in primary at 5% opacity
- **Angular slash/line** crossing diagonally behind content
- **Small floating dots** scattered with subtle CSS animation
- **Rounded rectangle outlines** overlapping to suggest document/letter shapes

### 4. Refined Typography
- H1 stays serif (Lora) but goes dark text on light
- The accent span ("Without the Guesswork") keeps the amber/accent color
- Subheadline uses `text-muted-foreground` for softer contrast

### 5. AI Search Bar Update
- Light glassmorphism style: white bg with subtle border and shadow instead of the current semi-transparent dark style
- Keeps the same click handler and AI Help badge

### 6. CTA Buttons
- Primary button stays accent (amber) - pops nicely on light bg
- Secondary button becomes `variant="outline"` (dark border on light)

### 7. Remove the Hero Background Image
- The dark photo with grayscale filter is the main thing making it feel dated
- Replace entirely with the geometric composition
- This also improves LCP since we remove a large image load

## What Stays the Same
- All text content (headline, subheadline, search prompt text)
- All click handlers and analytics tracking
- Badge pill, trust indicators, CTAs - just restyled
- DisputeAssistantModal and GlobalSearch integrations
- Mobile responsiveness (stacks to centered single-column)

## Files to Modify

1. **`src/components/home/Hero.tsx`** - Complete visual overhaul:
   - Remove hero-bg.jpg image, gradient overlay, and SVG pattern
   - Add inline geometric SVG elements with CSS animations
   - Switch to light color scheme classes
   - Change layout from centered to asymmetric grid
   - Update search bar styling to light theme
   - Update button variants

2. **`src/index.css`** - Add new utility animations:
   - `animate-float` (slow up/down)
   - `animate-float-delayed` (offset timing)
   - `animate-spin-slow` (very slow rotation for shapes)

3. **`src/components/ui/button.tsx`** - No changes needed (existing `accent` and `outline` variants work on light backgrounds)

## Technical Details

- No new dependencies
- No database changes
- All geometric shapes are inline SVGs (zero additional network requests)
- CSS animations use `will-change: transform` for GPU acceleration
- Mobile: shapes scale down or hide, layout centers

## Visual Concept (ASCII)

```text
Desktop Layout:
+--------------------------------------------------+
|  [geometric shapes scattered across background]   |
|                                                    |
|   Badge Pill              ○ large circle (faded)  |
|   Big Headline                                    |
|   Left-Aligned          ┌──────────┐              |
|                         │ document │  ◇           |
|   Subheadline           │  shapes  │              |
|                         └──────────┘              |
|   [AI Search Bar ........................ AI Help] |
|                              · · ·                |
|   [Start Dispute]  Browse Templates  · · ·        |
|                                      · · ·        |
|   ✓ Certainty  ✓ Pre-validated  ✓ Legal-safe     |
+--------------------------------------------------+
```

