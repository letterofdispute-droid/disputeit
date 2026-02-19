
# Consumer Rights Hub — Visual Overhaul, Content Enrichment & Legal Pages Update

## What This Plan Addresses

Three distinct areas of improvement, implemented in one coherent pass:

1. **Deadlines Calculator** — Complete visual and content rebuild: rich hero, illustrated SVG graphic, "What happens if I miss it?" educational content, a "Know Your Rights" quick-reference grid, and an expanded FAQ below the results
2. **State Rights Lookup** — Richer content: state map SVG illustration, a "3 Reasons State Law Matters" explainer with icons, a comparison table of state vs. federal protections, and a "Top 5 States with Strongest Consumer Laws" highlight panel
3. **Consumer News Hub** — Visual upgrade: source agency logos as inline SVG badges, a "Why this matters" contextual panel in the sidebar, improved card layout with category pill color-coding
4. **Letter Analyzer** — Visual upgrade: animated score ring instead of a flat bar, a "before/after" example snippet panel showing a weak vs. strong letter for the selected category, improved dimension icon set
5. **Privacy, Terms, Cookie Policy pages** — Visual refresh: add a branded header banner with shield icon + gradient, table-of-contents sticky sidebar on desktop, improve callout box styling for AI disclosure / GDPR / CCPA sections, update dates and add the new free tools to the Service Description in Terms

---

## Part 1: Deadlines Calculator — Full Rebuild

### Visual Hero Upgrade
Replace the plain primary-color banner with a split-layout hero:
- Left: headline + subhead + key stats ("**60 days** to dispute a credit card charge · **30 days** FTC mail order rule · **3 years** typical FTC statute")
- Right: an inline SVG hourglass / countdown illustration (custom, no external asset needed) with animated sand fill using CSS

### New "Clock Is Ticking" SVG Component
A self-contained SVG `<DeadlineHeroIllustration />` component showing:
- A large hourglass with gradient fill
- Three floating badge labels: "60 Days", "3 Years", "Act Now" 
- Subtle CSS animation on the sand particles
- Renders inline — no image file, no network request

### Calculator UI — Enhanced
- Step indicator: "Step 1 → Step 2 → Step 3" progress bar above the 3 selectors
- Incident date now shows: "You have **47 days** from today to the soonest deadline" as a live summary badge beneath the date picker (computed from the earliest extractable deadline in the list)
- Color-coded countdown ring (SVG circle) for each deadline card showing % of time elapsed

### Content Sections Below Results

**"What Happens If I Miss My Deadline?"** — A structured panel explaining:
- Federal claims: rights are generally barred (no exceptions for ignorance)
- State claims: "tolling" doctrines may apply (fraud concealment, discovery rule)
- When to consult an attorney immediately
- Source: general consumer protection law principles (not fabricated)

**"Common Deadlines at a Glance"** — Always-visible quick-reference table (no category selection needed), showing the 8 most commonly looked-up federal deadlines pulled from the existing `consumerRightsContent.ts` data across all guides (FCBA 60 days, FTC mail 30 days, HUD 180 days, etc.)

**FAQ Accordion** — 6 questions drawn from real scenarios:
- "Can I dispute a charge after 60 days?"
- "What is the discovery rule?"
- "Does the deadline reset if the company promises to fix it?"
- "How do I find my state's statute of limitations?"
- "What if the company has gone out of business?"
- "Does sending a letter pause the clock?"

---

## Part 2: State Rights Lookup — Content & Visual Enrichment

### Hero Upgrade
- Same split-layout approach: left text, right SVG US map outline with the selected state highlighted
- **`<USMapIllustration />`** — inline SVG of simplified US state outlines (path-based, static)
- When a state is selected, that state's path gets `fill` set to `hsl(var(--primary))` via React state; all others remain muted

### New Content Panels

**"Federal vs. State: What's Different?"** — A 2-column comparison card:

| Protection | Federal Floor | State Can Add |
|---|---|---|
| Damages | Actual damages | Treble (3×) damages |
| Attorney fees | Sometimes | Often mandatory |
| Deadline to sue | 3-4 years typical | Can be shorter or longer |
| Who enforces | FTC, CFPB | State AG |

**"States with Notable Consumer Protections"** — A highlight strip of 5 states known for strongest laws (CA, NY, MA, IL, TX), each with their signature statute and one key difference from federal law. Data sourced from `stateSpecificLaws.ts`.

**"How to File an AG Complaint"** — A numbered step guide (4 steps) explaining what information to gather, how to submit, and what to expect. This content is currently absent and directly serves users who land on this page.

---

## Part 3: Consumer News Hub — Visual Upgrade

### Source Badge Redesign
Replace text badges with inline SVG government seal–style badges for FTC, CFPB, NHTSA — official color schemes (blue, green, orange) with subtle seal texture via SVG pattern.

