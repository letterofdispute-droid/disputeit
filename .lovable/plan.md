

# Fix: Published Post Count Mismatch

## The Problem

The SEO Command Center shows **3,006 "Articles Generated"** while Blog Posts shows **2,572 published**. These numbers should be consistent but they're mixing two different data sources:

- `generated` count comes from `content_queue` table (434 items with status "generated")
- `published` count comes from `blog_posts` table (2,572 published posts)
- The dashboard adds them: 434 + 2,572 = 3,006 -- this is wrong

The `content_queue` table has its own `published` status (2,122 items), which is the correct number to pair with its `generated` count.

## Solution

Update `useQueueStats` to fetch `published` from `content_queue` instead of `blog_posts`, keeping all pipeline stats from the same source. Then add a separate `blog_posts` published count for the CoverageStats card that needs the real published number.

### Changes

**File: `src/hooks/useQueueStats.ts`**
- Change the `published` query from `blog_posts` to `content_queue` where `status = 'published'`
- Add a new field `blogPublished` that queries `blog_posts` for the real published count

**File: `src/components/admin/seo/CoverageStats.tsx`**
- Use `blogPublished` for the "Articles Generated" description line showing published count
- This ensures the numbers shown match what the Blog Posts page reports

### Result

| Metric | Before | After |
|--------|--------|-------|
| Articles Generated | 3,006 (wrong) | 2,556 (434 generated + 2,122 queue-published) |
| Published shown | 2,572 (from wrong source) | 2,572 (from blog_posts, correctly labeled) |

Both pages will show consistent numbers from the correct data sources.

