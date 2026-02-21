

# Fix: Remove UK targeting from Topic Discovery AI prompt

## Problem
The `suggest-content-topics` edge function has two explicit UK references in its AI prompts that cause the model to generate UK-focused topic suggestions instead of US-focused ones.

## Root Cause (exact lines)

| Line | Current Text | Issue |
|---|---|---|
| 95 | `"specialising in UK consumer rights, dispute letters..."` | Tells AI to focus on UK |
| 138 | `"UK English throughout."` | Reinforces UK focus |

## Changes

**File: `supabase/functions/suggest-content-topics/index.ts`**

### Line 95 -- System prompt
Change:
```
You are a senior SEO content strategist specialising in UK consumer rights, dispute letters, and legal self-help content.
```
To:
```
You are a senior SEO content strategist specializing in US consumer rights, dispute letters, and legal self-help content.
```

### Line 138 -- User prompt final instruction
Change:
```
Produce exactly 3-5 items. Prioritise verticals with low article counts, low keyword saturation, or high commercial intent gaps. UK English throughout.
```
To:
```
Produce exactly 3-5 items. Prioritize verticals with low article counts, low keyword saturation, or high commercial intent gaps. Target US audiences and use American English throughout. Reference US federal and state laws (e.g., FTC, CFPB, FDCPA, state consumer protection statutes) rather than UK bodies like Ombudsman services.
```

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/suggest-content-topics/index.ts` | Replace UK references with US targeting in both system and user prompts |

