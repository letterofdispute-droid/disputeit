

# Scheduled Publishing Cadence for Content Queue

## Current State

- 80 articles sit in the queue as "queued" status
- `blog_posts.scheduled_at` column already exists (timestamptz, nullable)
- The `daily-auto-publish` edge function publishes N oldest "generated" items daily — no date awareness
- The Calendar tab shows posts by created/scheduled date but is read-only
- No way to bulk-assign publication dates with a cadence

## What You Need

A workflow to say: "Take these 80 articles, generate them, and publish 5 every 2 days starting March 1st" — spreading them across dates automatically.

## Solution

### 1. Add `scheduled_at` column to `content_queue` table

A migration to add `scheduled_at TIMESTAMPTZ` to `content_queue`. When articles are generated into `blog_posts`, the `bulk-generate-articles` function copies this date to `blog_posts.scheduled_at`.

### 2. New "Schedule" dialog on the Queue page

A dialog triggered by a new "Schedule" button in `QueueActions`. It contains:

```text
┌─────────────────────────────────────────┐
│  Schedule Publishing                    │
│                                         │
│  Start date:    [March 1, 2026    ▼]    │
│  Articles per batch:  [5          ]     │
│  Every N days:        [2          ]     │
│                                         │
│  Preview:                               │
│  Mar 1  → 5 articles                    │
│  Mar 3  → 5 articles                    │
│  Mar 5  → 5 articles                    │
│  ...                                    │
│  Mar 31 → 5 articles                    │
│  Total: 80 articles over 32 days        │
│                                         │
│  [Cancel]              [Schedule All]   │
└─────────────────────────────────────────┘
```

- Operates on selected items, or all queued items if none selected
- Assigns `scheduled_at` timestamps spread across the cadence
- Items get dates assigned in their current queue order (priority desc, created_at desc)

### 3. Modify `daily-auto-publish` to be schedule-aware

Instead of "grab N oldest generated items", the logic becomes:
- Find blog posts where `scheduled_at <= now()` AND `status = 'draft'` → publish those
- Fall back to existing behavior (oldest N generated) if no scheduled items exist
- This means the cron job that runs daily at 09:00 UTC will automatically publish articles whose scheduled date has arrived

### 4. Copy `scheduled_at` during article generation

In `bulk-generate-articles`, when creating a blog_post from a queue item, copy `content_queue.scheduled_at` → `blog_posts.scheduled_at` and set the blog post status to `draft` (already the case).

### 5. Show scheduled dates in the Queue table

Add a "Scheduled" column to `QueueTable` showing the assigned date, so you can see the spread at a glance.

### 6. Calendar integration (already works)

The existing `ContentCalendar` already queries `blog_posts.scheduled_at` and displays scheduled posts — so once articles are generated with dates, they'll appear on the calendar automatically.

## File Changes

| File | Change |
|------|--------|
| **Migration** | Add `scheduled_at TIMESTAMPTZ` to `content_queue` |
| `src/components/admin/seo/queue/ScheduleDialog.tsx` | New — cadence picker dialog with preview |
| `src/components/admin/seo/queue/QueueActions.tsx` | Add "Schedule" button that opens the dialog |
| `src/components/admin/seo/queue/QueueTable.tsx` | Add "Scheduled" column showing date |
| `src/hooks/useContentQueue.ts` | Add `scheduleItems` mutation (bulk update `scheduled_at`) |
| `supabase/functions/bulk-generate-articles/index.ts` | Copy `scheduled_at` from queue item to blog_post |
| `supabase/functions/daily-auto-publish/index.ts` | Check `scheduled_at <= now()` on blog_posts first, then fall back to count-based |

## Workflow

1. Go to Queue tab with 80 queued articles
2. Click "Schedule" → pick start date March 1, 5 articles every 2 days
3. System assigns dates: items 1-5 get Mar 1, items 6-10 get Mar 3, etc.
4. Click "Generate All 80" → articles generate as drafts with `scheduled_at` preserved
5. The daily cron at 09:00 UTC checks: any drafts with `scheduled_at <= now()`? Publish them.
6. Calendar tab shows the planned spread visually

No new dependencies. Uses existing `scheduled_at` column on `blog_posts` and the existing cron infrastructure.

