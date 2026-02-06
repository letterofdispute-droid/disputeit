

# Fix Category Images Not Showing

## Problem Analysis

The screenshot shows category cards with **gray placeholder backgrounds** instead of real images. Here's what's happening:

### Current System Architecture

The system was designed correctly to self-host images from Pixabay:

```text
User visits homepage
       ↓
LetterCategories.tsx renders 13 category cards
       ↓
Each CategoryCard calls useCategoryImage hook
       ↓
Hook checks database cache (category_images table)
       ↓
If no cache → Calls fetch-category-images edge function
       ↓
Edge function: Pixabay API → Downloads image → Uploads to blog-images bucket → Stores URL in cache
       ↓
Returns self-hosted URL (permanent, no 24h expiration)
```

### Why Images Aren't Loading

| Component | Status |
|-----------|--------|
| `blog-images` storage bucket | Exists, public |
| `category_images` database table | Exists, has 1 cached image |
| `fetch-category-images` edge function code | Exists in codebase |
| **Edge function deployment** | **NOT DEPLOYED (404 error)** |

The edge function **exists in code** but was **never successfully deployed** to the backend. When the frontend calls it, it gets a 404 error.

Current deployment attempts are timing out due to a platform issue.

---

## Solution Plan

### Phase 1: Deploy Edge Function (Immediate)

Once the platform deployment system recovers, deploy the `fetch-category-images` function:

```text
Edge function: fetch-category-images
Status: Code exists, needs deployment
Purpose: Downloads Pixabay images, uploads to Supabase Storage, caches URLs
```

### Phase 2: Add Fallback Images (Resilience)

Add local fallback images in case the edge function fails, so users always see something:

**Option A: Use bundled placeholder images**
- Add simple gradient or icon-based placeholder images to `/public/images/categories/`
- Fallback to these if the edge function call fails

**Option B: Use Pixabay URLs as temporary fallback**
- Allow direct Pixabay URLs as fallback (may expire after 24h, but better than nothing)

### Phase 3: Pre-populate Cache (Optional)

Run a one-time script to populate all 13 category images into the cache:
- Invoke the edge function for each category
- Ensures all images are self-hosted before users visit

---

## Technical Implementation

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useCategoryImage.ts` | Add fallback URL support when edge function fails |
| `src/components/home/LetterCategories.tsx` | Ensure graceful degradation with fallback |

### Hook Enhancement

```typescript
// In useCategoryImage.ts - add fallback when edge function fails
const FALLBACK_GRADIENTS = {
  'refunds': 'from-amber-600 to-orange-700',
  'housing': 'from-blue-600 to-indigo-700',
  // ... etc for all 13 categories
};

// If edge function fails, return a gradient fallback
if (fetchError && !data?.image) {
  setFallbackGradient(FALLBACK_GRADIENTS[categoryId] || 'from-gray-600 to-gray-800');
}
```

### Category Card Enhancement

```tsx
// Add gradient fallback
{!imageUrl && !isLoading && (
  <div 
    className={`absolute inset-0 bg-gradient-to-br ${fallbackGradient || ''}`}
    style={!fallbackGradient ? { backgroundColor: category.color } : undefined}
  />
)}
```

---

## Implementation Sequence

1. **Retry edge function deployment** - Platform issue may resolve
2. **Add fallback gradients** - Ensures cards always look good
3. **Test with deployed function** - Verify image caching works
4. **Pre-populate cache** - Run batch fetch for all 13 categories

---

## Verification Steps

After implementation:
1. Visit homepage and verify category cards show images (or attractive gradients)
2. Check `category_images` table has 13+ entries
3. Verify images are served from `koulmtfnkuapzigcplov.supabase.co/storage/...` (self-hosted)
4. Confirm no Pixabay URLs in cached entries (they expire)

