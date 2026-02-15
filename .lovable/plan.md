

# Improve Anchor Text Specificity in Smart Scan

## Problem

The Smart Scan AI generates anchors like "robust insurance" that are too vague -- they could apply to multiple targets equally. Two root causes:

1. **Hardcoded relevance score**: Every suggestion gets `relevance_score: 80` (line 486 of `scan-for-smart-links/index.ts`), so there's no way to distinguish high-quality from low-quality anchors in the review UI.

2. **No specificity guidance in the AI prompt**: The system prompt asks for "natural phrases" but doesn't instruct the AI to prefer specific, distinguishing language over generic terms.

## Solution

### 1. Enhance the AI prompt to demand specificity

Update the system prompt in `scan-for-smart-links/index.ts` to:
- Explicitly forbid generic/vague anchors (e.g., "insurance coverage", "repair services")
- Require anchors to contain at least one word that distinguishes the target from other targets in the list
- Ask the AI to return a `confidence` score (1-100) per suggestion indicating how specific the anchor-to-target match is

### 2. Use AI confidence for relevance_score

Instead of hardcoding `relevance_score: 80`, use the AI's returned confidence value (clamped to 55-95 range) so the review UI shows meaningful differentiation.

### 3. Add a generic anchor filter in validation

Add a server-side check in `validateSuggestion()` that rejects anchors composed entirely of common/generic words. A small blocklist of overly broad terms (e.g., just "insurance", "dispute", "complaint", "repair", "service") will catch the worst offenders when they appear as the only meaningful word in a 2-word anchor.

## Technical Changes

### File: `supabase/functions/scan-for-smart-links/index.ts`

**A. Update AI prompt** (around line 198-210):

Add to the STRICT RULES section:
```
8. Anchors must be SPECIFIC to the target — avoid vague phrases like "insurance coverage" or "repair services" that could match multiple targets. Include at least one distinguishing word.
9. Return a "confidence" score (1-100) for each suggestion indicating how uniquely the anchor matches this specific target vs other targets.
```

Update the return format:
```
[{"anchor_text":"exact phrase","target_index":1,"section_heading":"section","reasoning":"brief reason","confidence":85}]
```

**B. Update AISuggestion interface** (line 22-27):

Add `confidence?: number` field.

**C. Update relevance scoring** (around line 477-488):

Replace hardcoded `80` with:
```typescript
relevance_score: Math.max(55, Math.min(95, suggestion.confidence || 75)),
```

**D. Add generic anchor filter** in `validateSuggestion()` (around line 269):

```typescript
// Reject 2-word anchors where one word is a stop word and the other is generic
const GENERIC_WORDS = new Set(['insurance','dispute','complaint','repair','service','services',
  'coverage','letter','rights','issue','issues','problem','problems','help','support']);
const meaningful = words.filter(w => w.length > 3 && !STOP_WORDS.has(w));
const allGeneric = meaningful.every(w => GENERIC_WORDS.has(w.toLowerCase()));
if (allGeneric && words.length <= 3) return false;
```

This will reject anchors like "robust insurance" (where "robust" is a vague modifier and "insurance" is generic) while keeping specific phrases like "homeowners insurance deductible" or "auto insurance fraud claim".

## Expected Impact

- Anchors will be more specific and distinguishing per target
- Relevance scores in the review UI will vary (55-95) instead of all showing 80%
- Generic 2-3 word anchors will be auto-rejected before reaching the review queue
- Better quality suggestions overall, reducing manual review time

