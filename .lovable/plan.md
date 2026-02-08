

# Smart Infographic Generation for Middle Images

## Overview

You're absolutely right - AI can generate contextual infographics, comparison charts, process diagrams, and visual explainers that add real value instead of generic stock photos. This is a high-value enhancement that will differentiate your content.

## How It Would Work

The system will intelligently decide **when** an infographic is appropriate based on article type, then generate a custom visual that matches the content.

### Article Types That Benefit Most

| Article Type | Infographic Style | Example |
|-------------|-------------------|---------|
| **Comparison** | Side-by-side chart | "Small Claims vs Civil Court: Which is Right for Your Case?" |
| **Checklist** | Visual checklist with checkboxes | "Pre-Filing Checklist: 8 Items to Gather" |
| **How-To Guide** | Step process diagram | "5-Step Dispute Resolution Process" |
| **Mistakes to Avoid** | Warning infographic with X marks | "Top 5 Claim Mistakes" |
| **Rights Explainer** | Timeline or hierarchy chart | "Your 30-Day Refund Rights Window" |
| **FAQ** | Q&A visual grid | Key questions answered visually |

### When NOT to Generate Infographics

- Case studies (personal stories work better with realistic photos)
- Sample/Example articles (letter examples are better as text)
- When the topic is too abstract or emotional

---

## Technical Architecture

```text
+---------------------------+
|    Content Generation     |
|     (bulk-generate)       |
+------------+--------------+
             |
             v
+---------------------------+
|   Analyze Article Type    |
|   + Extract Key Data      |
+------------+--------------+
             |
    +--------+--------+
    |                 |
    v                 v
+----------+    +------------+
| Standard |    | Infographic|
| Photo    |    | Generation |
+----------+    +------------+
    |                 |
    v                 v
+---------------------------+
|   Store in blog-images    |
|   bucket + save URL/alt   |
+---------------------------+
```

### New Edge Function: `generate-infographic`

This function will:

1. Receive article metadata (title, type, key data points)
2. Build a specialized prompt based on article type
3. Request Gemini to generate an infographic (not a photo)
4. Upload to storage and return URL

### Modified Content Generation Flow

In `bulk-generate-articles/index.ts`, after content generation:

1. Check if article type is "infographic-worthy" (comparison, checklist, how-to, mistakes)
2. Extract key data points from the generated content (e.g., comparison items, checklist items, process steps)
3. Call the infographic generator with this structured data
4. Use the infographic for middle image(s)

---

## Implementation Details

### 1. Create `supabase/functions/generate-infographic/index.ts`

**Key Features:**
- Accept article type, title, and extracted data points
- Build type-specific prompts (comparison vs checklist vs process)
- Request infographic-style generation from Gemini
- Upload to `blog-images` bucket
- Return URL and auto-generated alt text

**Prompt Strategy by Type:**

**Comparison:**
```
Generate a clean INFOGRAPHIC comparing:
- Option A: [extracted]
- Option B: [extracted]

Style: Professional side-by-side comparison chart
Colors: Blue vs Orange contrast
Include: Key differentiators, pros/cons icons
Format: 16:9 horizontal, clean white background
```

**Checklist:**
```
Generate a visual CHECKLIST INFOGRAPHIC:
Items: [8 extracted checklist items]

Style: Clean checkbox layout with icons
Colors: Green checkmarks, professional palette
Format: 16:9, numbered or bulleted items
```

**How-To Process:**
```
Generate a STEP-BY-STEP PROCESS INFOGRAPHIC:
Steps: [5 extracted steps]

Style: Flowchart or numbered progression
Colors: Gradient from start to finish
Include: Arrow connectors between steps
Format: 16:9 horizontal flow
```

### 2. Add Data Extraction Logic

Before image generation, extract structured data from content:

```typescript
function extractInfographicData(content: string, articleType: string): InfographicData | null {
  switch (articleType) {
    case 'comparison':
      // Extract Option A vs Option B points from content
      return extractComparisonPoints(content);
    
    case 'checklist':
      // Extract numbered/bulleted items
      return extractChecklistItems(content);
    
    case 'how-to':
      // Extract step headers (H2/H3 tags)
      return extractProcessSteps(content);
    
    case 'mistakes':
      // Extract mistake items
      return extractMistakesList(content);
    
    default:
      return null; // Use standard photo for other types
  }
}
```

### 3. Modify `bulk-generate-articles/index.ts`

Add decision logic after content generation:

```typescript
// Determine image strategy based on article type
const infographicTypes = ['comparison', 'checklist', 'how-to', 'mistakes'];
const useInfographic = infographicTypes.includes(queueItem.article_type);

if (useInfographic) {
  const infographicData = extractInfographicData(generatedContent, queueItem.article_type);
  if (infographicData) {
    // Generate infographic
    middleImage1Url = await generateInfographic(supabase, apiKey, {
      title: articleTitle,
      type: queueItem.article_type,
      data: infographicData
    });
  }
} else {
  // Use existing Pixabay photo flow
  middleImage1Url = await selectBestImage(supabase, apiKey, searchResults, title);
}
```

### 4. Update MiddleImagePicker for Manual Override

Add "Generate Infographic" button alongside existing photo selection:

```typescript
<Button onClick={handleGenerateInfographic}>
  <BarChart3 className="h-4 w-4" />
  Generate Infographic
</Button>
```

---

## Quality Control Considerations

### Accuracy Safeguards

Since you mentioned infographics need to be **accurate**, the system will:

1. **Extract data from generated content** - Not make up statistics
2. **Use only information from the article** - No external data claims
3. **Avoid numbers unless explicitly in content** - "5 Steps" is fine, "87% success rate" is not
4. **Focus on structure, not statistics** - Process flows, checklists, comparisons

### Fallback Strategy

If infographic generation fails or looks poor:
- System falls back to Pixabay photo (existing behavior)
- Admin can manually regenerate in editor

---

## Database Schema

No changes needed - existing columns are sufficient:
- `middle_image_1_url` - Store infographic URL
- `middle_image_1_alt` - Store infographic description

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-infographic/index.ts` | **Create** - New function for infographic generation |
| `supabase/functions/bulk-generate-articles/index.ts` | **Modify** - Add infographic decision logic and data extraction |
| `src/components/admin/blog/MiddleImagePicker.tsx` | **Modify** - Add "Generate Infographic" option |
| `supabase/config.toml` | **Modify** - Register new function |

---

## Cost Impact

- **Infographic generation**: Uses `google/gemini-2.5-flash-image` (same as current photo AI)
- **No additional API calls** when using Pixabay photos for non-applicable types
- **Estimated**: ~30-40% of articles would get infographics (comparison, checklist, how-to, mistakes types)

---

## Expected Outcome

| Before | After |
|--------|-------|
| Random "contractor in bathroom" photo | Comparison chart showing options |
| Generic stock photo | Visual checklist readers can reference |
| One-size-fits-all images | Type-appropriate visual content |
| Images add padding | Images add genuine value |

