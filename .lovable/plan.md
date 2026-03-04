

# Plan: Full SQL Dump Edge Function

## Problem
Downloading 100+ CSV chunks manually is tedious. A single SQL dump with INSERT statements would be much easier to import.

## Solution
Create an edge function `migrate-export` (reuse existing name from config.toml) that generates a full SQL dump with INSERT statements for all tables. You can then copy-paste or download the SQL and run it in the new Supabase project's SQL Editor.

## How it works
1. The function iterates through all tables
2. For each table, it fetches all rows (paginated internally)
3. Generates `INSERT INTO table_name (col1, col2, ...) VALUES (...)` statements
4. Returns one big SQL file you can download

## Handling large tables
- Tables like `link_suggestions` (53k rows) and `analytics_events` (18k rows) are too large for a single response
- The function will accept a `tables` query param to export specific tables, so you can do it in batches:
  - `GET /migrate-export` → all small tables in one dump
  - `GET /migrate-export?tables=blog_posts` → just blog_posts
  - `GET /migrate-export?tables=link_suggestions&offset=0&limit=5000` → chunks of large tables

## Output format
```sql
-- Table: profiles
INSERT INTO profiles (id, user_id, email, ...) VALUES
('uuid-1', 'uuid-2', 'test@email.com', ...),
('uuid-3', 'uuid-4', 'other@email.com', ...);

-- Table: blog_categories
INSERT INTO blog_categories (id, name, slug, ...) VALUES
(...);
```

## Import steps
1. Open the new Supabase project's **SQL Editor**
2. Paste the SQL dump (or upload the .sql file)
3. Click **Run**
4. Done

## Steps
1. Update `supabase/functions/migrate-export/index.ts` with the SQL dump logic
2. Deploy it
3. Provide you with the exact URLs to visit

## Tables to export (28 non-empty)
Small (single dump): `profiles`, `blog_categories`, `blog_tags`, `site_settings`, `template_stats`, `og_images`, `content_plans`, `pages`, `letter_purchases`, `refund_logs`, `user_roles`, `category_images`, `consumer_news_cache`, `dispute_outcomes`, `user_credits`, `template_seo_overrides`, `letter_analyses`, `bulk_planning_jobs`, `daily_publish_jobs`, `backfill_jobs`, `semantic_scan_jobs`, `embedding_jobs`, `image_optimization_jobs`, `keyword_planning_jobs`, `gsc_index_status`, `gsc_performance_cache`

Large (separate calls): `blog_posts`, `content_queue`, `article_embeddings`, `keyword_targets`, `embedding_queue`, `analytics_events`, `link_suggestions`

