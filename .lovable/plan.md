
# Fix Plan: Blog Management Issues

## Issues Identified

1. **"Publish Selected" AbortError** - Publishing 100+ posts at once times out
2. **Mobile Layout Overflow** - Bulk action buttons overflow on small screens  
3. **SEO Dashboard "Published: 0"** - content_queue status not synced with blog_posts

---

## Solution Overview

```text
+------------------+     +------------------+     +------------------+
| Issue 1          |     | Issue 2          |     | Issue 3          |
| Batch Publishing |     | Mobile Layout    |     | Status Sync      |
+------------------+     +------------------+     +------------------+
         |                        |                        |
         v                        v                        v
+------------------+     +------------------+     +------------------+
| Split into       |     | Responsive flex  |     | Add query to     |
| batches of 50    |     | with wrap + stack|     | update queue     |
+------------------+     +------------------+     +------------------+
```

---

## Implementation Details

### 1. Fix Bulk Publish Timeout (AdminBlog.tsx)

**Problem**: Updating 100+ rows with `.in('id', [...100 ids])` causes AbortError when the request takes too long.

**Solution**: Batch updates into chunks of 50 items, processing sequentially.

```typescript
const handleBulkPublish = async () => {
  if (selectedIds.size === 0) return;
  
  setIsBulkPublishing(true);
  const idsArray = Array.from(selectedIds);
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorOccurred = false;
  
  // Process in batches
  for (let i = 0; i < idsArray.length; i += BATCH_SIZE) {
    const batch = idsArray.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        status: 'published', 
        published_at: new Date().toISOString() 
      })
      .in('id', batch);
    
    if (error) {
      errorOccurred = true;
      break;
    }
    successCount += batch.length;
  }
  
  // Show result and refresh
  if (errorOccurred) {
    toast({ title: 'Partial publish', description: `Published ${successCount} of ${selectedIds.size}` });
  } else {
    toast({ title: 'Published', description: `${successCount} posts published` });
  }
  
  setSelectedIds(new Set());
  fetchPosts();
  fetchDraftCount();
  setIsBulkPublishing(false);
};
```

### 2. Fix Mobile Button Overflow (AdminBlog.tsx)

**Problem**: Bulk actions bar uses `flex justify-between` without wrapping, causing overflow.

**Solution**: Add responsive stacking with `flex-col sm:flex-row` and `flex-wrap`.

```tsx
{/* Bulk Actions Bar - Fixed Layout */}
<Card className="mb-4 border-primary/50 bg-primary/5">
  <CardContent className="py-3 px-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="font-medium">{selectedIds.size} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={...}>Clear</Button>
        <Button variant="destructive" size="sm" onClick={...}>Delete</Button>
        <Button size="sm" onClick={handleBulkPublish}>Publish Selected</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3. Fix Content Queue Status Sync

**Problem**: When blog posts are published via AdminBlog, the corresponding `content_queue` items stay in "generated" status instead of updating to "published".

**Solution**: After publishing blog posts, also update the related content_queue items.

```typescript
// In handleBulkPublish, after updating blog_posts:
const { data: publishedPosts } = await supabase
  .from('blog_posts')
  .select('id')
  .in('id', batch);

if (publishedPosts?.length) {
  // Update content_queue where blog_post_id matches
  await supabase
    .from('content_queue')
    .update({ 
      status: 'published', 
      published_at: new Date().toISOString() 
    })
    .in('blog_post_id', publishedPosts.map(p => p.id));
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminBlog.tsx` | Batch publishing, mobile layout fix, queue sync |

---

## Technical Notes

- **Batch Size**: 50 items per batch prevents timeout while maintaining efficiency
- **Error Handling**: Partial publish is reported if any batch fails
- **Cache Invalidation**: React Query caches are invalidated after mutations
- **Mobile Breakpoint**: Uses `sm:` (640px) for responsive switch
