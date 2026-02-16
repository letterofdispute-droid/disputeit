

# Fix: Ensure Fallback Sentence Logic is Actually Deployed and Running

## Root Cause

The code in the repository contains the fallback logic, but the **deployed** edge function is clearly not executing it. Proof:
- Articles with 12 paragraphs and only 3 existing links are being rejected with "Could not find suitable insertion point"
- These articles have plenty of eligible paragraphs for the fallback
- The only explanation is the deployed code does not include the fallback

This likely happened because the previous deployment failed silently or the running job cached an older version.

## Fix

### 1. Add diagnostic logging to `apply-links-bulk/index.ts`

Add `console.log` statements at key decision points in `insertLinkContextually` so we can verify via logs:
- Log when the function enters (with suggestion ID)
- Log when the duplicate URL check triggers (`return null`)
- Log the paragraph count and fallback eligibility count
- Log when the fallback sentence is used vs when it returns null

### 2. Force re-deploy the function

Use the deploy tool to push the function, ensuring the latest code (including fallback + logging) is live.

### 3. Reset rejected suggestions and re-run

After verifying the deployment via logs:
- Reset the 2,520 "Could not find suitable insertion point" rejections back to `approved`
- The user can then hit "Apply to Articles" again

## Technical Details

**Logging additions in `insertLinkContextually`:**

```typescript
// After line 316 (parseParagraphs)
console.log(`[INSERT] Suggestion ${suggestion.id}: ${paragraphs.length} paragraphs found`);

// After line 319 (duplicate check)  
console.log(`[INSERT] Suggestion ${suggestion.id}: duplicate URL, skipping`);

// Before line 363 (fallback section)
console.log(`[INSERT] Suggestion ${suggestion.id}: reaching fallback. Eligible: ${fallbackEligible.length}, relaxed: ${eligibleForFallback.length}`);

// At line 385 (final return null)
console.log(`[INSERT] Suggestion ${suggestion.id}: ALL paths exhausted, 0 eligible paragraphs`);
```

These logs will confirm whether the fallback is executing in the deployed version and why any remaining suggestions still fail.

## What stays the same
- All fallback logic remains as previously implemented
- Only diagnostic logging is added
- No changes to scoring, caps, or quality gates

