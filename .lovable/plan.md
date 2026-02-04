
# Fix: Remove UK References from Content Generation

## Problem Identified

The screenshot shows "UK construction dispute help" appearing as a keyword in your content cluster. This is happening because `generate-content-plan/index.ts` contains multiple explicit UK references that override your US-first site context:

| Line | UK Reference |
|------|--------------|
| 50 | `'UK {topic} Laws: What Protects You'` - title variation |
| 172 | `'NHS'` - UK healthcare term |
| 270 | `"You are a UK-based SEO content strategist"` - system prompt |
| 284 | `"Include UK-specific references where relevant (Consumer Rights Act, etc.)"` |
| 299 | `'UK Consumer Rights After Shoddy Construction Work'` - example |
| 334 | `"UK-specific term 5"` - keyword instruction |

The shared `siteContext.ts` file is already correctly configured for US focus, but the content plan generator overrides it with UK-specific instructions.

---

## Solution

Update `supabase/functions/generate-content-plan/index.ts` to align with the US-first strategy documented in your site context.

---

## Changes Required

### 1. Fix Article Type Variations (Line 50)

**Before:**
```javascript
'UK {topic} Laws: What Protects You'
```

**After:**
```javascript
'US {topic} Laws: Your Rights Under Federal and State Law'
```

### 2. Fix Category Language - Healthcare (Line 172)

**Before:**
```javascript
healthcare: {
  terms: ['NHS', 'treatment', 'appointment', 'referral', 'complaint', 'care'],
```

**After:**
```javascript
healthcare: {
  terms: ['insurance', 'treatment', 'appointment', 'provider', 'complaint', 'care'],
```

### 3. Fix System Prompt (Lines 270-300)

**Before:**
```javascript
const systemPrompt = `You are a UK-based SEO content strategist...
...Include UK-specific references where relevant (Consumer Rights Act, etc.)
...GOOD EXAMPLES:
- "UK Consumer Rights After Shoddy Construction Work"
```

**After:**
```javascript
const systemPrompt = `You are a US-based SEO content strategist...
...Include US-specific references where relevant (FTC Act, Magnuson-Moss Warranty Act, state consumer protection laws, etc.)
...GOOD EXAMPLES:
- "Your Rights Under State Consumer Protection Laws After Shoddy Work"
```

### 4. Fix Keyword Instructions (Line 334)

**Before:**
```javascript
"keywords": ["long-tail keyword 1", "natural search phrase 2", "question keyword 3", "action keyword 4", "UK-specific term 5"]
```

**After:**
```javascript
"keywords": ["long-tail keyword 1", "natural search phrase 2", "question keyword 3", "action keyword 4", "US consumer rights term 5"]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-content-plan/index.ts` | Replace all UK references with US equivalents |

---

## Verification

After deployment:
1. Create a new content plan for any template
2. Verify all generated titles and keywords reference US laws/terminology
3. Confirm no UK-specific terms appear in the queue

---

## Technical Details

The root cause is that while `siteContext.ts` correctly establishes US focus, the `generate-content-plan` function was written with hardcoded UK references that bypass the shared context. This fix aligns the content planner with your established US-first strategy.

### US References to Use Instead

| UK Term | US Replacement |
|---------|----------------|
| Consumer Rights Act | FTC Act, Magnuson-Moss Warranty Act |
| UK | US, United States |
| NHS | Medicare, insurance provider, healthcare system |
| Trading Standards | State Attorney General, FTC |
| Ofcom | FCC |
| Financial Ombudsman | CFPB |
