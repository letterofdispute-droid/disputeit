# Strengthen List Usage and Add Pros/Cons in Blog Generation

## Problem

Both blog generation functions (`generate-blog-content` and `bulk-generate-articles`) have a weak, easily-ignored instruction about lists. The current line reads: "Where content involves steps, tips, options, or enumerable items, present them as lists." The AI treats this as optional and defaults to dense paragraphs. There is zero instruction about pros/cons sections.

## Changes

### 1. `supabase/functions/generate-blog-content/index.ts`

Update the CONTENT REQUIREMENTS section to:

- Replace the weak list instruction with a **mandatory** directive requiring at least 1-2 structured lists per article
- Add a dedicated PROS AND CONS instruction requiring a clearly formatted pros/cons comparison where the topic involves choosing between options, evaluating a service, or weighing a decision
- Specify the exact HTML structure expected (e.g., `<h3>Pros</h3><ul>...</ul><h3>Cons</h3><ul>...</ul>`)

### 2. `supabase/functions/bulk-generate-articles/index.ts`

Apply the same strengthened instructions to the bulk generation prompt (line ~804), keeping both generators consistent:

- Same mandatory list minimum (1-2 per article)
- Same pros/cons instruction for applicable article types
- For article types like "comparison" and "mistakes", make pros/cons **mandatory** rather than optional

## What the Updated Instructions Will Say

**Lists directive (replacing the current weak line):**

> MANDATORY: Every article MUST contain at least 1-2 structured lists using `<ul>` or `<ol>` tags. Use numbered lists for sequential steps and bullet lists for tips, options, features, or criteria. Lists are MORE impactful than paragraphs - prefer them whenever presenting multiple items, requirements, rights, deadlines, or action steps.

**Pros and Cons directive (new):**

> When the article topic involves evaluating a product, service, approach, or decision, include a clearly labeled Pros and Cons section using this structure: `<h3>Pros</h3><ul><li>...</li></ul><h3>Cons</h3><ul><li>...</li></ul>`. This applies to comparison articles, service reviews, method evaluations, and any "should you" type content.

## Files Changed

- `supabase/functions/generate-blog-content/index.ts` - Strengthen list + add pros/cons instructions
- `supabase/functions/bulk-generate-articles/index.ts` - Same changes for consistency