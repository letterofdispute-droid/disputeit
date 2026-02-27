

## Fix: AI Analysis UX + Actionable Recommendations

### Problem 1: No feedback after AI Analysis completes
The mutation has an `onError` handler but **no `onSuccess`** handler. User clicks the button, it finishes silently, and stays on whatever tab they're on. They never know it worked.

### Problem 2: Results are read-only — no directed actions
Each recommendation card shows text but has no buttons to act on it. Users have to manually figure out what to do next.

### Implementation

**File: `src/components/admin/seo/SearchConsolePanel.tsx`**

1. **Add `onSuccess` to `recommendationsMutation`**:
   - Show a success toast summarizing findings count (e.g., "Found 5 uncovered queries, 3 quick wins, 2 warnings")
   - Auto-switch to the "opportunities" sub-tab so users immediately see results

2. **Add action buttons to Uncovered Queries cards**:
   - "Add to Queue" button — creates a content queue item with the suggested title, vertical, and article type pre-filled
   - "Add as Keyword" button — adds the query to the `keyword_targets` table

3. **Add action buttons to Quick Wins cards**:
   - "Apply Meta Tags" button — looks up the blog post by page URL/slug and updates `meta_title` and `seo_description` directly in the `blog_posts` table
   - Keep existing copy buttons as secondary actions

4. **Add action buttons to Position Opportunities cards**:
   - "Add to Queue" button — creates a content queue item targeting this query
   - "View Page" button — opens the existing page in a new tab

5. **Add action buttons to Cannibalization Warning cards**:
   - "View Pages" links — open each competing page in new tabs for manual review

6. **Add action buttons to Declining Queries cards**:
   - "Add to Queue" button — to create refresh/update content targeting the declining query

### Technical Details

- Action mutations use `supabase.from('seo_content_queue').insert(...)` and `supabase.from('keyword_targets').insert(...)` with appropriate conflict handling (`onConflict: 'keyword'`)
- Quick Win "Apply Meta Tags" extracts the slug from the page URL and updates via `supabase.from('blog_posts').update({ meta_title, seo_description }).eq('slug', extractedSlug)`
- Each action button shows a loading spinner while executing and a success toast on completion
- Buttons are disabled after successful action to prevent duplicates (track applied state locally via `useState<Set<number>>`)
- Query cache invalidation after mutations: `['seo-content-queue']`, `['keyword-targets']`, `['seo-metrics']`

