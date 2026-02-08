
# Fix: Category Tier Settings Not Reflected in Template Coverage Map

## Problem Analysis

The database correctly shows `"ecommerce":"high"` was saved, but the Template Coverage Map still displays "Medium Value" for E-commerce.

### Root Cause

The global React Query caching configuration added in the performance optimization has a **5-minute staleTime**:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

This means:
1. When you save tier settings, `setQueryData` updates the cache
2. But when navigating to Template Coverage Map (different tab in SEO Dashboard), the component may remount with cached data
3. The 5-minute staleTime prevents automatic refetching, so stale data persists

## Solution

Override the global staleTime for the `category-tier-settings` query specifically, since this is an admin setting that should always reflect the latest saved value.

### Changes Required

| File | Change |
|------|--------|
| `src/hooks/useCategoryTierSettings.ts` | Add `staleTime: 0` and `refetchOnMount: true` to force fresh data on component mount |

## Technical Implementation

**In `useCategoryTierSettings.ts`, update the useQuery options:**

```tsx
const { data: tierSettings, isLoading } = useQuery({
  queryKey: ['category-tier-settings'],
  queryFn: async (): Promise<CategoryTierDefaults> => {
    // ... existing fetch logic
  },
  // Override global staleTime - admin settings should always be fresh
  staleTime: 0,
  refetchOnMount: true,
});
```

Additionally, update the mutation to use `invalidateQueries` alongside `setQueryData` for more robust cache synchronization:

```tsx
onSuccess: (newSettings) => {
  // Update cache immediately for optimistic UI
  queryClient.setQueryData(['category-tier-settings'], newSettings);
  // Also invalidate to ensure other components get fresh data
  queryClient.invalidateQueries({ queryKey: ['category-tier-settings'] });
  toast.success('Category tier settings saved');
},
```

## Why This Works

1. **`staleTime: 0`** - Data is considered immediately stale, so any refetch will fetch fresh data
2. **`refetchOnMount: true`** - Ensures the query refetches when Template Coverage Map mounts, even if cached data exists
3. **`invalidateQueries`** - Forces all components using this query to refetch, ensuring consistency across the admin dashboard

## Expected Behavior After Fix

1. Change E-commerce tier to "High Value" in Category SEO Settings
2. Click "Save Changes"
3. Navigate to Template Coverage tab
4. Template Coverage Map shows "High Value" badge for E-commerce immediately

## File Summary

| File | Action |
|------|--------|
| `src/hooks/useCategoryTierSettings.ts` | Add query options to override global cache settings |
