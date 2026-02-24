

# AI-Generated OG Images for All Pages

## Current State

- Blog articles already get unique AI-generated featured images via `generate-blog-image` edge function + Google Gemini
- All other pages (40+) fall back to `/ld-logo.svg` which most social platforms don't even render
- OG images need to be 1200x630 PNG/JPG for proper social sharing

## Strategy

Rather than generating 800+ unique images (expensive, slow), we generate **~50 distinct OG images** covering every page type, then map pages to the appropriate image:

| Page Group | Count | Image Strategy |
|------------|-------|----------------|
| Homepage | 1 | Unique hero-style image |
| Static pages (pricing, FAQ, about, contact, how-it-works, terms, privacy, disclaimer, cookie, deadlines, analyze-letter, consumer-news) | 12 | One unique image each |
| Category pages (13 categories) | 13 | One per category (reused by subcategory + guide + template pages in same category) |
| Small Claims hub + 3 tools | 4 | One each |
| State Rights hub | 1 | One generic |
| Do I Have a Case | 1 | One unique |
| **Total AI generations** | **~32** | |

Template pages, subcategory pages, guide pages, state pages, and state+category pages inherit their parent category's OG image. This is standard practice and keeps costs reasonable.

## Architecture

### 1. New Storage Bucket: `og-images`
Store generated OG images with predictable filenames like `homepage.jpg`, `pricing.jpg`, `category-housing.jpg`, `small-claims-hub.jpg`.

### 2. New Edge Function: `generate-og-images`
- Accepts a `pages` array (e.g., `[{ key: "homepage", title: "Letter of Dispute", description: "..." }]`)
- Uses Google Gemini (same as `generate-blog-image`) with a prompt optimized for 1200x630 social sharing images
- Uploads to `og-images` bucket with the key as filename
- Can generate one at a time or batch (with rate limiting delays)
- Returns the public URLs

### 3. New Database Table: `og_images`
Tracks which pages have generated OG images:
- `id` (uuid, PK)
- `page_key` (text, unique) - e.g., "homepage", "category-housing", "small-claims-cost-calculator"
- `image_url` (text) - public storage URL
- `prompt_used` (text) - for regeneration reference
- `created_at` / `updated_at`

### 4. Admin UI: "Generate OG Images" Button
Add a card/section to the Admin SEO Dashboard with:
- A "Generate All OG Images" button that triggers batch generation
- Status showing which images exist and which are missing
- Ability to regenerate individual images

### 5. Frontend: `SEOHead` Update
- Fetch OG images from the `og_images` table (cached via React Query)
- Create a helper hook `useOgImage(pageKey)` that returns the URL
- Each page passes its `pageKey` to determine which OG image to use
- Fallback chain: specific page image → category image → default image → logo SVG

### 6. Page Key Mapping Logic
```
/ → "homepage"
/pricing → "pricing"
/faq → "faq"
/templates/housing → "category-housing"
/templates/housing/repairs → "category-housing" (inherits)
/templates/housing/repairs/some-template → "category-housing" (inherits)
/guides/housing → "category-housing" (inherits)
/small-claims → "small-claims-hub"
/small-claims/cost-calculator → "small-claims-cost-calculator"
/state-rights → "state-rights"
/state-rights/california → "state-rights" (inherits)
/articles/consumer-rights/some-slug → uses featured_image_url (existing)
```

## Prompt Design

The prompts will request photorealistic 1200x630 images with:
- No text overlays (text gets added by social platforms from og:title)
- Professional stock-photo quality
- Topic-relevant imagery (e.g., housing → apartment/keys, vehicle → car/mechanic)
- Clean composition with space for platform overlays
- Consumer rights / legal advice theme

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-og-images/index.ts` | New edge function for batch OG image generation |
| `supabase/config.toml` | Add function config |
| Migration | Create `og_images` table + `og-images` storage bucket |
| `src/hooks/useOgImage.ts` | New hook to fetch OG image URL by page key |
| `src/components/SEOHead.tsx` | Integrate `useOgImage` for automatic OG image resolution |
| `src/pages/admin/SEODashboard.tsx` | Add OG image management section |
| All page files | Add `pageKey` prop or derive from `canonicalPath` (can be automatic) |

## Cost Estimate

~32 Gemini image generations at ~$0.02 each = ~$0.64 total. Regeneration on demand.

## Technical Details

- Images stored as JPG (smaller than PNG for photos) at 1200x630
- The `SEOHead` component can auto-derive the page key from `canonicalPath` so most pages need zero changes
- OG images are cached indefinitely in storage (no expiry)
- The hook uses a single query to fetch all OG images (small table, <50 rows) and caches client-side

