
# Fix: Complete JSON Parsing Solution for Article Generation

## Problem Analysis

The logs show repeated failures with "Bad control character in string literal in JSON" at various positions. This happens because:

1. **The AI generates HTML content with literal newlines INSIDE JSON string values**
2. **Valid JSON requires newlines inside strings to be escaped as `\n`**
3. **The previous fix incorrectly preserved raw control characters thinking they were structural JSON whitespace**

### Example of the Problem
```json
{
  "content": "<h2>Title</h2>
<p>Paragraph</p>"    // ← Raw newline inside string = INVALID JSON
}
```

### What Valid JSON Looks Like
```json
{
  "content": "<h2>Title</h2>\n<p>Paragraph</p>"  // ← Escaped = VALID
}
```

---

## Solution: Two-Phase Parsing Strategy

We need a more sophisticated approach that:

1. **First try**: Parse as-is (for well-formed AI responses)
2. **Fallback**: Use a regex-based approach to properly escape control characters ONLY inside string values

### New Parsing Logic

```typescript
function parseAIResponse(content: string): any {
  if (!content) {
    throw new Error('Empty AI response');
  }
  
  console.log('AI response preview:', content.substring(0, 200));
  
  // Step 1: Remove markdown code blocks
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  
  // Step 2: Fix trailing commas
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  // Step 3: Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    console.log('First parse failed:', (firstError as Error).message);
    
    // Step 4: Extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in AI response');
    }
    
    let extracted = jsonMatch[0];
    
    // Step 5: AGGRESSIVE string sanitization
    // Replace control characters with their escaped versions
    // This handles newlines, tabs, etc. that appear inside string values
    extracted = extracted
      .replace(/\r\n/g, '\\n')      // Windows line endings
      .replace(/\r/g, '\\n')        // Old Mac line endings  
      .replace(/\n/g, '\\n')        // Unix line endings
      .replace(/\t/g, '\\t')        // Tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Other control chars
    
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

Wait - this approach would also escape the structural newlines between JSON properties, which is wrong.

### Better Approach: String-Aware Escaping

We need to only escape control characters that are inside quoted strings, not structural JSON whitespace.

```typescript
function escapeControlCharsInStrings(json: string): string {
  let result = '';
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const code = json.charCodeAt(i);
    
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      result += char;
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    // If inside a string, escape control characters
    if (inString) {
      if (code === 0x0A) { // \n
        result += '\\n';
      } else if (code === 0x0D) { // \r
        result += '\\r';
      } else if (code === 0x09) { // \t
        result += '\\t';
      } else if (code < 0x20 || code === 0x7F) {
        // Skip other control characters
        continue;
      } else {
        result += char;
      }
    } else {
      // Outside string, keep as-is (structural whitespace is fine)
      result += char;
    }
  }
  
  return result;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/bulk-generate-articles/index.ts` | Rewrite `sanitizeJsonString()` and `parseAIResponse()` functions (lines 68-119) with the string-aware escaping logic |

---

## Additional Fixes: Deploy All Edge Functions

All edge functions will be deployed together to ensure production readiness:

1. `bulk-generate-articles` - Fixed JSON parsing
2. `generate-content-plan` - Already fixed
3. `generate-blog-content` - Word count enforcement
4. All other functions (17 total)

---

## Technical Details

### Why This Works

The key insight is that:
- Structural JSON whitespace (between `{}`, after `:`, after `,`) can contain raw `\n`, `\r`, `\t`
- String values (inside `"..."`) MUST have control characters escaped as `\n`, `\r`, `\t`

The string-aware parser tracks whether we're inside a quoted string and only escapes control characters in that context.

### Control Character Reference

| Character | Code | Inside String | Outside String |
|-----------|------|---------------|----------------|
| Newline | 0x0A | Must escape to `\n` | Valid whitespace |
| Carriage Return | 0x0D | Must escape to `\r` | Valid whitespace |
| Tab | 0x09 | Must escape to `\t` | Valid whitespace |
| Other (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F) | - | Invalid, remove | Invalid, remove |

---

## Expected Outcome

After this fix:
- AI responses with embedded newlines in HTML content parse correctly
- Structural JSON formatting is preserved
- All edge functions are deployed and production-ready
- Failed articles can be retried successfully
