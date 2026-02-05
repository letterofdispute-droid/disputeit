
# Enforce Title Diversity: Eliminate Repetitive Patterns in AI Content

## Problem Identified

Your database contains 6 published articles that all start with variations of "Fed Up":
- "Fed Up? Here's a Sample Letter That Gets Your Contractor's Attention"
- "Fed Up? Here's the Complaint Letter That Got Results..."
- "Fed Up? Here's a Deposit Demand Letter That Actually Works"
- "Fed Up? This Example Letter Got Our Contractor to budge..."
- "Fed Up with Faulty Solar? See the Demand Letter..."
- "Fed up with poor workmanship? See a complaint letter..."

This is unacceptable AI-generated pattern behavior.

---

## Root Causes

1. **Weak Title Validation**: The current validation only checks that titles don't share the same first **3 words** - but "Fed Up? Here's" vs "Fed Up? This" both pass
2. **No Cross-Plan Checking**: New content plans don't validate against EXISTING published titles in the database
3. **No Banned Starter Phrases**: The AI keeps gravitating toward emotional hooks like "Fed Up?" because it's not explicitly forbidden
4. **Title Validation Only at Plan Creation**: Once a plan is created, there's no additional validation during article generation

---

## Solution: Multi-Layer Title Quality Enforcement

### Layer 1: Banned Title Starters
Create a list of overused title openers that AI keeps defaulting to:

```typescript
const BANNED_TITLE_STARTERS = [
  'fed up',
  'tired of',
  'sick of',
  'frustrated with',
  'had enough',
  'enough is enough',
  'stop letting',
  'don\'t let',
  'the ultimate',
  'the complete',
  'everything you need',
  'all you need to know',
  'a comprehensive',
];
```

### Layer 2: Cross-Database Deduplication
Before generating new titles, fetch existing blog post titles and ensure:
- No new title starts with the same first 2 words as any existing title
- No new title has more than 50% word overlap with existing titles

### Layer 3: Stricter AI Prompting
Update the system prompt with explicit anti-pattern rules:
- **FORBIDDEN**: Starting multiple titles with the same emotional hook
- **FORBIDDEN**: Using question marks in more than 25% of titles
- **REQUIRED**: At least 5 different first words across any 10 titles
- **REQUIRED**: Mix of declarative statements, questions, and action phrases

### Layer 4: Post-Generation Validation
Add a `validateTitle()` function that runs after AI generates titles:
- Reject titles matching banned starters
- Reject titles too similar to existing database content
- Force regeneration if validation fails

---

## Technical Implementation

### 1. Update `_shared/contentValidator.ts`

Add title validation alongside content validation:

```typescript
export const BANNED_TITLE_STARTERS = [
  'fed up', 'tired of', 'sick of', 'frustrated with',
  'had enough', 'enough is enough', 'stop letting',
  'the ultimate', 'the complete', 'everything you need',
  'all you need to know', 'a comprehensive guide',
];

export function validateTitle(
  title: string,
  existingTitles: string[]
): { isValid: boolean; reason?: string } {
  const lowerTitle = title.toLowerCase().trim();
  
  // Check banned starters
  for (const banned of BANNED_TITLE_STARTERS) {
    if (lowerTitle.startsWith(banned)) {
      return { isValid: false, reason: `Title starts with banned phrase: "${banned}"` };
    }
  }
  
  // Check first 2 words against existing titles
  const firstTwoWords = lowerTitle.split(' ').slice(0, 2).join(' ');
  for (const existing of existingTitles) {
    const existingFirst = existing.toLowerCase().split(' ').slice(0, 2).join(' ');
    if (firstTwoWords === existingFirst) {
      return { isValid: false, reason: `Title starts same as existing: "${existing}"` };
    }
  }
  
  return { isValid: true };
}
```

### 2. Update `generate-content-plan/index.ts`

Fetch existing titles from database before generating:

```typescript
// Fetch existing blog post titles for deduplication
const { data: existingPosts } = await supabaseAdmin
  .from('blog_posts')
  .select('title')
  .limit(500);

const existingTitles = existingPosts?.map(p => p.title) || [];
```

Update the AI prompt with stricter rules:

```typescript
const systemPrompt = `...

ABSOLUTE BANS - NEVER USE THESE TITLE STARTERS:
- "Fed Up" / "Fed up" / "Fed Up?"
- "Tired of" / "Sick of"
- "Frustrated with"
- "The Ultimate Guide"
- "The Complete Guide"
- "Everything You Need to Know"

MANDATORY VARIETY:
- Each title MUST start with a DIFFERENT word
- Maximum 2 titles can be questions (end with ?)
- Maximum 1 title can start with a number
- At least 2 titles must be declarative statements
- At least 1 title should reference specific law/regulation

EXISTING TITLES IN DATABASE (do NOT duplicate these patterns):
${existingTitles.slice(0, 20).map(t => `- ${t}`).join('\n')}
...`;
```

Add post-generation validation:

```typescript
// Validate each title against banned patterns and existing titles
const validatedArticles = [];
for (const article of generatedArticles) {
  const validation = validateTitle(article.title, existingTitles);
  if (!validation.isValid) {
    console.log('Rejecting title:', article.title, '-', validation.reason);
    continue;
  }
  // Also check against already-validated titles in this batch
  const batchValidation = validateTitle(
    article.title, 
    validatedArticles.map(a => a.title)
  );
  if (!batchValidation.isValid) {
    console.log('Rejecting duplicate in batch:', article.title);
    continue;
  }
  validatedArticles.push(article);
}
```

### 3. Update `bulk-generate-articles/index.ts`

Validate that the final generated title hasn't drifted back to banned patterns:

```typescript
// After AI generates content, validate the title
const finalValidation = validateTitle(parsedContent.title, existingDbTitles);
if (!finalValidation.isValid) {
  console.error('AI generated banned title pattern:', parsedContent.title);
  // Force a different title or mark as failed
  throw new Error(`Title validation failed: ${finalValidation.reason}`);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/_shared/contentValidator.ts` | Add `BANNED_TITLE_STARTERS` and `validateTitle()` function |
| `supabase/functions/generate-content-plan/index.ts` | Fetch existing titles, update AI prompt with explicit bans, add post-generation validation |
| `supabase/functions/bulk-generate-articles/index.ts` | Add final title validation check before saving |

---

## Expected Outcome

After implementation:
- No new articles will start with "Fed Up", "Tired of", or other banned emotional hooks
- Each content cluster will have genuinely diverse title structures
- New titles won't duplicate patterns from existing published content
- Failed validation will log clear reasons and skip problematic titles
- The AI receives explicit examples of what NOT to do

---

## Verification Checklist

After generating a new content cluster:
- No 2 titles share the same first 2 words
- Maximum 2 titles end with question marks
- No titles match banned starter phrases
- At least 3 different sentence structures (statement, question, number, how-to, action)
