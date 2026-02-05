
# Fix: Article Generation JSON Parsing Failures

## Root Cause Identified

The `sanitizeJsonString` function at lines 68-91 is breaking valid JSON by escaping ALL control characters globally, including:
- Newlines between JSON properties (structural whitespace)
- Carriage returns in the raw JSON format

When the function does:
```typescript
cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
  switch (char) {
    case '\n': return '\\n';  // ← This breaks JSON structure!
    ...
  }
});
```

It turns valid JSON like:
```json
{
  "title": "Test"
}
```

Into invalid JSON:
```
{\n  "title": "Test"\n}
```

Then `JSON.parse()` fails with "Expected property name at position 1" because after the `{`, it sees `\` instead of a property name.

---

## Solution

Replace the aggressive global sanitization with a smarter approach:

1. **First**: Try to parse the JSON as-is (after removing code blocks)
2. **If that fails**: Apply targeted sanitization only inside string values
3. **Add diagnostic logging**: Log the first 200 characters of AI response for debugging

### New Sanitization Strategy

```typescript
function sanitizeJsonString(raw: string): string {
  // Step 1: Remove markdown code blocks only
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  
  // Step 2: Fix trailing commas (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  return cleaned;
}

function parseAIResponse(content: string): any {
  if (!content) {
    throw new Error('Empty AI response');
  }
  
  // Log first 200 chars for debugging
  console.log('AI response preview:', content.substring(0, 200));
  
  // Step 1: Clean up markdown code blocks
  let sanitized = sanitizeJsonString(content);
  
  // Step 2: Try direct parse first (most responses are valid)
  try {
    return JSON.parse(sanitized);
  } catch (firstError) {
    console.log('First parse failed:', (firstError as Error).message);
    
    // Step 3: Try to extract JSON object and handle special cases
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    
    let extracted = jsonMatch[0];
    
    // Step 4: Fix common issues within strings only
    // Replace problematic control characters (except normal whitespace)
    // This targets only characters that would be invalid in JSON strings
    extracted = extracted.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    try {
      return JSON.parse(extracted);
    } catch (secondError) {
      console.error('Recovery parse failed:', (secondError as Error).message);
      console.error('Extracted JSON start:', extracted.substring(0, 300));
      throw new Error(`Failed to parse AI response: ${(firstError as Error).message}`);
    }
  }
}
```

### Key Changes

| Issue | Current Code | Fix |
|-------|--------------|-----|
| Escaping structural newlines | `\n` → `\\n` globally | Don't replace `\n`, `\r`, `\t` at all |
| Missing validation | No check for empty content | Add `!content` check |
| No debugging info | No logging of actual response | Log first 200 chars |
| Overly broad regex | Matches all control chars | Only match truly invalid chars (0x00-0x08, etc.) |

---

## File to Modify

| File | Changes |
|------|---------|
| `supabase/functions/bulk-generate-articles/index.ts` | Rewrite `sanitizeJsonString` and `parseAIResponse` functions (lines 68-120) |

---

## Technical Details

### Control Characters Reference

- `\x00-\x08`: NULL through BACKSPACE (truly invalid)
- `\x09` (`\t`): Tab - valid in JSON whitespace
- `\x0A` (`\n`): Newline - valid in JSON whitespace
- `\x0B-\x0C`: Vertical tab, form feed (invalid in JSON)
- `\x0D` (`\r`): Carriage return - valid whitespace
- `\x0E-\x1F`: Other control chars (invalid)
- `\x7F`: DEL (invalid)

The new regex `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g` only removes truly problematic characters while preserving structural whitespace.

---

## Expected Outcome

After this fix:
- JSON with normal whitespace parses correctly on first attempt
- Diagnostic logging shows what the AI actually returned
- Only truly invalid control characters are stripped
- Fewer failed articles, clearer error messages when failures occur
