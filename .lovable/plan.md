

# Multiple Middle Images with Random Assignment

## Overview

Enhance the blog system to support **1-2 middle images** that are randomly assigned during content generation, adding visual diversity throughout articles.

---

## Current State

- Content generator inserts a single `{{MIDDLE_IMAGE}}` placeholder at ~40-50% of content
- No database columns exist to store middle image URLs
- No UI component for selecting middle images
- No rendering logic for the placeholder

---

## Solution Design

### Random Assignment Strategy

When generating content, the AI will randomly decide:
- **Option A (50% chance)**: Insert 1 middle image at ~45% through the content
- **Option B (50% chance)**: Insert 2 middle images at ~33% and ~66% through the content

Placeholders used:
- `{{MIDDLE_IMAGE_1}}` - First (or only) middle image
- `{{MIDDLE_IMAGE_2}}` - Second middle image (when applicable)

---

## Implementation Details

### Part 1: Database Migration

Add two new columns to `blog_posts`:

| Column | Type | Description |
|--------|------|-------------|
| `middle_image_1_url` | text, nullable | First in-content image URL |
| `middle_image_2_url` | text, nullable | Second in-content image URL |

### Part 2: Update Content Generator

Modify `generate-blog-content/index.ts`:

```text
AI Prompt Changes:
- Randomly choose between 1 or 2 middle images
- If 1 image: Insert {{MIDDLE_IMAGE_1}} at ~45% of content
- If 2 images: Insert {{MIDDLE_IMAGE_1}} at ~33% and {{MIDDLE_IMAGE_2}} at ~66%
- Each placeholder must be on its own line between paragraphs
```

### Part 3: Middle Image Picker Component

Create `MiddleImagePicker.tsx` that:
- Detects which placeholders exist in content (`{{MIDDLE_IMAGE_1}}`, `{{MIDDLE_IMAGE_2}}`)
- Shows separate image pickers for each detected placeholder
- Uses different Pixabay offsets for variety (e.g., offset 8-12 for middle images)
- Compact design since there may be 2 pickers

**UI Layout (when 2 middle images exist):**
```
┌────────────────────────────────────────┐
│ Middle Images                          │
│ These appear at placeholders in body   │
├────────────────────────────────────────┤
│ Image 1 (at ~33%)                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │ ✓  │ │    │ │    │ │    │          │
│ └────┘ └────┘ └────┘ └────┘          │
├────────────────────────────────────────┤
│ Image 2 (at ~66%)                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │    │ │    │ │ ✓  │ │    │          │
│ └────┘ └────┘ └────┘ └────┘          │
├────────────────────────────────────────┤
│ [Find More]              [Upload Both] │
└────────────────────────────────────────┘
```

### Part 4: Editor Integration

Update `AdminBlogEditor.tsx`:
- Add `middleImage1Url` and `middleImage2Url` state
- Detect placeholders in content to show appropriate pickers
- Save/load to database

### Part 5: Frontend Rendering

Update `ArticlePage.tsx` to replace placeholders:

```typescript
// Replace middle image placeholders with actual images
if (post.middle_image_1_url) {
  html = html.replace(
    /{{MIDDLE_IMAGE_1}}/g,
    `<figure class="my-8">
       <img src="${post.middle_image_1_url}" alt="" class="w-full rounded-xl shadow-md" />
     </figure>`
  );
} else {
  html = html.replace(/{{MIDDLE_IMAGE_1}}/g, '');
}

if (post.middle_image_2_url) {
  html = html.replace(
    /{{MIDDLE_IMAGE_2}}/g,
    `<figure class="my-8">
       <img src="${post.middle_image_2_url}" alt="" class="w-full rounded-xl shadow-md" />
     </figure>`
  );
} else {
  html = html.replace(/{{MIDDLE_IMAGE_2}}/g, '');
}

// Also handle legacy {{MIDDLE_IMAGE}} placeholder
html = html.replace(/{{MIDDLE_IMAGE}}/g, '');
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | CREATE | Add `middle_image_1_url` and `middle_image_2_url` columns |
| `supabase/functions/generate-blog-content/index.ts` | MODIFY | Add random 1-2 image placeholder logic |
| `src/components/admin/blog/MiddleImagePicker.tsx` | CREATE | New component for selecting 1-2 middle images |
| `src/pages/admin/AdminBlogEditor.tsx` | MODIFY | Add middle image state, detection, and component |
| `src/pages/ArticlePage.tsx` | MODIFY | Replace placeholders with actual images |

---

## Behavior Summary

| Scenario | Result |
|----------|--------|
| New content generation | AI randomly inserts 1 or 2 placeholders |
| Editing post with 1 placeholder | Show 1 image picker |
| Editing post with 2 placeholders | Show 2 image pickers |
| No placeholders in content | Hide middle image section |
| Images selected | Saved to database, rendered in article |
| Images not selected | Placeholders removed from rendered output |

---

## Expected Result

### Content Generation
- ~50% of articles get 1 middle image
- ~50% of articles get 2 middle images
- Natural distribution of visuals throughout content

### Blog Editor
- Compact image picker that adapts to placeholder count
- Each picker shows 4 Pixabay suggestions
- Different images suggested for each slot
- Upload option available

### Published Article
- Full-width, rounded images at placeholder locations
- Proper spacing and styling
- No visible placeholder text if images are missing

