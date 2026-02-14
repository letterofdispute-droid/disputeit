

# AI-Generated Contextual Sentences for Link Insertion

## What Changes

Replace the static bridge sentence templates ("For more details, see our guide on...") with AI-generated sentences that read like a natural part of the article.

## How It Works

When the system can't find an existing phrase in a paragraph to wrap as a link, instead of appending a canned template, it will:

1. Send the surrounding paragraph text + the target article's title/keywords to Lovable AI (Gemini Flash -- fast and cheap)
2. Ask the AI to write ONE sentence that:
   - Continues the paragraph's topic naturally
   - Contains a 2-5 word phrase suitable as anchor text for the target article
   - Reads like the original author wrote it
3. The AI returns the sentence with the anchor phrase marked
4. The system wraps the anchor phrase in an `<a>` tag and appends the sentence to the paragraph

## Example

**Paragraph**: "Before heading out on the water, make sure your equipment is in good condition. Check for cracks in the hull and ensure your life jacket fits properly."

**Target article**: "Choosing the Right Wooden Paddle for Your Kayak"

**AI generates**: "Equally important is selecting a paddle that matches your height and paddling style, as the wrong size can lead to fatigue and poor control."

**Result**: "...life jacket fits properly. Equally important is [selecting a paddle that matches your height](link) and paddling style, as the wrong size can lead to fatigue and poor control."

## Technical Details

### File: `supabase/functions/apply-links-bulk/index.ts`

**Remove**: The `BRIDGE_TEMPLATES` array and `getBridgeSentence` function (lines 160-175)

**Add**: An `generateContextualSentence` async function that calls Lovable AI:

```text
async function generateContextualSentence(
  paragraphText: string,       // the surrounding context
  targetTitle: string,         // what the target article is about
  targetKeywords: string[],    // target's primary + secondary keywords
  targetUrl: string            // the link URL
): Promise<{ sentence: string, anchorPhrase: string } | null>
```

The AI prompt will be:
- System: "You are an SEO content editor. Write ONE sentence that naturally continues the given paragraph and contains a short phrase (2-5 words) related to the target topic. Return JSON: {sentence, anchorPhrase}. The sentence must feel like the original author wrote it. Do not use phrases like 'learn more', 'check out', 'see our guide'."
- User: the paragraph text + target title + keywords

**Update** `insertLinkContextually` to be `async` and call `generateContextualSentence` as the fallback instead of `getBridgeSentence`.

### Rate Limiting Consideration

Since this runs during bulk application (potentially 100 suggestions at once), the function will:
- Process suggestions sequentially (not in parallel) to avoid hitting AI rate limits
- Use `google/gemini-2.5-flash-lite` (cheapest/fastest model) since this is a simple writing task
- Add a 200ms delay between AI calls if processing more than 10 suggestions

### No Other Files Change

The rest of the pipeline (scanning, UI, paragraph scoring, natural phrase matching) stays the same. The AI fallback only triggers when no existing phrase can be found in the article.
