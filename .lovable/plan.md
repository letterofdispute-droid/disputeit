

# Fix: Simplify Small Claims Hero to 1 Primary + 1 Secondary CTA

## The Problem

The hero currently has **5 buttons** (3 large + 2 small), creating decision paralysis -- especially on mobile where they stack into a tall column that pushes all content below the fold.

**Hero CRO best practice:** One clear primary action + one understated secondary option. Every additional button reduces click-through on all buttons.

## The Solution

Replace the 5-button block with a focused 2-CTA layout:

- **Primary (accent):** "Look Up Your State" -- this is the most common entry intent for someone landing on a small claims guide. It anchors to the state lookup section on the same page.
- **Secondary (outline):** "Explore Free Tools" -- scrolls to the "Free Tools" card grid already on the page, where users can choose between Cost Calculator, Demand Letter Costs, and Escalation Guide with proper context.

The three tool-specific buttons are removed from the hero because they are already accessible from:
1. The "Free Tools" card grid section on this same page
2. The MegaMenu under "Free Tools"
3. The mobile hamburger nav

## Visual Result (Mobile)

```text
[Badge: Free Interactive Guide -- Updated for 2026]

Small Claims Court:
The Complete Guide

File your case with confidence...

[======= Look Up Your State =======]  (accent, full-width)
[------- Explore Free Tools -------]  (outline, full-width)
```

Clean, focused, no scroll needed to see the subheadline.

## File Changed

| File | Change |
|------|--------|
| `src/pages/SmallClaimsPage.tsx` | Replace the 5-button hero CTA block (lines 61-89) with 2 buttons: "Look Up Your State" (anchor to #state-lookup) and "Explore Free Tools" (anchor to #free-tools). Ensure the Free Tools card grid section has `id="free-tools"`. |

## Technical Details

- Remove imports for `Calculator`, `DollarSign`, `GitBranch` if no longer used elsewhere on the page
- The `#state-lookup` anchor already exists on the StateLookup section
- Add `id="free-tools"` to the Free Tools card grid section if not already present
- Both buttons use smooth scroll behavior via anchor href

