
# Fix: Restore 665+ Broken Blog Images

## What Happened

The image optimizer's "legacy cleanup" code (lines 236-241) deleted `-opt.jpg` files from storage. However, **665 blog posts** still reference these `-opt.jpg` URLs in their database records. The original files (`.png` extension) still exist and are valid -- they just need to be referenced correctly.

## Scope of Damage

| Column | Affected Posts |
|--------|---------------|
| `featured_image_url` | 665 |
| `middle_image_1_url` | 669 |
| `middle_image_2_url` | 300 |

Additionally, 467 posts have a separate pre-existing bug where URLs end in `.undefined` (broken file extension from the image generation code).

## Fix 1: Database URL Repair (Migration)

Run SQL to update all `-opt.jpg` references to point to the original `.png` files that still exist in storage:

```sql
-- Fix featured images: -opt.jpg -> .png
UPDATE blog_posts 
SET featured_image_url = REPLACE(featured_image_url, '-opt.jpg', '.png')
WHERE featured_image_url LIKE '%-opt.jpg';

-- Fix middle image 1: handle both -infographic-opt.jpg and -opt.jpg
UPDATE blog_posts 
SET middle_image_1_url = REPLACE(middle_image_1_url, '-opt.jpg', '.png')
WHERE middle_image_1_url LIKE '%-opt.jpg';

-- Fix middle image 2
UPDATE blog_posts 
SET middle_image_2_url = REPLACE(middle_image_2_url, '-opt.jpg', '.png')
WHERE middle_image_2_url LIKE '%-opt.jpg';
```

This works because:
- The original `.png` files still exist in storage (confirmed by fetching them)
- They contain valid JPEG image data (the optimizer overwrote them in-place with JPEG content)
- They are served with `Content-Type: image/jpeg` so browsers display them correctly

## Fix 2: Remove Legacy Cleanup Code (Edge Function)

Remove the dangerous "clean up legacy -opt.jpg" code from `processOneImage` in `optimize-storage-images/index.ts` (lines 236-241) so the optimizer never deletes files that might be referenced by blog posts.

## Fix 3: Fix `.undefined` URLs (Migration)

Separately fix the 467 posts with `.undefined` extensions. These files likely don't exist in storage at all (they were never properly saved). Set these URLs to NULL so they show a fallback instead of a broken image:

```sql
UPDATE blog_posts SET featured_image_url = NULL 
WHERE featured_image_url LIKE '%.undefined';

UPDATE blog_posts SET middle_image_1_url = NULL 
WHERE middle_image_1_url LIKE '%.undefined';

UPDATE blog_posts SET middle_image_2_url = NULL 
WHERE middle_image_2_url LIKE '%.undefined';
```

## Files to Change

| File | Change |
|------|--------|
| New migration | SQL to fix `-opt.jpg` and `.undefined` URLs |
| `supabase/functions/optimize-storage-images/index.ts` | Remove legacy `-opt.jpg` cleanup code (lines 236-241) |

## Impact

- ~665 broken featured images restored immediately
- ~669 broken middle images restored immediately
- 467 `.undefined` URLs cleaned up (will show fallback instead of broken image)
- Optimizer will never delete referenced files again
