
# Fix: Images Not Showing on First Page Load

## Problem Analysis

Based on reviewing the code and session replay, the issue is a **race condition in the loading state initialization**:

### Current Flow (Broken)

```text
1. CategoryCard renders
2. useCategoryImage hook initializes with: isLoading=FALSE, image=NULL
3. Component renders with NO loading indicator, NO image
4. useEffect fires (async)
5. setIsLoading(true) happens
6. Loading indicator appears
7. Image fetches from cache
8. Image displays
```

The problem is step 2-3: there's a brief moment where `isLoading` is false but there's no image yet, causing a flash of empty content.

### Current Rendering Logic (lines 35-57 of LetterCategories.tsx)

```tsx
{/* Only shows image if imageUrl exists */}
{imageUrl && (
  <img src={imageUrl} ... />
)}

{/* Only shows loading if isLoading AND no imageUrl */}
{isLoading && !imageUrl && (
  <div className="animate-pulse" />
)}

{/* Fallback only if no image AND not loading */}
{!imageUrl && !isLoading && (
  <div className="fallback gradient" />
)}
```

On first render: `isLoading=false`, `imageUrl=null` → shows fallback gradient briefly, then switches to loading, then to image. This creates a visual "flash".

---

## Solution

**Initialize `isLoading` to `true`** in the `useCategoryImage` hook when valid parameters are provided. This ensures the loading state shows immediately while waiting for the cache check.

### File Changes

| File | Change |
|------|--------|
| `src/hooks/useCategoryImage.ts` | Initialize `isLoading` to `true` when categoryId and searchQuery exist |

---

## Technical Implementation

### Before (Current)

```tsx
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  if (!categoryId || !searchQuery) {
    return;
  }
  // ...
  const fetchImage = async () => {
    setIsLoading(true);  // Too late! Component already rendered
    // ...
  };
  fetchImage();
}, [categoryId, searchQuery, contextKey, categoryName]);
```

### After (Fixed)

```tsx
// Initialize loading state based on whether we have valid params
const [isLoading, setIsLoading] = useState(() => {
  // If we have valid params and no cached image, start in loading state
  if (categoryId && searchQuery) {
    const cacheKey = `${categoryId}-${contextKey}`;
    return !imageCache.has(cacheKey);
  }
  return false;
});

useEffect(() => {
  if (!categoryId || !searchQuery) {
    setIsLoading(false);
    return;
  }
  
  const cacheKey = `${categoryId}-${contextKey}`;
  
  // Check in-memory cache first - if found, no loading needed
  if (imageCache.has(cacheKey)) {
    setImage(imageCache.get(cacheKey)!);
    setIsLoading(false);
    return;
  }
  
  // Only set loading if not already loading
  setIsLoading(true);
  
  const fetchImage = async () => {
    // ... rest of fetch logic
  };
  fetchImage();
}, [categoryId, searchQuery, contextKey, categoryName]);
```

---

## Additional Fix: TrustBadgesStrip Ref Warning

The console shows a warning about refs being passed to `TrustBadgesStrip`. While investigating, I found the Footer uses this component. Although no explicit ref is passed, some parent components may be attempting to forward refs.

### Solution: Wrap with forwardRef

```tsx
import { forwardRef } from 'react';

const TrustBadgesStrip = forwardRef<HTMLDivElement, TrustBadgesStripProps>(
  ({ variant = 'default', className, badges }, ref) => {
    // ... existing implementation
    return (
      <div ref={ref} className={...}>
        {/* existing content */}
      </div>
    );
  }
);

TrustBadgesStrip.displayName = 'TrustBadgesStrip';
```

---

## Expected Behavior After Fix

```text
1. CategoryCard renders
2. useCategoryImage initializes with: isLoading=TRUE (no cache hit)
3. Component shows loading indicator immediately
4. useEffect fires
5. Image fetches from database cache
6. Image displays smoothly
```

For returning users (in-memory cache populated):

```text
1. CategoryCard renders
2. useCategoryImage initializes with: isLoading=FALSE (cache hit detected)
3. useEffect fires, finds cache, sets image immediately
4. Image displays instantly
```

---

## Summary

| Issue | Fix |
|-------|-----|
| Flash of empty content | Initialize `isLoading` based on cache state |
| Console ref warning | Add `forwardRef` to TrustBadgesStrip |
