

# Enrich Guides Pages and Improve Guides Menu

## Part 1: Guides Menu Visual Upgrade

### File: `src/components/layout/MegaMenu.tsx`

**Current state**: Plain 2-column list with uniform blue icons and no descriptions.

**Changes**:
- Widen the dropdown from 500px to 600px to accommodate descriptions
- Use each category's existing `color` property for the icon color (same as category pages)
- Add short one-line descriptions under each category name using data from `templateCategories` descriptions (truncated)
- Show a template count badge (e.g., "15 letters") next to each guide entry, pulled from the `CATEGORIES` data or a count of `allTemplates` per category
- Add a highlighted "top pick" banner at the top of the dropdown (e.g., "Popular: Know your refund rights before you write your letter") linking to the refunds guide
- Use the existing `ListItem` component style (with description) instead of the minimal `GuideListItem` for a richer appearance

### File: `src/data/templateCategories.ts` (read-only reference)
Already has `color`, `icon`, `description` per category -- we'll reuse these.

## Part 2: Guide Page Content Enrichment

### File: `src/data/consumerRightsContent.ts`

**Add new fields to the `CategoryGuide` interface**:
- `regulatoryContacts?: { name: string; description: string; url: string; phone?: string }[]` -- Where to file complaints (FTC, CFPB, state AG, BBB)
- `stateVariations?: { state: string; detail: string }[]` -- Notable state-specific differences
- `relatedTemplateCount?: number` -- Number of templates in this category (can also be computed)
- `statSnapshot?: { label: string; value: string; source?: string }[]` -- Key statistics (e.g., "97% of CFPB complaints resolved within 15 days")

**Populate these fields** for at least the top 3-4 guides (refunds, housing, financial, insurance) with real regulatory data.

### File: `src/pages/CategoryGuidePage.tsx`

**Add new rendered sections** (inserted into the existing page flow):

1. **"Where to File Complaints" section** (after Federal Laws)
   - Card with agency name, description, direct link, and optional phone number
   - Styled with a distinct blue/indigo accent (like the federal laws card)
   - Each agency as a row with an external link icon

2. **"Key Statistics" callout strip** (after the introduction, before Key Rights)
   - Horizontal row of 2-3 stat cards (e.g., "97% CFPB resolution rate", "$500 avg refund recovered")
   - Light background, bold numbers, small source text

3. **"State Variations" notice** (after Important Deadlines)
   - Collapsible section showing notable state differences
   - Amber/info-styled card matching the deadlines card

4. **"Related Letters" count + link** (enhance the CTA section)
   - Show the actual template count: "Browse 15 Refund Letter Templates"
   - Add 2-3 specific popular template links below the main CTA button

5. **"Related Articles" section** (before "Explore Other Guides")
   - Query published blog articles tagged to this category
   - Show 2-3 article cards with title and excerpt
   - This connects the Tier 2 (Guides) to Tier 3 (Articles) content hierarchy

### TOC Updates
Add new sections to the `tocItems` array so they appear in the sticky sidebar navigation.

## Implementation Order

1. Update the `CategoryGuide` interface with new optional fields
2. Populate data for refunds, housing, financial, and insurance guides
3. Render the new sections in `CategoryGuidePage.tsx`
4. Upgrade the Guides mega menu in `MegaMenu.tsx`

## What This Achieves

- **SEO**: More content depth and internal linking boosts topical authority
- **User value**: Actionable complaint filing links, real statistics, and state-specific info
- **Conversion**: Template counts and direct links from guides to letters increase click-through
- **Visual polish**: The menu matches the quality of the Letter Templates mega menu

