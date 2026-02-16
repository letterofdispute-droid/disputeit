

# Fix: Always Insert a Sentence Instead of Rejecting Links

## Problem
5,791 link suggestions were auto-rejected with "Could not find suitable insertion point" because:
1. The Smart Scan AI marked them as `mode: 'existing'` (anchor exists verbatim in the body)
2. During application, the phrase-matching logic couldn't find the anchor in a suitable paragraph (too short, first/last paragraph, already has 2 links)
3. With no `generated_sentence` stored, there was no fallback -- so they got rejected

## Fix

### `supabase/functions/apply-links-bulk/index.ts`

Update `insertLinkContextually` so that when both the phrase-matching AND AI-generation paths return nothing, it falls back to creating a simple natural sentence containing the anchor text as a link and appending it to a suitable paragraph.

The fallback logic:
1. Find eligible paragraphs (same rules: not first/last, fewer than 2 links, 40+ chars)
2. Pick one in the middle of the article
3. Construct a simple sentence like: `For more details, see our guide on <a href="...">anchor text</a>.`
4. Append it to the chosen paragraph

This ensures no suggestion is ever rejected solely because the system couldn't find a natural insertion -- it always has the option to add a brief contextual sentence.

### Also: Relax paragraph eligibility slightly

Currently `insertGeneratedSentence` (the path for suggestions that DO have a pre-generated sentence) also rejects when no paragraph meets the strict criteria. This accounts for 13 of the rejected suggestions. The same fallback should apply there too -- if no "ideal" paragraph exists, pick the best available one.

## Technical Details

**In `insertLinkContextually` (around line 345):**

Replace the final `return null` with:
```typescript
// Final fallback: create a simple linking sentence
const fallbackParagraphs = parseParagraphs(updatedContent);
const fallbackEligible = fallbackParagraphs.filter(p =>
  p.index > 0 &&
  p.index < fallbackParagraphs.length - 1 &&
  p.linkCount < 2 &&
  p.textLower.trim().length >= 40
);

if (fallbackEligible.length > 0) {
  const midIdx = Math.floor(fallbackEligible.length / 2);
  const para = fallbackEligible[midIdx];
  const linkHtml = `<a href="${targetUrl}" title="${escapeHtml(suggestion.target_title)}">${suggestion.anchor_text}</a>`;
  const sentence = `For further guidance, see our resource on ${linkHtml}.`;
  const modifiedPara = para.html.replace(/<\/p>$/i, ` ${sentence}</p>`);
  return content.replace(para.html, modifiedPara);
}

return null;
```

**In `insertGeneratedSentence` (around line 266):**

When `eligible.length === 0`, relax criteria to allow first or last paragraph as a last resort, rather than returning null.

## What stays the same
- Relevance scoring, anchor quality gates, outbound caps -- all unchanged
- The system still prefers natural phrase-matching first, then pre-generated sentences, then AI generation
- This is purely a last-resort fallback to prevent mass rejections

