
# AI-Enhanced Blog Editor & Article Formatting

## Overview

This plan addresses four key enhancements:
1. **AI Category Assignment** - Auto-detect and assign the most appropriate category based on content
2. **AI Tag Suggestions** - Suggest 2 relevant tags based on content
3. **Featured Image Picker with Pixabay** - Show 4 AI-preselected images with "Find More" option
4. **Frontend Article Formatting** - Enhanced display of lists, quotes, and formatted content

---

## Current State Analysis

### Image Generation Error
The `generate-blog-image` function is failing because it expects the image in `content[].image_url.url` but the response structure from Gemini Image model places images in `message.images[]`. The function parses incorrectly and throws "Unexpected response format".

### Existing Infrastructure
- `suggest-images` edge function already uses Pixabay + AI for keyword extraction
- `generate-seo` edge function demonstrates the AI pattern for content analysis
- `CategorySelect` fetches categories from `blog_categories` table
- `TagInput` manages tags and has existing suggestion placeholder text
- Article page uses `prose` classes but markdown-to-HTML conversion is basic

---

## Implementation Plan

### Part 1: AI Category & Tag Assignment

**Files to modify:**
- `src/components/admin/blog/CategorySelect.tsx`
- `src/components/admin/blog/TagInput.tsx`  
- `src/pages/admin/AdminBlogEditor.tsx`

**Changes:**

| Component | Enhancement |
|-----------|-------------|
| CategorySelect | Add "Suggest with AI" button that calls AI to analyze content and auto-select the best matching category |
| TagInput | Add "AI Suggest" button that generates 2 relevant tags based on title/content |
| AdminBlogEditor | Pass title/content to both components for AI analysis |

**New Edge Function: `suggest-category-tags`**
- Input: `{ title, content, categories: [{slug, name}] }`
- Output: `{ suggestedCategory: "slug", suggestedTags: ["tag1", "tag2"] }`
- Uses AI to analyze content and match against available categories

---

### Part 2: Featured Image Picker with Pixabay

**Files to modify:**
- `src/components/admin/blog/FeaturedImageUploader.tsx`

**New behavior:**
1. On component mount (if title exists), auto-fetch 4 AI-curated Pixabay images
2. Display 4 images in a 2x2 grid with selection capability
3. "Find More" button fetches 4 different images
4. Keep "Upload" button for manual upload
5. Remove broken "AI Generate" button (or fix it as secondary option)

**UI Layout:**
```
┌────────────────────────────────────────────────────────┐
│ Featured Image                                         │
├────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐                               │
│ │  img 1  │ │  img 2  │  ← 4 AI-curated Pixabay      │
│ │   ✓     │ │         │    images displayed           │
│ └─────────┘ └─────────┘                               │
│ ┌─────────┐ ┌─────────┐                               │
│ │  img 3  │ │  img 4  │                               │
│ │         │ │         │                               │
│ └─────────┘ └─────────┘                               │
├────────────────────────────────────────────────────────┤
│ [Find More]           [Upload Custom]                  │
└────────────────────────────────────────────────────────┘
```

**Edge function modification: `suggest-images`**
- Add parameter `count: number` to control how many images to return (default 4)
- Return exactly the requested count

---

### Part 3: Fix AI Image Generation (Optional Enhancement)

**File to modify:**
- `supabase/functions/generate-blog-image/index.ts`

**Fix:**
The current code looks for `content[].image_url.url` but the actual response structure is:
```json
{
  "choices": [{
    "message": {
      "images": [{ "type": "image_url", "image_url": { "url": "data:..." }}]
    }
  }]
}
```

Update the parsing logic to handle the correct response structure.

---

### Part 4: Frontend Article Formatting

**Files to modify:**
- `src/pages/ArticlePage.tsx`
- `src/index.css`

**Enhanced Prose Styling:**

Add comprehensive typography rules for:

