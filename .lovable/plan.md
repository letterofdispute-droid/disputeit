

# Template Page Improvements

## Current Issues Found

After auditing the template page layout, here is what I found:

1. **Form is buried**: The page currently renders in this order: Hero -> SEO Content (long section with 3 cards, 4 "How to" steps, tips, disclaimer) -> Separator -> Form. Users need to scroll past a lot of informational content before reaching the actual form.

2. **No quick-access CTA**: There is no button in the hero section to jump directly to the form.

3. **Width is constrained**: The SEO content uses `container-narrow` (max-w-4xl / ~896px) and the form uses `max-w-4xl` inside `container-wide`. The overall page width could be wider.

4. **Everything renders correctly**: The form, FAQ, Related Articles, and Related Templates all render properly -- it is just a layout/ordering concern.

## Proposed Changes

### 1. Add a "Create Your Letter" CTA Button in the Hero Section
Add a prominent button in the hero that smooth-scrolls to the form section. This gives users immediate access to the form without scrolling past all the SEO content.

- File: `src/pages/LetterPage.tsx`
- Add a Button with an `onClick` that scrolls to a `#create-letter` anchor on the form section
- Style it with `variant="accent"` to match the amber CTA pattern used across the site

### 2. Move the Form Above the SEO Content
Reorder the page sections so the form appears right after the hero, and the SEO content (informational cards, how-to steps, tips) sits below the form. This way:
- Users who want to take action immediately see the form first
- SEO content still exists on the page for crawlers and users who scroll further
- The page structure becomes: Hero -> Form -> SEO Content -> FAQ -> Related Articles -> Related Templates

### 3. Widen the Layout from max-w-4xl to max-w-5xl
- Change the form's inner `max-w-4xl` to `max-w-5xl` (1024px) in `LetterGenerator.tsx`
- Keep `container-wide` (max-w-7xl) as the outer wrapper -- this is already correct
- Change `container-narrow` to a custom `max-w-5xl` for the SEO content section in `LetterPage.tsx`
- This gives more breathing room to form fields and the 3-column card layout without going too wide for readability

### 4. Minor Audit Fixes
- The MethodologyBadge currently uses `max-w-2xl` which is narrower than the form -- widen it to match `max-w-5xl`
- The form heading section also uses `max-w-2xl` for centering -- keep this centered but remove the artificial width constraint

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/LetterPage.tsx` | Add CTA button in hero, reorder sections (form before SEO), widen SEO container, add `id="create-letter"` to form section |
| `src/components/letter/LetterGenerator.tsx` | Change `max-w-4xl` to `max-w-5xl` on line 114 |

## Result

After these changes, the page flow will be:
1. **Hero** with breadcrumbs, title, description, and a prominent "Create Your Letter" button
2. **Form** (immediately visible after hero -- the primary conversion point)
3. **SEO Content** (informational cards, how-to steps, tips -- good for SEO and users who want more context)
4. **FAQ** (structured data for Google)
5. **Related Articles** (interlinking)
6. **Related Templates** (interlinking)

