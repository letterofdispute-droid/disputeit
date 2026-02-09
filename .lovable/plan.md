
# Fix: Queue Published Count + Blog Posts Published Count

## Problem
The SEO Queue tab shows "Published: 318" which only reflects items tracked in the `content_queue` table. The actual `blog_posts` table has 753 published posts. These numbers diverge because many posts were published directly or before the queue system existed.

## Solution

### 1. Queue Stats: Show actual published blog post count
**File: `src/hooks/useQueueStats.ts`**
- Add a second query to count published posts from the `blog_posts` table (`status = 'published'`, count only, head request)
- Replace the `published` stat with this real count from `blog_posts`
- Keep the queue-specific statuses (queued, generating, generated, failed) from `content_queue` as they are -- those are accurate for queue operations

### 2. Blog Posts page: Add published count to header
**File: `src/pages/admin/AdminBlog.tsx`**
- Fetch published count alongside the existing draft count (similar pattern -- `select('*', { count: 'exact', head: true }).eq('status', 'published')`)
- Update the subtitle from `"755 total posts . 2 drafts"` to `"755 total posts . 753 published . 2 drafts"`

## Technical Details

**useQueueStats.ts** changes:
```typescript
// Add parallel query for actual published blog posts
const [queueData, publishedCount] = await Promise.all([
  supabase.from('content_queue').select('status'),
  supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published')
]);
// Use publishedCount.count for stats.published instead of counting queue items
```

**AdminBlog.tsx** changes:
- Add `publishedCount` state alongside existing `draftCount`
- Fetch in `fetchPublishedCount` (same pattern as `fetchDraftCount`)
- Display: `{totalCount} total posts . {publishedCount} published . {draftCount} drafts`

Both changes are minimal -- no new components, no layout changes.
