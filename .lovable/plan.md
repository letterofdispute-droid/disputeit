

# Add Faded Background Images to Free Tool Hero Sections

## Current State
The tool pages use three different hero styles:
- **SmallClaimsPage** (`/small-claims`): Already has a background image (`/images/hero-bg.jpg`) with a `bg-primary/90` overlay — this is the look we want to replicate.
- **Sub-tool pages** (Cost Calculator, Demand Letter, Escalation, Generator): Use `var(--gradient-hero)` — flat gradient, no image.
- **StateRightsPage, DeadlinesPage, ConsumerNewsPage**: Use plain `bg-primary` — flat solid color, no image.

## Plan
Copy the uploaded stars flag image (`tookapic-stars-932873_1920.jpg`) to `public/images/tools-hero-bg.jpg` as the background for all tool pages. Then update 7 page hero sections to use the same pattern as SmallClaimsPage: a full-bleed background image with a dark blue overlay (`bg-primary/90`) for readability.

### Image Choice
The close-up stars image works best — it's subtle, textured, dark-toned, and won't compete with text. The eagle/flag image is too busy.

### Files to Update (7 pages)

Each hero `<section>` gets the same treatment:

```
Before (flat):
<section style={{ background: 'var(--gradient-hero)' }} className="text-primary-foreground py-16 md:py-20">
  <div className="container-wide">

After (image + overlay):
<section className="relative overflow-hidden text-primary-foreground py-16 md:py-20">
  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/tools-hero-bg.jpg')" }} />
  <div className="absolute inset-0 bg-primary/90" />
  <div className="container-wide relative z-10">
```

1. `src/pages/SmallClaimsCostCalculatorPage.tsx` — line 30
2. `src/pages/SmallClaimsDemandLetterPage.tsx` — line 29
3. `src/pages/SmallClaimsEscalationPage.tsx` — line 29
4. `src/pages/SmallClaimsGeneratorPage.tsx` — line 97
5. `src/pages/StateRightsPage.tsx` — line 157
6. `src/pages/DeadlinesPage.tsx` — line 262
7. `src/pages/ConsumerNewsPage.tsx` — line 179

### What Changes Visually
- The solid blue becomes a rich, textured dark blue with a subtle stars pattern bleeding through at 10% opacity
- Text contrast remains identical (white on dark blue)
- Creates a cohesive, premium "government authority" feel across all tools
- Matches the existing SmallClaimsPage hero pattern

### Assets
- Copy `user-uploads://tookapic-stars-932873_1920.jpg` → `public/images/tools-hero-bg.jpg`

