
# Download & Self-Host Category Images

## Current Problem

Pixabay's download URLs (`https://pixabay.com/get/...`) expire within ~24 hours, but the system caches them for 7 days. This causes broken images on category cards after the first day.

## Solution: Download & Self-Host

Instead of storing Pixabay URLs, we'll download the actual image and upload it to your existing `blog-images` storage bucket. This gives you:

- **Permanent URLs** that never expire
- **Full control** over image hosting
- **Proper alt tags** stored in the database for SEO and accessibility
- **Faster loading** from your own CDN
- **No external dependency** on Pixabay's URL availability

---

## Implementation

### Step 1: Update Edge Function to Download & Upload Images

The `fetch-category-images` function will be modified to:

1. Fetch image from Pixabay API (same as now)
2. Download the actual image binary data
3. Upload to `blog-images` storage bucket with organized path: `categories/{categoryId}/{contextKey}.jpg`
4. Generate SEO-friendly alt text from category name and search query
5. Store the permanent Supabase Storage public URL in database

### Step 2: Update Database Schema

Add an `alt_text` column to the `category_images` table:

```sql
ALTER TABLE category_images 
ADD COLUMN alt_text TEXT;
```

### Step 3: Update Frontend Hook

Modify `useCategoryImage` to return `altText` for proper accessibility.

---

## Technical Details

### Edge Function Flow

```text
1. Check cache in category_images table
   ↓ (if not cached or expired)
2. Call Pixabay API with search query
   ↓
3. Download image binary from webformatURL
   ↓
4. Upload to storage: blog-images/categories/{categoryId}/{contextKey}.jpg
   ↓
5. Generate alt text: "{categoryName} - {searchQuery}"
   ↓
6. Store public URL + alt text in category_images table
   ↓
7. Return permanent URL to frontend
```

### Storage Path Structure

```
blog-images/
├── categories/
│   ├── refunds/
│   │   └── category-card.jpg
│   ├── housing/
│   │   └── category-card.jpg
│   └── ...
```

### Alt Text Generation

Alt text will be auto-generated from the category metadata:

| Category | Search Query | Alt Text |
|----------|--------------|----------|
| refunds | shopping receipt | "Refunds & Purchases - shopping receipt imagery" |
| housing | apartment keys | "Landlord & Housing - apartment keys imagery" |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/fetch-category-images/index.ts` | Download image, upload to storage, generate alt text, store permanent URL |
| `src/hooks/useCategoryImage.ts` | Return `altText` from the hook |
| Database migration | Add `alt_text` column to `category_images` table |

---

## Database Cleanup After Deploy

After deploying, run this to clear old cached images and force refresh:

```sql
DELETE FROM category_images;
```

The new permanent URLs will be generated automatically when the homepage loads.

---

## Expected Result

- Category card images will use permanent URLs from your own storage
- Images will never expire or break
- Each image will have proper alt text for SEO and accessibility
- Existing `blog-images` bucket is reused (already public)
