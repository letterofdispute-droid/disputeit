

# Fix: Move AI Sentence Generation Into Discovery Phase

## The Real Problem

The scan function (`scan-for-smart-links`) demands that anchor phrases already exist **verbatim** in the article body. If the article doesn't naturally contain a phrase matching a target, no suggestion is created -- period. The AI sentence generation capability exists in `apply-links-bulk`, but it only runs for suggestions that were already discovered. Discovery is the bottleneck.

This is why you're stuck at ~4.7 links per article instead of 8. The AI finds the right targets but can't find matching text in the body, so it silently drops them.

## The Fix: Two-mode anchor strategy in discovery

Change the `scan-for-smart-links` AI prompt and suggestion storage to support two types of anchors:

### 1. Update the AI prompt (lines 199-226)

Instead of requiring verbatim body matches only, ask the AI for two types:
- **Existing phrases**: Anchors that exist verbatim in the body (current behavior)
- **Generated anchors**: For targets where no good verbatim phrase exists, the AI should propose a short anchor phrase (2-5 words) AND a continuation sentence that contains it

New prompt structure:
```
For each target, try to find a verbatim phrase in the body text first.
If no good verbatim phrase exists, generate a short natural sentence 
that continues a relevant paragraph, containing a 2-5 word anchor phrase.

Return JSON array:
[
  {"anchor_text":"...", "target_index":1, "section_heading":"...", 
   "reasoning":"...", "confidence":85, "mode":"existing"},
  {"anchor_text":"...", "target_index":3, "section_heading":"...", 
   "reasoning":"...", "confidence":80, "mode":"generated",
   "generated_sentence":"One natural sentence with the anchor phrase embedded."}
]
```

### 2. Update the AISuggestion interface (line 22)

Add two optional fields:
```typescript
interface AISuggestion {
  anchor_text: string;
  target_index: number;
  section_heading: string;
  reasoning: string;
  confidence?: number;
  mode?: 'existing' | 'generated';           // NEW
  generated_sentence?: string;                 // NEW
}
```

### 3. Update validation logic (validateSuggestion, line 272)

For `mode === 'generated'` suggestions:
- Skip the "anchor must exist verbatim in body" check (line 303)
- Skip the "not in intro" check (line 310)  
- Keep all other quality gates (word count, char length, not a title prefix, not generic)
- Add a new check: `generated_sentence` must contain the `anchor_text` exactly

### 4. Store generated_sentence in link_suggestions

The `link_suggestions` table needs a column to store the generated sentence so `apply-links-bulk` can use it directly instead of re-generating.

**Database migration:**
```sql
ALTER TABLE link_suggestions 
  ADD COLUMN IF NOT EXISTS generated_sentence TEXT;
```

### 5. Update insertion in processOneArticle (lines 489-500)

Include the `generated_sentence` field when inserting:
```typescript
const rows = validSuggestions.map(({ candidate, anchor, confidence, generatedSentence }) => ({
  source_post_id: article.id,
  target_type: candidate.contentType,
  target_slug: candidate.slug,
  target_title: candidate.title,
  target_embedding_id: candidate.embeddingId,
  anchor_text: anchor,
  anchor_source: 'ai_suggested',
  relevance_score: Math.max(55, Math.min(95, confidence)),
  hierarchy_valid: true,
  status: 'pending',
  generated_sentence: generatedSentence || null,
}));
```

### 6. Update apply-links-bulk to use stored sentences

In `insertLinkContextually` (apply-links-bulk), when a suggestion has a `generated_sentence`:
- Skip the phrase-matching step
- Skip the AI sentence generation fallback
- Directly insert the pre-generated sentence into the best-scoring paragraph
- Wrap the anchor phrase in the sentence with the link tag

This removes the second AI call during application, making it faster and more reliable.

## Files to edit

1. **supabase/functions/scan-for-smart-links/index.ts** -- Updated prompt, interface, validation, and insertion logic
2. **supabase/functions/apply-links-bulk/index.ts** -- Use stored `generated_sentence` instead of re-generating
3. **Database migration** -- Add `generated_sentence` column to `link_suggestions`

## Expected impact

- Discovery will produce 8-10 valid suggestions per article instead of 4-5
- Articles without natural keyword matches will still get links via generated sentences
- The apply phase becomes faster (no redundant AI calls)
- After a Force re-scan of all categories, total links should reach 35,000-40,000

