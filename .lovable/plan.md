

# Two Improvements: AI List Usage + Articles Page Redesign

## 1. AI Content: Encourage Bullet/Numbered Lists

The AI currently generates articles as walls of `<p>` tags. The fix is simple -- update the content generation prompts in both edge functions to explicitly instruct the AI to use `<ul>`/`<ol>` lists where appropriate.

### Changes:

**`supabase/functions/generate-blog-content/index.ts`** (standalone generator)
- Add a new instruction to the CONTENT REQUIREMENTS section: "Where content involves steps, tips, options, or enumerable items, present them as `<ul>` or `<ol>` lists instead of dense paragraphs. Lists improve readability and break up text."

**`supabase/functions/bulk-generate-articles/index.ts`** (~line 994-1000, content requirements)
- Same instruction added to the bulk generation system prompt.

This is a soft instruction ("where appropriate") so the AI will use lists when they naturally fit (actionable steps, rights, checklists) but still write flowing prose for narrative sections.

---

## 2. Articles Page Redesign

The current `/articles` page has a standard hero card + 3-column grid layout. Here's an alternate design inspired by modern editorial sites:

### New Layout: "Editorial Magazine" Style

**Hero Section** (keep existing dark header)
- No changes to the Knowledge Center header

**Featured Article** (redesigned)
- Full-width card with the image as a subtle background gradient overlay instead of a side-by-side split
- Title overlaid on a dark gradient at the bottom of the image (magazine cover style)
- Category badge + "Most Recent" badge floating top-left
- Read time and date at the bottom
- Height constrained to ~400px with the image covering the full card

**Article Grid** (redesigned from 3-column cards to mixed layout)
- First row: 2 large cards (50/50 split) with images on top, content below
- Remaining rows: 3-column grid with compact cards
- Each card has: image with aspect-ratio-video, category badge overlaid on the image (top-left), title (2-line clamp), excerpt (2-line clamp), author/date footer
- Hover effect: slight lift + primary border accent (keep existing)
- Remove the separate "More Articles" heading; use a subtle divider line instead

**Category Filter Bar** (enhanced)
- Sticky on scroll (sticky top with bg blur)
- Horizontal scrollable on mobile
- Active category gets a filled primary background instead of outline

**Visual Polish**
- Cards get a subtle gradient overlay on images (transparent to dark at bottom) for overlaid text
- Consistent rounded corners and shadow-sm baseline
- Pagination stays the same

### Files Modified:
- `src/pages/ArticlesPage.tsx` -- complete redesign of the page layout

### Technical Details:
- No new dependencies needed
- Uses existing Tailwind classes and UI components
- Image loading stays lazy
- Pagination logic unchanged
- Category filter and data fetching unchanged
