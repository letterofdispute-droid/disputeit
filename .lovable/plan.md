

# Auto-Suggest Category & Tags on Post Load

## Problem

Currently, the category and tags have AI "sparkles" buttons that require manual clicking. The user wants these to be **automatically populated** when:
1. Opening an existing post that lacks category/tags
2. Creating a new post once title/content is available

## Solution Overview

Add automatic AI suggestion triggering in the `AdminBlogEditor` that:
1. Detects when category or tags are missing but content is available
2. Automatically calls the `suggest-category-tags` edge function
3. Pre-populates the fields without user intervention
4. Shows a subtle indicator that AI is working (loading state in sidebar)

---

## Implementation Details

### Changes to `AdminBlogEditor.tsx`

Add a new `useEffect` that triggers auto-suggestion:

```text
Trigger conditions:
- Title exists (minimum 10 characters)
- Content exists (minimum 50 characters) 
- Category is empty OR tags array is empty
- Not currently loading post data
- Not already auto-suggesting
```

**Behavior:**
1. Wait 1 second after conditions are met (debounce for typing)
2. Call `suggest-category-tags` edge function
3. If category is empty → auto-set the suggested category
4. If tags are empty → auto-add the 2 suggested tags
5. Show a brief toast: "AI filled in category and tags"

**Edge cases handled:**
- Skip if user already manually set category/tags
- Don't override existing selections
- Only run once per editing session (use ref to track)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User opens/creates post                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │ Title + Content  │                                          │
│  │ available?       │                                          │
│  └────────┬─────────┘                                          │
│           │ Yes                                                 │
│           ▼                                                     │
│  ┌──────────────────┐     ┌───────────────────────────────┐   │
│  │ Category empty?  │ Yes │ Auto-call AI suggestion       │   │
│  │ OR Tags empty?   │────▶│ Set category + add 2 tags     │   │
│  └────────┬─────────┘     │ Show "AI filled in fields" ✓  │   │
│           │ No            └───────────────────────────────┘   │
│           ▼                                                    │
│  ┌──────────────────┐                                          │
│  │ Skip auto-fill   │                                          │
│  │ (already set)    │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### New State & Refs in AdminBlogEditor

| State/Ref | Purpose |
|-----------|---------|
| `isAutoSuggesting` | Show loading indicator during auto-suggestion |
| `hasAutoSuggested` (ref) | Prevent running auto-suggest multiple times per session |

### Auto-Suggest Logic

```typescript
// New useEffect in AdminBlogEditor
useEffect(() => {
  // Skip if already ran, still loading, or no content
  if (hasAutoSuggested.current || isLoading) return;
  if (title.length < 10 || content.length < 50) return;
  
  // Skip if category AND tags are already set
  if (category && tags.length > 0) return;
  
  // Debounce to avoid triggering while typing
  const timer = setTimeout(async () => {
    hasAutoSuggested.current = true;
    setIsAutoSuggesting(true);
    
    try {
      const { data } = await supabase.functions.invoke('suggest-category-tags', {
        body: { title, content, availableCategories: [...] }
      });
      
      if (!category && data.suggestedCategory) {
        setCategory(data.suggestedCategory);
      }
      if (tags.length === 0 && data.suggestedTags?.length > 0) {
        setTags(data.suggestedTags.slice(0, 2));
      }
      
      toast({ title: '✨ AI filled in category & tags' });
    } catch (e) {
      // Silent fail - user can still manually set
    } finally {
      setIsAutoSuggesting(false);
    }
  }, 1000);
  
  return () => clearTimeout(timer);
}, [title, content, category, tags.length, isLoading]);
```

### UI Feedback

Add a subtle loading indicator in the sidebar when auto-suggesting:

```text
┌──────────────────────────────────────┐
│ Category                    ✨       │
│ ┌────────────────────────────────┐  │
│ │ Consumer Rights           ▼   │  │ ← auto-selected
│ └────────────────────────────────┘  │
│                                      │
│ AI analyzing content...              │ ← shown during auto-suggest
└──────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminBlogEditor.tsx` | Add auto-suggest useEffect, loading state, and category fetch for AI call |

---

## Behavior Summary

| Scenario | Result |
|----------|--------|
| New post, title + content entered | Auto-fill category + 2 tags after 1s |
| Editing post with missing category | Auto-suggest category only |
| Editing post with category but no tags | Auto-suggest 2 tags only |
| Editing post with both set | Skip auto-suggestion entirely |
| User manually sets before auto-suggest | Respects user's choice |

This eliminates the need to click any sparkles buttons - the AI works behind the scenes automatically.

