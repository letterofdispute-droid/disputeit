

# Add Anti-AI-Word Rules to SEO Generation Prompt

## Problem
The `backfill-page-seo` prompt doesn't include any restrictions on AI-typical words. The shared `contentValidator.ts` already has a comprehensive `FORBIDDEN_PHRASES` list (navigating, elevate, leverage, seamless, etc.) but the SEO prompt doesn't reference it.

## Solution
Add a explicit banned-words rule to the AI prompt in `backfill-page-seo/index.ts` (line ~124), pulling the most common offenders directly into the prompt text:

```
- BANNED WORDS (never use these): navigating, navigate, elevate, elevating, delve, 
  leverage, seamless, robust, comprehensive, cutting-edge, empower, unlock, unleash, 
  streamline, optimize, foster, facilitate, paramount, pivotal, groundbreaking, 
  revolutionary, game-changer, vital, crucial, essential, landscape, realm, enhance, 
  enhancing, spearhead, holistic, synergy, paradigm, effortlessly, utilize.
- Write like a direct, no-nonsense human copywriter. Plain language only.
```

## Files changed
- **Edit:** `supabase/functions/backfill-page-seo/index.ts` — add banned words list to the AI prompt rules section

