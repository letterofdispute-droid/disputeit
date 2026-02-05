
# Fix: Remaining Article Generation Failure Points

## Issues Identified from Database

| Error Type | Example | Occurrences | Root Cause |
|------------|---------|-------------|------------|
| JSON Parse - Bad control char | `position 4368` | 1 | Escape sequence detection flaw |
| JSON Parse - Missing comma | `position 7310` | 1 | Unescaped quotes in HTML attributes |
| Duplicate slug constraint | `blog_posts_slug_key` | 1 | Race condition in slug generation |

## Root Cause Analysis

### Issue 1: Escape Sequence Detection Flaw

The current code at lines 160-174:
```typescript
// Current flawed logic
for (let i = 0; i < chars.length; i++) {
  const prevChar = i > 0 ? chars[i - 1] : '';
  if (prevChar === '\\') {
    fixed.push(char);
    continue;
  }
  // ...
}
```

**Problem**: When the AI outputs `\"` in the content, after `split('')`:
- Position N: `\`
- Position N+1: `"`

When we're at N+1, `prevChar` is `\`, so we skip... but then the original `\` at N was already pushed as-is, so we end up with `\"` which is correct. **BUT** when the AI outputs a raw newline character (ASCII 10), the logic processes it and outputs `\n`, which is two characters. On the *next* iteration, `prevChar` is `n` (not `\`), so subsequent characters aren't protected.

### Issue 2: Unescaped Quotes in HTML

The AI generates HTML like:
```json
"content": "<p class=\"intro\">Some text with \"quoted words\" here</p>"
```

The inner `"quoted words"` breaks JSON parsing because they're not escaped as `\"quoted words\"`.

### Issue 3: Slug Race Condition

```
Request A: generateUniqueSlug() → "my-article" (no collision)
Request B: generateUniqueSlug() → "my-article" (no collision yet)
Request A: INSERT blog_posts with slug "my-article" → SUCCESS
Request B: INSERT blog_posts with slug "my-article" → CONSTRAINT VIOLATION
```

The fix needs to retry the INSERT with a new slug, not just check beforehand.

---

## Solution: Three-Layer Defense

### Fix 1: Robust Escape Logic with State Tracking

Replace character-by-character with proper state machine:

```typescript
function fixControlCharacters(json: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    const code = char.charCodeAt(0);
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      result += char;
      continue;
    }
    
    // Only escape control characters INSIDE strings
    if (inString) {
      if (code === 0x0A) { result += '\\n'; continue; }
      if (code === 0x0D) { result += '\\r'; continue; }
      if (code === 0x09) { result += '\\t'; continue; }
      if (code < 0x20) { continue; } // Strip other control chars
    }
    
    result += char;
  }
  
  return result;
}
```

### Fix 2: Quote Sanitization in HTML Content

Add HTML quote escaping before JSON parse:

```typescript
// Fix unescaped quotes inside HTML attribute values
function fixHtmlQuotes(json: string): string {
  // Match "content": "..." and escape internal quotes
  return json.replace(
    /("content"\s*:\s*")(.+?)("\s*[,}])/gs,
    (match, prefix, content, suffix) => {
      // Escape quotes that aren't already escaped and aren't the string delimiters
      const fixed = content.replace(/(?<!\\)"/g, '\\"');
      return prefix + fixed + suffix;
    }
  );
}
```

### Fix 3: INSERT-Retry for Slug Collisions

Wrap the blog post insert in retry logic:

```typescript
async function insertBlogPostWithRetry(
  supabase: SupabaseClient,
  postData: any,
  maxRetries = 5
): Promise<{ data: any; error: any }> {
  let slug = postData.slug;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({ ...postData, slug })
      .select()
      .single();
    
    if (!error) {
      return { data, error: null };
    }
    
    // Check if it's a slug collision
    if (error.code === '23505' && error.message.includes('slug')) {
      attempt++;
      slug = `${postData.slug}-${attempt}`;
      console.log(`[SLUG_RETRY] Collision detected, trying: ${slug}`);
      continue;
    }
    
    // Other error - return immediately
    return { data: null, error };
  }
  
  return { 
    data: null, 
    error: { message: `Max slug retry attempts reached` } 
  };
}
```

---

## Files to Modify

### `supabase/functions/bulk-generate-articles/index.ts`

| Lines | Change |
|-------|--------|
| 117-129 | Add `fixHtmlQuotes()` function |
| 131-218 | Replace `parseAIResponse()` with state-machine approach |
| 82-111 | Remove `generateUniqueSlug()` - move logic to insert retry |
| 1050-1083 | Replace direct INSERT with `insertBlogPostWithRetry()` |

---

## Expected Results

| Failure Type | Before | After |
|--------------|--------|-------|
| Bad control char in JSON | Fails | State machine handles correctly |
| Missing comma/bracket | Fails | Quote sanitization prevents |
| Duplicate slug | Fails | Retry with `-1`, `-2` suffix |
| Overall failure rate | ~1-2% | <0.1% |

---

## Technical Notes

### State Machine vs Character-by-Character
The state machine approach tracks:
- `inString`: Whether we're inside a JSON string value
- `escapeNext`: Whether the previous character was a backslash

This correctly handles:
- `\"` inside strings (valid escape, preserve)
- Raw newlines inside strings (escape to `\n`)
- Backslashes before non-escape characters

### Why INSERT-Retry Instead of Pre-Check
The pre-check approach (`generateUniqueSlug`) has a TOCTOU (time-of-check to time-of-use) race condition. The INSERT-retry approach handles the constraint violation atomically at the database level.
