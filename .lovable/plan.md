

# Plan: Full Data Migration via Edge Function

Since you can't run scripts locally, I'll create an edge function on this project that reads from this database and writes directly to your new project — no terminal needed.

## What it does

A new `migrate-push` edge function that:
1. Reads all rows from each table in this project (using `SUPABASE_SERVICE_ROLE_KEY`)
2. Upserts them into the new project (`penadwjjzszlzxipuptr`) using its service role key
3. Handles pagination (1000 rows per batch) for large tables
4. Returns progress as it goes

## Tables (all 31 non-empty + empty ones)

Every table in the TABLES list from `migrate-export` plus any missing ones from the schema: `blog_categories`, `site_settings`, `profiles`, `user_roles`, `content_plans`, `blog_posts`, `article_embeddings`, `content_queue`, `keyword_targets`, `link_suggestions`, `template_stats`, `letter_purchases`, `analytics_events`, `embedding_queue`, `gsc_performance_cache`, `semantic_scan_jobs`, `category_images`, `consumer_news_cache`, `bulk_planning_jobs`, `og_images`, `image_optimization_jobs`, `user_credits`, `embedding_jobs`, `backfill_jobs`, `keyword_planning_jobs`, `dispute_outcomes`, `gsc_index_status`, `gsc_recommendations_cache`, `generation_jobs`, `pages`, `blog_tags`, `template_seo_overrides`, `canonical_anchors`, `user_letters`, `letter_analyses`, `evidence_photos`, `refund_logs`, `daily_publish_jobs`, `template_stats`, `embedding_queue`

## Requirement

I need the **new project's service role key** stored as a secret. I'll use the `add_secret` tool to ask you for it. The function will use:
- `SUPABASE_SERVICE_ROLE_KEY` (already available) to read from this project
- `NEW_SUPABASE_SERVICE_ROLE_KEY` secret to write to the new project

## How you'll use it

Just call the URL once — the function migrates everything automatically. No terminal, no scripts. You'll see it working right here.

## Steps

1. Add `NEW_SUPABASE_SERVICE_ROLE_KEY` secret (you get this from your new Supabase dashboard → Settings → API → service_role)
2. Create `supabase/functions/migrate-push/index.ts`
3. Deploy and invoke it — migration happens server-side
4. Delete both `migrate-export` and `migrate-push` after completion

