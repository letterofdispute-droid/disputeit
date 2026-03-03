

# Plan: Migrate Data from Old to New Supabase

## Data Inventory

| Table | Rows | Priority |
|-------|------|----------|
| link_suggestions | 53,278 | High |
| analytics_events | 18,411 | Medium |
| blog_posts | 6,841 | **Critical** |
| article_embeddings | 6,841 | High |
| content_queue | 6,753 | High |
| keyword_targets | 4,276 | High |
| embedding_queue | 1,061 | Medium |
| content_plans | 804 | High |
| template_stats | 427 | High |
| gsc_performance_cache | 420 | Low |
| semantic_scan_jobs | 90 | Low |
| category_images | 43 | Medium |
| consumer_news_cache | 30 | Low |
| bulk_planning_jobs | 30 | Low |
| og_images | 28 | Medium |
| image_optimization_jobs | 20 | Low |
| blog_categories | 16 | **Critical** |
| site_settings | 16 | High |
| letter_purchases | 7 | High |
| user_credits | 5 | Medium |
| embedding_jobs | 5 | Low |
| backfill_jobs | 10 | Low |
| keyword_planning_jobs | 5 | Low |
| profiles | 2 | **Critical** |
| user_roles | 1 | **Critical** |
| dispute_outcomes | 1 | Medium |
| gsc_index_status | 1 | Low |

**Empty tables (skip):** template_seo_overrides, canonical_anchors, user_letters, letter_analyses, evidence_photos, refund_logs, daily_publish_jobs

## Recommended Approach: pg_dump → pg_restore

This is the fastest and most reliable way to move ~100K rows across projects. No scripts needed.

### Steps (run from your terminal)

**1. Get connection strings**

- **Old project (this one):** Go to Lovable Cloud settings or use the connection string from the Supabase dashboard. The old project ID is `koulmtfnkuapzigcplov`.
- **New project:** Get the connection string from your new Supabase project dashboard → Settings → Database → Connection string (URI).

**2. Dump data only (no schema, since schema already exists)**

```bash
pg_dump \
  "postgresql://postgres.[OLD_PROJECT_ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  -T auth.* \
  -T storage.* \
  -T supabase_functions.* \
  -T realtime.* \
  -T vault.* \
  > data_dump.sql
```

**3. Restore into new project**

```bash
psql \
  "postgresql://postgres.[NEW_PROJECT_ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  < data_dump.sql
```

### Getting the old project password

Since this is a Lovable Cloud project, you may not have the database password. Two options:

1. **Reset it** from the new Supabase dashboard if this project was linked there
2. **Use a script-based approach** instead — I can create an edge function that exports each table as JSON, which you then import into the new project via `psql` or a Node script

### Alternative: Edge function JSON export

If you can't get the database connection string, I can build an edge function that:
- Reads each table using the service role key
- Returns the data as JSON
- You then run a Node script to insert into the new project

This is slower but doesn't require database credentials.

## Important: URL Rewriting

After data migration, you'll need to update all URLs in `blog_posts` and other tables that reference the old project ID (`koulmtfnkuapzigcplov`) to point to your new project's storage URLs.

```sql
UPDATE blog_posts 
SET featured_image_url = REPLACE(featured_image_url, 'koulmtfnkuapzigcplov', 'YOUR_NEW_PROJECT_ID'),
    middle_image_1_url = REPLACE(middle_image_1_url, 'koulmtfnkuapzigcplov', 'YOUR_NEW_PROJECT_ID'),
    middle_image_2_url = REPLACE(middle_image_2_url, 'koulmtfnkuapzigcplov', 'YOUR_NEW_PROJECT_ID')
WHERE featured_image_url LIKE '%koulmtfnkuapzigcplov%'
   OR middle_image_1_url LIKE '%koulmtfnkuapzigcplov%'
   OR middle_image_2_url LIKE '%koulmtfnkuapzigcplov%';
```

Same for `category_images`, `og_images`, and `letter_purchases` (pdf_url, docx_url).

## Auth Users

Auth users (in `auth.users`) **cannot** be migrated via pg_dump. Users will need to re-register, or you can use the Supabase Auth Admin API to recreate them in the new project.

