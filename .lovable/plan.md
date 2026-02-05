

# Fix: Stale Pixabay URLs in Category Card Cache

## What Happened

The self-hosting logic was deployed AFTER the category-card images were already cached. The timeline proves this:

| Time | Event | Result |
|------|-------|--------|
| Feb 4, 14:42 | Category cards fetched | Stored **Pixabay URLs** (old code) |
| Feb 4, 16:44 | Edge function updated | Self-hosting logic deployed |
| Feb 4, 16:44 | Category hero fetched | Stored **Supabase URLs** (new code) ✅ |

The proof is in the database - `category-hero` for housing uses the correct self-hosted URL, while all `category-card` entries use expired Pixabay URLs.

## Why Cache Isn't Auto-Healing

The edge function checks `expires_at` (Feb 11) before deciding to re-fetch. Since we set a 7-day expiry back then, the old Pixabay URLs are still being served from cache even though they're broken.

## Solution: Clear Stale Cache Entries

Delete the old entries so the next page load triggers fresh downloads through the (now working) edge function.

**SQL to execute:**
```sql
DELETE FROM category_images 
WHERE context_key = 'category-card'
  AND image_url LIKE 'https://pixabay.com/%';
```

This specifically targets:
- Only `category-card` context (the broken ones)
- Only entries with Pixabay URLs (not the working self-hosted ones)

## What Happens Next

1. User visits homepage
2. `useCategoryImage` hook finds no cached entry
3. Calls `fetch-category-images` edge function
4. Edge function downloads from Pixabay → uploads to Storage → saves self-hosted URL
5. Images work permanently (1-year expiry)

## Verification After Fix

After clearing, check that new entries have Supabase URLs:
```sql
SELECT category_id, image_url 
FROM category_images 
WHERE context_key = 'category-card'
LIMIT 5;
```

Should show:
```
image_url: https://koulmtfnkuapzigcplov.supabase.co/storage/v1/object/public/blog-images/categories/...
```

## Technical Notes

The code is correct - this was a deployment timing issue. The edge function at `supabase/functions/fetch-category-images/index.ts` correctly:
- Downloads images from Pixabay (line 130)
- Uploads to Supabase Storage (lines 138-143)
- Stores the permanent Supabase URL (line 185)
- Sets 1-year expiry for self-hosted images (line 191)

No code changes needed.