### Card Improvement
- Larger card with a left accent border in the source's brand color
- "Impact level" pill (High / Medium) based on whether the title contains enforcement keywords ("action", "ban", "recall", "fine", "penalty")
- Category tag now links directly to the matching template category

### Sidebar — "Why This Matters" Panel
New sidebar card explaining: when the FTC takes enforcement action → companies often change their practices → now is the right time to dispute if you were affected. With a link to the letter templates.

---

## Part 4: Letter Analyzer — Visual Upgrade

### Animated Score Ring
Replace the flat progress bar with a circular SVG score ring component `<ScoreRing />`:
- Large circular gauge (like a speedometer)
- Number in center: "74%"
- Ring fills from 0 to score over 0.8s using CSS `stroke-dashoffset` animation
- Color: green ≥ 75%, amber 50–74%, red < 50%

### "Weak vs. Strong" Example Panel
New sidebar card showing a 2-line before/after snippet for the selected category:
- **Weak:** "I am writing to complain about the product I bought."
- **Strong:** "Pursuant to 15 U.S.C. § 2310 (Magnuson-Moss Warranty Act), I hereby demand..."
Examples pulled from a small static lookup object keyed by category.

---

## Part 5: Privacy, Terms & Cookie Policy — Visual Refresh

### All Three Pages — Shared Improvements

**Branded Header Banner**: Each page gets a gradient header section (matching the tool pages) with:
- Relevant icon (Shield for Privacy, Scale for Terms, Cookie for Cookie Policy)
- Page title + "Last Updated" date badge
- One-line summary of what the page covers
- Quick-action button (e.g., "Manage Cookie Settings" for Cookie Policy; "Contact Privacy Team" for Privacy; no action for Terms)

**Sticky Table of Contents (desktop only)**:
- On `md:` and above, the ToC moves to a `sticky top-24` left sidebar column
- Main content occupies the right 3/4
- Active section highlighted via scroll intersection observer

**Improved Callout Box Styling**:
- AI Disclosure (Privacy §5): amber callout gets an AI chip icon + cleaner list styling
- GDPR Rights (Privacy §10): blue callout with EU stars icon (SVG inline)
- CCPA Rights (Privacy §11): amber callout with CA bear icon (SVG inline)
- No Government Affiliation (Terms §6): destructive callout gets a bold ⚠ warning banner header
- Cookie categories (Cookie Policy §3–5): each category card gets a status chip ("Always On" / "Requires Consent")

**Terms of Service — Content Update**:
Update §3 (Service Description) to include the 5 free tools:
- State Consumer Rights Lookup
- Statute of Limitations Calculator
- Consumer News Hub
- Free Letter Strength Analyzer
- Dispute Outcome Tracker

Update `lastUpdated` to `February 19, 2026`.

**Privacy Policy — Content Update**:
- Add a §5 sub-point about the Letter Analyzer: "When you use the free Letter Analyzer, your submitted text is processed by AI for scoring but is not stored after analysis."
- Add the Dispute Outcome Tracker data to §2 (data we collect): "Dispute outcome data you voluntarily log in the Dispute Tracker, including dispute titles, categories, amounts, and status."
- Update `lastUpdated` to `February 19, 2026`.

**Cookie Policy** — already well-structured, just gets the visual header banner.

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/DeadlinesPage.tsx` | Edit | Full visual/content rebuild — SVG hero, step indicator, quick-reference table, FAQ accordion, "what if I miss it" panel |
| `src/pages/StateRightsPage.tsx` | Edit | SVG map illustration, federal vs. state comparison card, AG complaint steps, notable states strip |
| `src/pages/ConsumerNewsPage.tsx` | Edit | SVG source badges, impact level pill, improved card layout, "Why This Matters" sidebar panel |
| `src/pages/LetterAnalyzerPage.tsx` | Edit | Animated SVG score ring, weak/strong example panel |
| `src/pages/PrivacyPage.tsx` | Edit | Gradient header, sticky ToC layout, improved callout boxes, content updates, new date |
| `src/pages/TermsPage.tsx` | Edit | Gradient header, sticky ToC, improved callout boxes, add free tools to §3, new date |
| `src/pages/CookiePolicyPage.tsx` | Edit | Gradient header, sticky ToC layout on desktop |

No new dependencies required — all SVG illustrations are inline React components. No new routes, no database changes, no edge functions.

---

## Design Principles

- All SVG illustrations are **inline React JSX** — no image files, no external requests, no loading states
- Color palette strictly uses existing CSS variables (`hsl(var(--primary))`, `hsl(var(--accent))`, etc.) — no hardcoded hex
- Animations use CSS transitions only (`transition-all`, `stroke-dashoffset`) — no JS animation libraries
- All new content text is derived from the existing verified data in `consumerRightsContent.ts` and `stateSpecificLaws.ts` — no fabrication
- Mobile-first: SVG illustrations are hidden on `sm:` breakpoint; text content always visible
