

# Fix: Hero Card Image Fit + Middle Image Caching Bug

## Issue 1: Hero Card on /articles - Image not filling container

The hero image container uses `h-[200px] md:h-auto`. On desktop, `h-auto` makes the image container match the content column height, but the image itself doesn't always fill it because the content column can be taller than the image's natural height.

**Fix:** Constrain the overall card height on desktop so the image always fills. Set `md:h-[280px]` on the entire grid (not the image container), and let the image container fill with `h-full`. This keeps the card compact and the image always fills its space.

- File: `src/pages/ArticlesPage.tsx`
- Change the grid div to have a fixed desktop height: `md:max-h-[300px]`
- Set the image container to `h-[200px] md:h-full` so it stretches to fill the card

## Issue 2: Middle images missing on first blog post load

The blog post query uses the global React Query `staleTime` of 5 minutes. When navigating between articles via SPA links, React Query may serve stale or transitional data, causing the `useMemo` that processes middle image placeholders to run before the full post data (with `middle_image_1_url`) is available. On refresh, a fresh fetch occurs and images appear correctly.

**Fix:** Override the query's caching behavior for the `blog-post` query to always fetch fresh data, ensuring middle image URLs are available on first render.

- File: `src/pages/ArticlePage.tsx`
- Add `staleTime: 0` and `refetchOnMount: true` to the `blog-post` query options
- This ensures every article page navigation triggers a fresh database fetch, guaranteeing middle image data is present on first render

### Technical Details

**ArticlesPage.tsx** - Hero card layout fix:
- Change the grid container to include `md:max-h-[300px] md:overflow-hidden`
- Set the image div to `h-[200px] md:h-full`
- This ensures the image always fills its half of the card

**ArticlePage.tsx** - Caching fix:
- Add `staleTime: 0` and `refetchOnMount: true` to the blog-post query
- This overrides the global 5-minute staleTime for individual article pages, similar to the pattern already used in admin queries

