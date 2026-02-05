
# Fix: Robust JSON Parsing for Article Generation

## Root Cause Analysis

The article generation failures show errors like:
```
Expected ',' or '}' after property value in JSON at position 9268
```

This happens because the current `escapeControlCharsInStrings()` function tracks quote state naively:
```typescript
if (char === '"') {
  inString = !inString;  // ← This breaks on HTML attributes!
}
```

When AI generates HTML content like:
```html
<h2 class="section-title">Header</h2>
```

The `class="` quote makes the parser think the JSON string ended prematurely. The rest of the content gets mishandled, resulting in invalid JSON.

## Solution: Multi-Layer Parsing Strategy

Instead of trying to track string state (which is complex with nested quotes), use a more reliable approach:

### Strategy 1: Aggressive Global Replacement (Primary Fix)
Before attempting string-aware parsing, replace ALL literal newlines with `\n` in a first pass. This is safe because:
- JSON property names don't contain newlines
- Structural JSON doesn't need literal newlines (just for formatting)
- All content values benefit from having newlines escaped

### Strategy 2: Increase Token Limit
The current `max_tokens: 4000` may truncate long articles (1200+ words with HTML). Increase to 6000-8000 tokens.

### Strategy 3: Add More Recovery Layers
Add additional fallback attempts with progressively more aggressive fixes.

## Implementation

### File: `supabase/functions/bulk-generate-articles/index.ts`

**Changes to `parseAIResponse()` function (lines 142-179):**

```typescript
function parseAIResponse(content: string): any {
  if (!content) {
    throw new Error('Empty AI response');
  }
  
  console.log('AI response preview:', content.substring(0, 200));
  
  // Step 1: Remove markdown code blocks
  let sanitized = sanitizeJsonString(content);
  
  // Step 2: Try direct parse first (most responses are valid)
  try {
    return JSON.parse(sanitized);
  } catch (firstError) {
    console.log('First parse failed:', (firstError as Error).message);
    
    // Step 3: Try extracting JSON object
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    
    let extracted = jsonMatch[0];
    
    // Step 4: AGGRESSIVE APPROACH - Replace all literal control chars
    // This is safe because JSON structure doesn't need literal newlines
    let fixed = extracted
      .replace(/\r\n/g, '\\n')  // Windows line endings
      .replace(/\r/g, '\\n')    // Old Mac line endings
      .replace(/\n/g, '\\n')    // Unix line endings
      .replace(/\t/g, '\\t')    // Tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Other control chars
    
    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('Second parse failed:', (secondError as Error).message);
      
      // Step 5: Try fixing common JSON issues
      fixed = fixed
        .replace(/,\s*([\]}])/g, '$1')      // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"');    // Single to double quotes
      
      try {
        return JSON.parse(fixed);
      } catch (thirdError) {
        console.error('All parse attempts failed');
        console.error('Final content start:', fixed.substring(0, 500));
        throw new Error(`Failed to parse AI response: ${(firstError as Error).message}`);
      }
    }
  }
}
```

**Changes to increase token limit (line 835):**
```typescript
// Change from:
max_tokens: 4000,
// To:
max_tokens: 8000,
```

### Remove the `escapeControlCharsInStrings()` function
The complex string-state-tracking function (lines 68-126) can be removed since the new simpler approach handles all cases.

## Why This Fix Works

| Problem | Solution |
|---------|----------|
| AI generates HTML with quotes that break string tracking | Use global newline replacement (no string tracking needed) |
| Truncated responses due to token limit | Increase max_tokens to 8000 |
| Various JSON formatting issues | Multi-layer fallbacks with progressive fixes |

## Files to Modify

1. `supabase/functions/bulk-generate-articles/index.ts`
   - Remove `escapeControlCharsInStrings()` function (lines 68-126)
   - Rewrite `parseAIResponse()` with simpler, more robust logic
   - Increase `max_tokens` from 4000 to 8000 (line 835)

## After Implementation

Deploy the updated edge function and retry the failed articles.
