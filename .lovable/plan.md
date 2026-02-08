
# Fix: Middle Image Section Missing + Draft Preview Not Working

## Issues Identified

### Issue 1: Middle Image Section Not Showing

**Root Cause:** The `MiddleImagePicker` component (in `src/components/admin/blog/MiddleImagePicker.tsx`) only displays when the article content contains specific placeholders:
- `{{MIDDLE_IMAGE_1}}`
- `{{MIDDLE_IMAGE_2}}`
- `{{MIDDLE_IMAGE}}`

The test article's content has only H2 headers and paragraphs - no image placeholders - so the component returns `null` and doesn't render.

**Solution:** Make the Middle Images section always visible in the editor for articles that support infographics (comparison, checklist, how-to, mistakes, rights types). This allows admins to generate infographics even when the content doesn't have explicit placeholders. The images will be auto-injected at display time using the existing smart injection logic in `ArticlePage.tsx`.

---

### Issue 2: Draft Preview Redirecting to Archive

**Root Cause:** The `ArticlePage.tsx` uses `window.location.search` directly instead of React Router's `useSearchParams` hook. This can cause timing issues where the search params aren't properly read during initial render, especially with lazy-loaded components.

Additionally, the query parameter check happens outside the component's reactive flow, which can lead to stale values.

**Solution:** Replace `window.location.search` with the proper `useSearchParams` hook from React Router for reliable query parameter handling.

---

## Changes

### File 1: `src/components/admin/blog/MiddleImagePicker.tsx`

**Change:** Update the visibility logic to show the component for infographic-eligible articles even without placeholders.

```typescript
// BEFORE (lines 40-46):
const hasPlaceholder1 = content.includes('{{MIDDLE_IMAGE_1}}') || content.includes('{{MIDDLE_IMAGE}}');
const hasPlaceholder2 = content.includes('{{MIDDLE_IMAGE_2}}');

// Don't render if no placeholders
if (!hasPlaceholder1 && !hasPlaceholder2) {
  return null;
}

// AFTER:
const hasPlaceholder1 = content.includes('{{MIDDLE_IMAGE_1}}') || content.includes('{{MIDDLE_IMAGE}}');
const hasPlaceholder2 = content.includes('{{MIDDLE_IMAGE_2}}');

// Check if this article type supports infographics
const supportsInfographic = articleType && INFOGRAPHIC_TYPES.includes(articleType);

// Show component if:
// 1. Content has placeholders, OR
// 2. Article type supports infographics (allow manual generation)
// 3. Already has middle images set
if (!hasPlaceholder1 && !hasPlaceholder2 && !supportsInfographic && !middleImage1Url && !middleImage2Url) {
  return null;
}

// If no placeholders but showing for infographic, default to single slot
const showSlot1 = hasPlaceholder1 || supportsInfographic || middleImage1Url;
const showSlot2 = hasPlaceholder2 || middleImage2Url;
```

This ensures the infographic button appears for how-to, comparison, checklist, mistakes, and rights article types.

---

### File 2: `src/pages/ArticlePage.tsx`

**Change:** Replace `window.location.search` with React Router's `useSearchParams` hook for proper reactivity.

```typescript
// BEFORE (lines 80-82):
const urlParams = new URLSearchParams(window.location.search);
const isPreviewMode = urlParams.get('preview') === 'true';

// AFTER:
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
// ... at top of component ...
const [searchParams] = useSearchParams();
const isPreviewMode = searchParams.get('preview') === 'true';
```

This ensures the preview mode is properly detected within React's rendering cycle.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/admin/blog/MiddleImagePicker.tsx` | Always show for infographic-eligible article types |
| `src/pages/ArticlePage.tsx` | Use `useSearchParams` instead of `window.location.search` |

---

## Expected Results

After these changes:

1. **Middle Image section will appear** in the blog editor for the test article (since it's a "how-to" type)
2. **Infographic button will be visible** allowing you to generate an infographic
3. **Draft preview will work** - clicking Preview will open the article with `?preview=true` and properly display the draft
4. Generated infographics will be auto-injected into the article at ~45% depth when displayed
