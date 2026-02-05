

# Comprehensive Fix: Keywords, Naming & JSON Parsing

## Summary

Three issues to address:
1. **Keywords not validated** - AI is asked to use keywords but no verification or auto-remediation
2. **Naming inconsistency** - "Blog" vs "Knowledge Center" in navigation
3. **JSON parsing failures** - AI responses contain control characters causing `SyntaxError`

---

## Issue 1: Keyword Validation & Auto-Remediation

### Current Behavior
- Keywords are passed in the prompt: `"Naturally incorporate the primary keywords 2-3+ times each"`
- No post-generation check verifies keyword presence
- Keywords shown in queue may not appear in final article

### Solution: Two-Phase Generation

**Phase 1: Generate content with keyword instructions**
- Strengthen the prompt to explicitly require each keyword

**Phase 2: Validate & remediate if needed**
After generation, check keyword coverage. If any keywords are missing:
- Make a second AI call specifically to enhance the content
- Instruct AI to naturally weave in missing keywords
- Can modify existing paragraphs or add a new relevant section

```typescript
// After initial content generation
function validateKeywordUsage(content: string, keywords: string[]): {
  found: string[];
  missing: string[];
  coverage: number;
} {
  const lowerContent = content.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Check for whole word or phrase match
    if (lowerContent.includes(keywordLower)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  
  return {
    found,
    missing,
    coverage: keywords.length > 0 ? (found.length / keywords.length) * 100 : 100
  };
}

// If missing keywords, call remediation
async function remediateKeywords(
  apiKey: string,
  existingContent: string,
  missingKeywords: string[],
  articleTitle: string
): Promise<string> {
  const prompt = `You are editing an existing article to naturally incorporate missing keywords.

ARTICLE TITLE: "${articleTitle}"

MISSING KEYWORDS TO ADD: ${missingKeywords.join(', ')}

EXISTING CONTENT:
${existingContent}

INSTRUCTIONS:
1. Naturally weave each missing keyword into the content
2. You can either modify existing paragraphs or add 1-2 new paragraphs
3. Each keyword should appear at least once
4. Maintain the same tone and style
5. Keep the HTML structure intact
6. Return ONLY the updated HTML content - no explanations

OUTPUT: Updated HTML content with keywords integrated`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    console.log('Keyword remediation failed, using original content');
    return existingContent;
  }

  const data = await response.json();
  let updatedContent = data.choices[0]?.message?.content || existingContent;
  
  // Clean markdown if present
  if (updatedContent.startsWith('```html')) {
    updatedContent = updatedContent.slice(7);
  }
  if (updatedContent.endsWith('```')) {
    updatedContent = updatedContent.slice(0, -3);
  }
  
  return updatedContent.trim();
}
```

**Flow in bulk-generate-articles:**
```typescript
// After parsing content from AI...
const keywordValidation = validateKeywordUsage(
  parsedContent.content,
  item.suggested_keywords || []
);

console.log(`Keyword coverage: ${keywordValidation.coverage}%`);
console.log(`Found: ${keywordValidation.found.join(', ')}`);
console.log(`Missing: ${keywordValidation.missing.join(', ')}`);

// If keywords missing, remediate
if (keywordValidation.missing.length > 0) {
  console.log(`Remediating content to add missing keywords...`);
  parsedContent.content = await remediateKeywords(
    apiKey,
    parsedContent.content,
    keywordValidation.missing,
    parsedContent.title
  );
  
  // Re-validate after remediation
  const recheck = validateKeywordUsage(parsedContent.content, item.suggested_keywords || []);
  console.log(`After remediation: ${recheck.coverage}% coverage`);
}
```

---

## Issue 2: Naming Unification

### Current State
| Location | Current Text | URL |
|----------|-------------|-----|
| Hero badge | "Knowledge Center" | - |
| MegaMenu | "Blog" | /articles |
| Mobile menu | "Blog" | /articles |
| URL slug | - | /articles |

### Changes
Keep `/articles` URL (SEO continuity) but unify display name to **"Knowledge Center"**:

**MegaMenu.tsx (line 31):**
```typescript
{
  title: 'Knowledge Center',  // Changed from 'Blog'
  description: 'Tips, guides, and articles',
  href: '/articles',
  icon: BookOpen,
},
```

**Header.tsx (line 176-177):**
```typescript
<Link 
  to="/articles" 
  className="text-sm text-muted-foreground hover:text-foreground py-2"
  onClick={() => setOpen(false)}
>
  Knowledge Center  {/* Changed from 'Blog' */}
</Link>
```

---

## Issue 3: Robust JSON Parsing

### Root Cause
AI responses contain:
- Unescaped control characters (tabs, newlines inside strings)
- Malformed JSON structure
- Current code: `JSON.parse(cleanedContent)` fails immediately

### Solution: Multi-Layer JSON Sanitization

```typescript
function sanitizeJsonString(raw: string): string {
  // Step 1: Remove markdown code blocks
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  
  // Step 2: Fix control characters in string values
  // Replace actual newlines/tabs within strings with their escaped versions
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    switch (char) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      default: return ''; // Remove other control characters
    }
  });
  
  // Step 3: Fix trailing commas (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  
  return cleaned;
}

function parseAIResponse(content: string): any {
  // First attempt: direct sanitization
  let sanitized = sanitizeJsonString(content);
  
  try {
    return JSON.parse(sanitized);
  } catch (firstError) {
    console.log('First parse attempt failed, trying recovery...');
    
    // Second attempt: more aggressive cleanup
    // Try to extract just the JSON object
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (secondError) {
        console.error('Recovery parse also failed');
        throw new Error(`Failed to parse AI response: ${firstError.message}`);
      }
    }
    
    throw new Error(`Failed to parse AI response: ${firstError.message}`);
  }
}
```

**Replace line 619 in bulk-generate-articles:**
```typescript
// OLD:
const parsedContent = JSON.parse(cleanedContent);

// NEW:
const parsedContent = parseAIResponse(content);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/bulk-generate-articles/index.ts` | Add `sanitizeJsonString`, `parseAIResponse`, `validateKeywordUsage`, `remediateKeywords` functions; integrate into article processing loop |
| `src/components/layout/MegaMenu.tsx` | Change "Blog" to "Knowledge Center" (line 31) |
| `src/components/layout/Header.tsx` | Change "Blog" to "Knowledge Center" (line 176) |

---

## Expected Outcomes

1. **Keywords**: 
   - All specified keywords will appear in generated articles
   - If initial generation misses keywords, automatic remediation adds them
   - Logs show keyword coverage percentage

2. **Naming**:
   - Consistent "Knowledge Center" in all navigation
   - URL remains `/articles` for SEO

3. **JSON Parsing**:
   - Robust handling of AI formatting quirks
   - Fewer failed articles
   - Clear error messages when parsing still fails

---

## Technical Details

### Keyword Remediation Strategy

The remediation prompt instructs the AI to:
1. Read the existing content
2. Identify natural places to insert missing keywords
3. Either modify existing paragraphs or add new relevant paragraphs
4. Preserve HTML structure and tone

This ensures keywords are added contextually, not forced or awkward.

### JSON Sanitization Layers

1. **Layer 1**: Remove markdown code blocks
2. **Layer 2**: Escape actual control characters (newlines become `\n`)
3. **Layer 3**: Fix trailing commas
4. **Layer 4**: Extract JSON object if surrounded by text
5. **Fallback**: Throw clear error if unrecoverable

