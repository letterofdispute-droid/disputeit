
# Improve Image Relevance for Blog Posts

## Problem

The image selection system produces irrelevant images because:

1. **Random "perspectives"** distort keyword extraction (e.g., "Focus on abstract concepts" for a practical consumer rights article)
2. **No visual concept extraction** - searches use raw titles/keywords that don't translate to good stock photos
3. **Basic relevance scoring** - only counts word matches, doesn't consider topic alignment
4. **Bulk generator uses poor search terms** like "refunds dispute" instead of visual concepts

---

## Solution

Rewrite the AI prompt to extract **topic-relevant visual concepts** instead of random creative keywords, and improve relevance scoring.

---

## Changes Required

### 1. Update `supabase/functions/suggest-images/index.ts`

**Remove random perspectives, add topic-focused extraction:**

```typescript
// BEFORE (lines 53-66)
const searchPerspectives = [
  'Focus on people and human elements...',
  'Focus on abstract concepts...',
  // ... 10 random perspectives
];
const randomPerspective = searchPerspectives[Math.floor(Math.random() * searchPerspectives.length)];

// AFTER - Remove entirely
```

**Rewrite AI prompt (lines 77-90):**

```typescript
// BEFORE
content: `You extract creative visual keywords for stock photo searches. 
${randomPerspective}. Return only 3-5 unique, specific visual keywords...`

// AFTER
content: `You extract the most relevant visual keywords for finding stock photos.
Given a topic about consumer disputes or complaints, identify 3-4 keywords that 
describe REAL, PHOTOGRAPHABLE scenes related to this topic.

Examples:
- "Credit card dispute letter" → "frustrated person computer credit card documents"
- "Landlord repair complaint" → "broken appliance apartment maintenance worker"
- "Product refund request" → "customer service desk returning package receipt"

Focus on: people in relevant situations, objects being discussed, settings where 
this situation occurs. Return ONLY the keywords, no explanation.`
```

**Improve relevance scoring (lines 172-178):**

```typescript
// BEFORE - basic word matching
const matchCount = topicWords.filter(word => 
  tagWords.some(tag => tag.includes(word) || word.includes(tag))
).length;
relevanceScore = Math.min(100, 60 + (matchCount * 15));

// AFTER - weighted scoring with partial matches
const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
const tagString = hit.tags.toLowerCase();

// Score based on: exact matches (high), partial matches (medium), related concepts
let score = 50;
for (const word of topicWords) {
  if (tagString.includes(word)) score += 12;
}
// Boost for consumer/dispute related tags
const relevantTags = ['document', 'paper', 'office', 'person', 'customer', 
  'service', 'computer', 'phone', 'letter', 'writing', 'business'];
for (const tag of relevantTags) {
  if (tagString.includes(tag)) score += 5;
}
relevanceScore = Math.min(100, score);
```

---

### 2. Update `supabase/functions/bulk-generate-articles/index.ts`

**Add AI-powered visual keyword extraction function:**

```typescript
async function extractVisualKeywords(
  apiKey: string,
  title: string,
  category: string
): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `Extract 3-4 visual keywords for a stock photo search. 
Focus on photographable scenes: people, objects, settings.
Example: "How to Write a Credit Card Dispute Letter" → "person typing letter computer frustrated"
Return ONLY keywords, no punctuation.`
          },
          {
            role: 'user',
            content: `Article: "${title}" (Category: ${category})`
          }
        ],
        temperature: 0.3,
        max_tokens: 30,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || title;
    }
  } catch (e) {
    console.log('Visual keyword extraction failed, using title');
  }
  return title;
}
```

**Use it for image fetching (around lines 375-412):**

```typescript
// Featured image - use AI-extracted visual keywords
const featuredSearchTerm = await extractVisualKeywords(
  apiKey,
  parsedContent.title,
  plan.category_id
);
const { url: featuredImageUrl } = await fetchAndUploadImage(
  supabaseAdmin,
  featuredSearchTerm,
  `articles/${slug}-featured`,
  parsedContent.title
);

// Middle images - also use AI extraction with different focus
if (hasMiddleImage1) {
  const middleSearchTerm = await extractVisualKeywords(
    apiKey,
    `${plan.category_id} ${item.suggested_keywords?.[0] || 'consumer help'}`,
    plan.category_id
  );
  // ...
}
```

---

## Summary of Improvements

| Before | After |
|--------|-------|
| Random "perspectives" distort searches | Topic-focused visual concept extraction |
| Searches for "creative" keywords | Searches for photographable scenes |
| Raw titles used in bulk generator | AI extracts visual keywords first |
| Basic word-matching scoring | Weighted scoring with consumer-relevant term boosts |
| High temperature (0.8) = random results | Lower temperature (0.3) = consistent, relevant results |

---

## Files to Modify

1. `supabase/functions/suggest-images/index.ts` - Fix keyword extraction and scoring
2. `supabase/functions/bulk-generate-articles/index.ts` - Add visual keyword extraction for image fetching
