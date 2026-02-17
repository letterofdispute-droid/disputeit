# Fully Automated Keyword-to-Article Pipeline

## What This Does (User Perspective)

You upload your keywords XLSX file once. The system then:

1. Ingests all 13 verticals of keywords automatically
2. Uses AI to cluster keywords into pillar topics and cluster subtopics
3. Generates article titles targeting real search terms (not AI-guessed)
4. Assigns primary/secondary keywords per article from your data
5. Generates SEO meta titles and meta descriptions
6. Writes full articles with keywords baked in
7. For each published article, I want to know which keywords are used and how many times
8. Auto-publishes a configurable number of articles per day

No manual keyword assignment, no manual pillar/cluster decisions. One button press after upload starts the entire machine.

## How It Works

```text
Upload XLSX
    |
    v
[import-keywords edge function]
    |-- Parses all 13 sheets
    |-- Stores in keyword_targets table
    |-- Marks row-1 keywords as seeds (highest priority)
    |
    v
[Plan Keywords] button (one click)
    |
    v
[plan-from-keywords edge function]
    |-- Groups seed keywords into pillar topics using AI
    |-- Maps variation keywords as cluster article targets
    |-- Creates content_plans + content_queue items
    |-- Each queue item has real primary_keyword + secondary_keywords
    |-- AI generates compelling titles targeting the keywords
    |-- AI generates meta_title (50-60 chars) + meta_description (150-160 chars)
    |-- Pillar articles get the seed keyword as primary target
    |-- Cluster articles get variations as primary targets
    |
    v
[Generate All] (existing button)
    |-- bulk-generate-articles picks up keyword data from queue items
    |-- Passes primary_keyword + secondary_keywords into content prompt
    |-- Keyword remediation ensures all keywords appear in final content
    |
    v
[Daily Auto-Publish] (runs on schedule)
    |-- Publishes N oldest draft articles per day
    |-- Backdates pillars before their clusters
    |-- Queues embedding generation for new articles
```

## SEO Command Center Changes

The existing 7 tabs remain untouched. Two additions:

**New "Keywords" tab** (between Gaps and Settings):

- Upload XLSX button
- Shows keyword counts per vertical after import
- "Plan All Keywords" button that triggers the AI clustering
- Progress indicator during planning
- Table showing how keywords were assigned (which became pillars, which became clusters)

**New "Auto-Publish" section in Settings tab**:

- Enable/disable toggle
- Articles per day (default: 5)
- Shows last job status and history

## Technical Details

### Database: `keyword_targets` table

```text
id              uuid PK
vertical        text NOT NULL (e.g. 'insurance', 'healthcare')
keyword         text NOT NULL
is_seed         boolean DEFAULT false (row 1 = true)
column_group    text (which seed keyword column this belongs to)
priority        integer DEFAULT 50
used_in_queue_id uuid nullable (prevents reuse)
created_at      timestamptz
UNIQUE(vertical, keyword)
```

RLS: Admin-only for all operations. Service role full access.

### Database: `daily_publish_jobs` table

```text
id              uuid PK
target_count    integer
published_count integer DEFAULT 0
failed_count    integer DEFAULT 0
status          text DEFAULT 'processing'
error_log       jsonb DEFAULT '[]'
created_at      timestamptz
completed_at    timestamptz nullable
```

RLS: Admin-only SELECT/INSERT. Service role full access.

### New columns on `content_queue` table

- `primary_keyword` text nullable
- `secondary_keywords` text[] nullable
- `meta_title` text nullable
- `meta_description` text nullable

These store the keyword targeting data so `bulk-generate-articles` can use them directly.

### Edge Function: `import-keywords`

Receives parsed XLSX data from frontend (client-side parsing using SheetJS). Accepts:

```json
{ "sheets": [{ "vertical": "insurance", "keywords": [{"keyword": "...", "isSeed": true, "columnGroup": "health insurance claim"}] }] }
```

Upserts into `keyword_targets`, returns import counts.

### Edge Function: `plan-from-keywords`

The intelligence layer. For each vertical:

1. Fetches unused seed keywords from `keyword_targets`
2. Fetches their variation keywords (same `column_group`)
3. Sends to AI: "Given these seed topics and their variations, create a content plan with pillar articles (targeting seeds) and cluster articles (targeting high-value variations). For each article, provide: title, primary_keyword, secondary_keywords (3-5), meta_title, meta_description."
4. Creates `content_plans` + `content_queue` entries with all keyword data populated
5. Marks keywords as used (`used_in_queue_id`)

This replaces the existing `generate-content-plan` flow for keyword-driven planning while keeping the old flow available for templates without keyword data.

### Edge Function: `daily-auto-publish`

- Reads `site_settings` for config (enabled, count, time)
- Selects N oldest `generated` articles with `blog_post_id`
- Updates `blog_posts.status` to 'published', sets `published_at`
- Backdates pillars before earliest cluster
- Syncs `content_queue.status` and `content_queue.published_at`
- Creates `daily_publish_jobs` record
- Queues embeddings for newly published posts

Triggered by `pg_cron` daily.

### Modified: `bulk-generate-articles`

When a queue item has `primary_keyword` and `secondary_keywords`:

- Injects them directly into the AI prompt ("Target keyword: X, also naturally include: Y, Z")
- Uses `meta_title` and `meta_description` from queue item (pre-generated during planning)
- Skips AI-generated meta if already populated
- Keyword remediation step uses real keyword data instead of AI-guessed keywords

### Frontend: XLSX parsing

Add `xlsx` npm package for client-side parsing. The Keywords tab reads the file, maps sheet names to verticals, extracts seed vs variation status, and sends to the import edge function.

### `pg_cron` schedule

Daily job at 09:00 UTC calls `daily-auto-publish`. Configurable via site_settings.

## File Changes Summary

**New files:**

- `supabase/functions/import-keywords/index.ts`
- `supabase/functions/plan-from-keywords/index.ts`
- `supabase/functions/daily-auto-publish/index.ts`
- `src/components/admin/seo/KeywordManager.tsx`
- `src/components/admin/seo/AutoPublishSettings.tsx`
- `src/hooks/useKeywordTargets.ts`
- `src/hooks/useAutoPublish.ts`

**Modified files:**

- `src/pages/admin/SEODashboard.tsx` -- add Keywords tab
- `src/components/admin/seo/CategoryTierSettings.tsx` -- add AutoPublishSettings section
- `supabase/functions/bulk-generate-articles/index.ts` -- use keyword data from queue items
- `supabase/functions/generate-blog-content/index.ts` -- accept keyword targeting params

**Database migrations:**

- Create `keyword_targets` table with RLS
- Create `daily_publish_jobs` table with RLS
- Add `primary_keyword`, `secondary_keywords`, `meta_title`, `meta_description` columns to `content_queue`
- Set up `pg_cron` job

## Sequencing

1. Database tables and column additions
2. `import-keywords` edge function + KeywordManager UI
3. `plan-from-keywords` edge function (AI clustering)
4. Wire keyword data into `bulk-generate-articles`
5. `daily-auto-publish` edge function + AutoPublishSettings UI
6. Keywords tab in SEO Dashboard
7. `pg_cron` schedule setup