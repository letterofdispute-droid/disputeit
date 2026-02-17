
# Fix List Rendering in Blog Posts

## Problem
Two issues with blog post lists:
1. **Stray `<br>` tags between `<li>` elements**: Line 292 of `ArticlePage.tsx` does `.replace(/\n/g, "<br>")` which converts ALL newlines to `<br>`, including those between list items inside `<ul>`/`<ol>`. This creates ugly spacing between bullets.
2. **List styling needs polish**: The current bullet and numbered list styles need refinement to feel premium.

## Changes

### 1. `src/pages/ArticlePage.tsx` (line ~292)
Add a cleanup step after the `<br>` replacement to strip `<br>` tags that appear between `</li>` and `<li>`, or between `</li>` and `</ul>`/`</ol>`, or between `<ul>`/`<ol>` and `<li>`:

```
// After the existing .replace(/\n/g, "<br>") on line 292, add:
.replace(/<br\s*\/?>\s*(?=<\/?(?:li|ul|ol)>)/gi, '')
.replace(/(<\/?(?:li|ul|ol)>)\s*<br\s*\/?>/gi, '$1')
```

This removes any `<br>` adjacent to list tags while preserving `<br>` in regular paragraphs.

### 2. `src/index.css` - Refine list styles
Update the `.prose ul` and `.prose ol` styles for a cleaner, more polished look:

- **Unordered lists**: Use a slightly larger, styled bullet with a subtle accent color and tighter vertical rhythm
- **Ordered lists**: Keep the numbered circle but refine sizing and alignment
- Ensure nested lists indent properly without extra spacing
- Add a subtle left-border treatment on list containers for visual hierarchy
