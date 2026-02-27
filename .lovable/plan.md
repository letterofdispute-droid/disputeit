

## Fix: GSC Recommendations AI Analysis Failure

**Root cause**: `max_tokens: 4000` truncates the AI response mid-JSON. The `extractJson` repair function only handles simple truncation (missing closing bracket at the top level) but fails when truncation occurs inside nested arrays/objects.

### Implementation

**File: `supabase/functions/gsc-recommendations/index.ts`**

1. **Increase `max_tokens`** from 4000 to 8000 to reduce truncation likelihood.

2. **Rewrite `extractJson`** with a stack-based repair approach:
   - Find the JSON start (`{` or `[`)
   - Strip everything after the last valid closing bracket/brace
   - If JSON.parse still fails, walk the string tracking open brackets/braces, strip the last incomplete element (trailing comma + partial object/array/string), then append the required closing brackets in reverse stack order
   - Final cleanup: remove trailing commas before `}` or `]`, strip control characters

3. **Add response length logging** — `console.log('AI response length:', rawContent.length)` to help diagnose future truncation.

