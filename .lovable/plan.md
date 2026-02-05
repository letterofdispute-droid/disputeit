

# Fix: Ensure Requested Article Count is Always Met

## Problem

When generating a content plan with a target of 7 articles (medium tier), the system:
1. Asks AI to generate exactly 7 titles
2. Validates each title against banned phrases and existing titles
3. Rejects titles that fail validation (e.g., 3 rejected for matching existing patterns)
4. Creates the plan with only 4 articles instead of 7

**Edge function logs confirm:**
```
Validated 4 unique titles from 7 generated
```

---

## Root Cause

The current flow generates only the exact number needed, with no buffer for rejected titles. When validation removes titles, there's no mechanism to generate replacements.

---

## Solution: Over-Generate + Retry Loop

### Strategy 1: Request 2x the Needed Titles
Ask AI to generate MORE titles than needed (e.g., 14 for a 7-article plan), then take the first N that pass validation.

### Strategy 2: Retry with Feedback
If first attempt yields fewer valid titles than needed, retry the AI request with specific feedback about what was rejected and why.

---

## Technical Implementation

### 1. Over-Generate Initial Titles

Change the AI request to generate 2x the required number:

```typescript
// Current: Generate exactly what's needed
const articleTypesToGenerate = ARTICLE_TYPES
  .filter(t => tierConfig.articleTypes.includes(t.id))
  .slice(0, tierConfig.articleCount);

// New: Generate 2x for buffer, but repeat article types if needed
const targetCount = tierConfig.articleCount;
const bufferMultiplier = 2;
const totalToGenerate = targetCount * bufferMultiplier;
```

Update the AI prompt:
```typescript
Generate ${totalToGenerate} unique article title ideas. I will select the best ${targetCount} that pass validation.
```

### 2. Add Retry Loop if Needed

After validation, if we have fewer valid titles than requested:

```typescript
const MAX_RETRIES = 2;
let retryCount = 0;
let validatedArticles = [];

while (validatedArticles.length < tierConfig.articleCount && retryCount < MAX_RETRIES) {
  // Generate titles
  const generated = await generateTitles(...);
  
  // Validate and merge with previous
  const newlyValidated = validateTitles(generated, existingTitles, validatedArticles);
  validatedArticles = [...validatedArticles, ...newlyValidated];
  
  if (validatedArticles.length < tierConfig.articleCount) {
    retryCount++;
    console.log(`Only ${validatedArticles.length} valid titles, retrying (${retryCount}/${MAX_RETRIES})...`);
    
    // Add rejected titles to prompt as negative examples
    const rejectedExamples = getRecentRejections();
  }
}

// Trim to exact count
validatedArticles = validatedArticles.slice(0, tierConfig.articleCount);
```

### 3. Update AI Prompt with Rejection Feedback

On retry, include specific feedback:
```typescript
const retryPrompt = `
PREVIOUS ATTEMPT REJECTED THESE TITLES (do NOT repeat similar patterns):
${rejectedTitles.map(r => `- "${r.title}" - Reason: ${r.reason}`).join('\n')}

Generate ${remaining} MORE unique titles that avoid these issues.
`;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-content-plan/index.ts` | Add over-generation buffer, implement retry loop, track rejections |

---

## Updated Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                Generate Content Plan (7 articles)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Request AI to generate 14 titles (2x buffer)             │
│     ↓                                                        │
│  2. Validate each title against:                             │
│     - Banned starter phrases                                 │
│     - Existing database titles (first 2 words)               │
│     - Current batch (no duplicates)                          │
│     ↓                                                        │
│  3. If valid count >= 7: Take first 7, create plan           │
│     ↓                                                        │
│  4. If valid count < 7: RETRY with feedback                  │
│     - Include rejected titles as negative examples           │
│     - Request only the remaining count needed                │
│     ↓                                                        │
│  5. After max 2 retries: Use what we have                    │
│     - Log warning if still under target                      │
│     ↓                                                        │
│  6. Create plan with validated articles                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Expected Outcome

After implementation:
- Medium tier (7) will reliably produce 7 valid titles
- High tier (10) will reliably produce 10 valid titles
- If under-generation still occurs after retries, clear logging will show why
- Toast will accurately report "Generated 7 article ideas" when requesting 7

