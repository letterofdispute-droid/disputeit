

# Fix: Smart Contextual Link Insertion (SEO-Expert Quality)

## The Problem

The entire link application pipeline is broken at three levels:

1. `insert_position` is never populated by the scanner, but `apply-links-bulk` requires it -- so zero links would ever be applied
2. Anchor text comes from the target article's keywords, but the system tries to regex-match it in the source article's body -- these phrases rarely exist there
3. No contextual awareness: the system doesn't read the source article to find the right place for links

## The Solution: AI-Powered Contextual Link Placement

Replace the naive regex approach with a two-phase system that mimics how SEO experts actually insert links:

### Phase 1: Smart Paragraph Matching (in `apply-links-bulk`)

When applying a link, instead of searching for exact anchor text:

1. **Parse** the source article into paragraphs (split by `<p>` tags)
2. **Score** each paragraph for relevance to the target article's topic using keyword overlap (target's `primary_keyword` + `secondary_keywords` vs paragraph text)
3. **Select** the highest-scoring paragraph that doesn't already contain a link
4. **Within that paragraph**, either:
   - **Match Mode**: Find an existing phrase (2-4 words) that overlaps with the target's keywords and wrap it in a link
   - **Insert Mode** (fallback): Append a short contextual bridge sentence at the end of the paragraph, e.g., `Learn more about <a href="...">wooden paddle selection</a> to improve your technique.`

### Phase 2: Remove the `insert_position` Gate

The `insert_position` filter in `apply-links-bulk` (line 155-156) will be removed since the system now dynamically determines placement.

## Detailed Changes

### 1. `supabase/functions/apply-links-bulk/index.ts` -- Major Rewrite

Replace the current per-suggestion loop (lines 175-227) with:

```text
For each suggestion in orderedForInsert:
  1. Parse source article HTML into paragraph blocks
  2. Skip paragraphs that already contain <a> tags pointing to the target
  3. Score each paragraph against target keywords:
     - Count matches of target primary_keyword words
     - Count matches of target secondary_keywords words
     - Penalize paragraphs that already have 2+ outbound links
  4. Pick the top-scoring paragraph
  5. Within that paragraph:
     a. Try to find a 2-5 word phrase containing target keyword words
     b. If found: wrap that phrase in <a href="...">phrase</a>
     c. If not found: append a bridge sentence before the closing </p>
  6. Mark suggestion as 'applied'
  7. Increment link counters
```

**Bridge sentence templates** (randomly selected for variety):
- `For more details, see our guide on <a href="URL">ANCHOR</a>.`
- `You may also want to explore <a href="URL">ANCHOR</a>.`
- `This relates closely to <a href="URL">ANCHOR</a>.`

### 2. `supabase/functions/scan-for-semantic-links/index.ts` -- Minor Update

- Remove the `insert_position` field from generated suggestions (it's no longer needed)
- Keep all existing logic (similarity scoring, hierarchy validation, bidirectional discovery)

### 3. No Database Changes Required

The `insert_position` column can remain (nullable), it just won't be used as a gate anymore.

## How It Works End-to-End (Example)

**Source article**: "Top 5 Kayaking Safety Tips for Beginners"
**Target article**: "Choosing the Right Wooden Paddle for Your Kayak"
**Target keywords**: "wooden paddle", "paddle selection", "kayak paddle"

1. Scanner finds these articles are semantically related (similarity 0.82)
2. Scanner creates a suggestion with anchor_text = "wooden paddle selection"
3. When applying, the system parses the kayaking article's paragraphs
4. It finds: `<p>Before heading out, make sure your equipment is in good condition. Your paddle should be the right length for your height and kayaking style.</p>`
5. It scores this paragraph highly because it contains "paddle" and "kayaking"
6. It wraps the natural phrase: `Your <a href="/articles/...">paddle should be the right length</a> for your height...`
7. If no natural match exists, it appends: `...kayaking style. For guidance, see our tips on <a href="/articles/...">wooden paddle selection</a>.</p>`

## Technical Notes

- **Paragraph scoring** uses simple word-level matching (no AI calls needed), keeping it fast and free
- **Link density limit**: Skip paragraphs with 2+ existing `<a>` tags to avoid over-linking
- **First/last paragraph skip**: Never link in the intro or conclusion paragraphs (SEO best practice)
- **The `insert_position !== null` filter on line 155-156 of apply-links-bulk is removed** since placement is now dynamic
- Bridge sentences use 4 templates, selected by `suggestion.id.charCodeAt(0) % 4` for deterministic variety

