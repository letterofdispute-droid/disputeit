
# Fix: Category Not Populating in Blog Editor

## Problem

The category dropdown appears empty when editing a blog post, even though the post has a category assigned ("Consumer Rights").

## Root Cause

There's a **data mismatch** between how the category is stored vs. how it's used:

| Where | Field | Value |
|-------|-------|-------|
| Database `blog_posts.category` | Name | `"Consumer Rights"` |
| `CategorySelect` component value | Slug | `"consumer-rights"` |

When editing a post, `AdminBlogEditor.tsx` loads `data.category` (the **name**), but the `<Select>` component matches against `category.slug`. Since `"Consumer Rights"` ≠ `"consumer-rights"`, no option is selected.

---

## Solution

Use `category_slug` instead of `category` when loading and storing the category value in the editor, since the `CategorySelect` component expects slugs.

---

## Changes Required

### File: `src/pages/admin/AdminBlogEditor.tsx`

**Line 126 - Change from category name to slug:**

```typescript
// Before
setCategory(data.category || '');

// After  
setCategory(data.category_slug || '');
```

This ensures the editor uses the slug value that matches what `CategorySelect` expects.

---

## Why This Works

The save function already correctly saves both fields:
```typescript
category,           // Will now be the slug (we can update this)
category_slug: category,  // Already uses the slug
```

We should also update the save to properly populate the `category` field with the display name:

**Lines 158-159 - Update save to populate category name:**

```typescript
// Before
category,
category_slug: category,

// After
category: categories.find(c => c.slug === category)?.name || category,
category_slug: category,
```

This requires passing `availableCategories` to the save function or fetching the name differently. 

**Simpler approach:** Just use `category_slug` for loading since that's the correct field to use with the slug-based dropdown.

---

## Technical Details

- The `CategorySelect` component correctly uses slugs as option values
- The database has both `category` (name) and `category_slug` (slug) fields
- This is a data loading issue, not a component issue