| Element | Enhancement |
|---------|-------------|
| Blockquotes | Left border accent, italic text, proper padding, subtle background |
| Unordered lists | Custom bullet styling, proper spacing, nested list support |
| Ordered lists | Styled numbers, proper indentation, clear hierarchy |
| Code blocks | Distinct background, proper font, syntax styling |
| Horizontal rules | Styled dividers with proper spacing |
| Strong/Bold | Proper weight with foreground color |

**CSS additions to `src/index.css`:**
```css
.prose blockquote {
  @apply border-l-4 border-primary/30 pl-6 italic my-6 text-muted-foreground bg-muted/30 py-4 rounded-r-lg;
}

.prose ul {
  @apply list-disc pl-6 my-4 space-y-2;
}

.prose ol {
  @apply list-decimal pl-6 my-4 space-y-2;
}

.prose li {
  @apply text-muted-foreground leading-relaxed;
}

.prose li::marker {
  @apply text-primary;
}
```

**HTML Sanitizer update:**
Ensure `ArticlePage.tsx` sanitizer allows all necessary tags: `blockquote`, `hr`, `code`, `pre`, nested lists.

---

## Technical Details

### New Edge Function: `suggest-category-tags`

```typescript
// Input
{
  title: string;
  content: string;
  excerpt?: string;
  availableCategories: Array<{ slug: string; name: string }>;
}

// Output
{
  suggestedCategory: string; // category slug
  suggestedTags: string[];   // 2 tags
  confidence: number;        // 0-100
}
```

**AI Prompt Strategy:**
- Analyze title and first 1500 chars of content
- Match against available categories by semantic similarity
- Generate 2 highly relevant, specific tags (not generic)
- Return confidence score for UI feedback

### Updated CategorySelect Component

```typescript
interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;      // NEW: for AI analysis
  content?: string;    // NEW: for AI analysis
}
```

- Add sparkles button next to the dropdown
- On click, call edge function with content + available categories
- Auto-select the suggested category with toast notification

### Updated TagInput Component

```typescript
interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  title?: string;      // NEW: for AI analysis
  content?: string;    // NEW: for AI analysis
}
```

- Add "AI Suggest" button
- On click, generate 2 tags and auto-add them
- Prevent duplicates

### Updated FeaturedImageUploader Component

Replace current simple upload/generate with:
1. Auto-load 4 images when title is set
2. 2x2 grid display with selection
3. "Find More" refreshes with new images
4. "Upload Custom" for manual override
5. Selected image highlighted with checkmark

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/suggest-category-tags/index.ts` | CREATE | New edge function for AI category/tag suggestions |
| `supabase/functions/suggest-images/index.ts` | MODIFY | Add `count` parameter support |
| `supabase/functions/generate-blog-image/index.ts` | MODIFY | Fix response parsing for image generation |
| `src/components/admin/blog/CategorySelect.tsx` | MODIFY | Add AI suggest button with sparkles icon |
| `src/components/admin/blog/TagInput.tsx` | MODIFY | Add AI suggest button for 2-tag generation |
| `src/components/admin/blog/FeaturedImageUploader.tsx` | MODIFY | Complete redesign with 4-image grid + Find More |
| `src/pages/admin/AdminBlogEditor.tsx` | MODIFY | Pass title/content to CategorySelect and TagInput |
| `src/pages/ArticlePage.tsx` | MODIFY | Enhance sanitizer to allow all formatting tags |
| `src/index.css` | MODIFY | Add comprehensive prose styling for lists, quotes, etc. |
| `supabase/config.toml` | MODIFY | Add new edge function configuration |

---

## Expected Result

### Blog Editor
- Category dropdown with AI sparkles button that auto-selects best category
- Tags input with AI button that adds 2 relevant tags
- Featured image section showing 4 curated Pixabay options
- "Find More" button for alternative images
- Upload button preserved for custom images

### Article Display (Frontend)
- Beautiful blockquotes with left accent border and background
- Properly styled bullet and numbered lists with custom markers
- Clear visual hierarchy for nested content
- Professional typography matching the site's legal/professional theme
