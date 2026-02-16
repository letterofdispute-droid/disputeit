
# Hero Redesign - Grid Effect + Announcement Bar Style

Inspired by the reference design: light background with a warm gradient grid effect, centered layout with an announcement pill, large bold headline, and dual CTAs.

## What Changes

### Hero (`src/components/home/Hero.tsx`) - Full Rewrite

**Background:**
- Replace the current dot grid + circle SVGs with a **CSS grid/mesh pattern** that fades from a warm amber tint (bottom) into the white background (top) - similar to the reference's warm peach gradient grid
- Use an SVG grid pattern (thin lines forming squares) at very low opacity, overlaid on a subtle warm radial gradient anchored to the bottom center

**Announcement Pill (new element):**
- Add a small rounded pill at the top: something like "500+ templates available - Browse categories -->" 
- Styled with a thin border, rounded-full, small text, subtle hover - matches the reference's "New announcement" bar
- Links to the `#letters` section

**Headline:**
- Keep the serif font (Lora) for brand consistency, but make it **bolder and larger** - `text-5xl md:text-6xl lg:text-7xl`
- Keep the amber accent on key phrase
- Content stays: "Professional Dispute Letters, Without the Guesswork"

**Subheadline:**
- Slightly larger text, more breathing room below headline

**CTAs - Dual Button Layout (like reference):**
- Primary: "Start Your Dispute" - solid accent (amber) button, rounded-full
- Secondary: "Learn More >" - outline/ghost button with a chevron, rounded-full
- Both buttons side by side horizontally (not stacked)

**Remove:**
- The AI search bar from the hero (move it to be accessible via the header search icon only - it's already there)
- The SVG dot grid, abstract circles, and gradient orb decorations
- The "or browse all letter templates" text link
- The bottom trust strip text (already covered by TrustBadgesStrip below)

**Add:**
- Full-width SVG grid pattern background with warm gradient fade
- Announcement pill at top

### Header (`src/components/layout/Header.tsx`) - Minor Tweaks

- Keep the transparent-to-solid scroll behavior (already implemented)
- Make the "Contact Us" / CTA button in the header use `rounded-full` with the dark primary color (like the reference's "Contact Us" pill) instead of accent
- This is already mostly there, just ensure consistency

### CSS (`src/index.css`)

- Add a `.grid-pattern` utility class for the SVG grid background
- Update or keep the `.glass` class (may no longer be needed if we remove the search bar from hero)

## Visual Structure

```text
+----------------------------------------------------------+
|  [Logo]     Templates  Guides  Resources    [Search] [CTA]|
+----------------------------------------------------------+
|                                                           |
|              ________________________________             |
|             | 500+ templates - Browse now -> |             |  <- announcement pill
|              --------------------------------             |
|                                                           |
|            Professional Dispute Letters,                  |
|              Without the Guesswork                        |  <- large serif headline
|                                                           |
|         Pre-validated templates with legal                |
|         precision. No guesswork. Just results.            |  <- subheadline
|                                                           |
|          [Start Your Dispute]  [Learn More >]             |  <- dual CTAs
|                                                           |
|     _______________________________________________       |
|     |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |      |  <- grid pattern
|     |__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|__|      |    with warm gradient
|     |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |      |    fading upward
+----------------------------------------------------------+
```

## Files to Modify

1. `src/components/home/Hero.tsx` - Full rewrite with grid background, announcement pill, larger headline, dual CTAs, no search bar
2. `src/components/layout/Header.tsx` - Minor CTA styling tweak
3. `src/index.css` - Add grid-pattern utility, clean up unused glass class if needed

## Technical Notes
- No new dependencies
- All GTM tracking preserved (handleStartDisputeClick, handleBrowseClick)
- DisputeAssistantModal still triggered by the "Start Your Dispute" button
- The AI search bar remains accessible via the header search icon (GlobalSearch component)
- "Learn More" secondary CTA links to /how-it-works
- Announcement pill links to #letters section
