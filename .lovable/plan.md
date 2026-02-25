

# Fix: Invisible Hero Headers on Small Claims Pages

## Problem

The hero sections on `SmallClaimsStatePage` and `SmallClaimsGeneratorPage` use `bg-[var(--gradient-hero)]` which does not work in Tailwind. The `bg-` utility maps to `background-color`, but `--gradient-hero` is a `linear-gradient(...)` value that requires the `background` shorthand property. Result: the background renders as transparent/gray while the text is white (`text-primary-foreground`), making it unreadable.

Additionally, three tool pages (`SmallClaimsCostCalculatorPage`, `SmallClaimsEscalationPage`, `SmallClaimsDemandLetterPage`) have no hero section at all — just a plain white intro with a back link. The `CaseQuizPage` has its own lighter hero that works fine.

## Affected Pages (5 total)

| Page | Current State | Fix |
|---|---|---|
| `SmallClaimsStatePage.tsx` | Gray/invisible hero (broken gradient) | Fix background to use inline `style` |
| `SmallClaimsGeneratorPage.tsx` | Gray/invisible hero (broken gradient) | Fix background to use inline `style` |
| `SmallClaimsCostCalculatorPage.tsx` | No hero, plain white intro | Add matching dark hero section |
| `SmallClaimsEscalationPage.tsx` | No hero, plain white intro | Add matching dark hero section |
| `SmallClaimsDemandLetterPage.tsx` | No hero, plain white intro | Add matching dark hero section |

## Solution

### Fix 1: SmallClaimsStatePage.tsx (line 85)
Replace `className="bg-[var(--gradient-hero)]"` with `style={{ background: 'var(--gradient-hero)' }}` so the CSS gradient actually applies. Keep the existing hero content (state name, badges, etc.) unchanged.

### Fix 2: SmallClaimsGeneratorPage.tsx (line 97)
Same fix — replace `bg-[var(--gradient-hero)]` with inline `style={{ background: 'var(--gradient-hero)' }}`.

### Fix 3: SmallClaimsCostCalculatorPage.tsx (lines 29-44)
Replace the plain white intro section with a proper dark hero matching the state pages:
- Dark gradient background via `style={{ background: 'var(--gradient-hero)' }}`
- White text with `text-primary-foreground`
- Move "Back to Small Claims Guide" link inside the hero
- Add a small pill badge (Calculator icon + "Interactive Tool")
- Keep existing h1 and description, just restyle to white

### Fix 4: SmallClaimsEscalationPage.tsx (lines 28-43)
Same pattern — wrap the existing intro in a dark gradient hero with white text and a pill badge (GitBranch icon + "Escalation Flowchart").

### Fix 5: SmallClaimsDemandLetterPage.tsx (lines 28-43)
Same pattern — dark gradient hero with white text and a pill badge (DollarSign icon + "Cost Comparison").

## Design Consistency
All five pages will share the same hero pattern:
- `style={{ background: 'var(--gradient-hero)' }}` + `text-primary-foreground`
- Centered content, max-w-3xl
- Small pill badge with icon + label
- h1 in serif bold
- Subtitle in `text-primary-foreground/80`
- "Back to Small Claims Guide" link in `text-primary-foreground/60` above the h1

This matches the existing SmallClaimsPage hub hero style (dark blue with white text).

