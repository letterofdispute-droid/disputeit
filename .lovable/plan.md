

# SQL Scripts for New Supabase Project: Storage Buckets + URL Rewrite

## Part 1: Create Storage Buckets

Run this SQL in your new Supabase project's SQL Editor to recreate all 4 buckets with identical settings:

```sql
-- 1. Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('og-images', 'og-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('letters', 'letters', false);
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('evidence-photos', 'evidence-photos', false, 2097152, ARRAY['image/jpeg','image/png','image/webp']);
```

## Part 2: RLS Policies on `storage.objects`

```sql
-- blog-images (public bucket)
CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'blog-images' AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update blog images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

-- og-images (public bucket)
CREATE POLICY "Anyone can view OG images" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'og-images');

CREATE POLICY "Service role can manage OG images" ON storage.objects FOR ALL TO public
  USING (bucket_id = 'og-images' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'og-images' AND auth.role() = 'service_role');

-- letters (private bucket)
CREATE POLICY "Service role can insert letters" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'letters');

CREATE POLICY "Users can view own letters" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own letters" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'letters' AND auth.uid()::text = (storage.foldername(name))[1]);

-- evidence-photos (private bucket)
CREATE POLICY "Service role can access all evidence photos" ON storage.objects FOR ALL TO public
  USING (bucket_id = 'evidence-photos' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'evidence-photos' AND auth.role() = 'service_role');

CREATE POLICY "Users can upload evidence photos" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'evidence-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own evidence photos" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'evidence-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own evidence photos" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'evidence-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Part 3: URL Rewrite Script

After importing data and uploading files to the new project, run this to rewrite all URLs. Replace `YOUR_NEW_PROJECT_ID` with your actual new Supabase project ref:

```sql
-- Replace old project ID in all URL columns
-- Affected: 6,834 blog_posts image columns, 135 pages, 43 category_images, 28 og_images, 1 letter_purchase

DO $$
DECLARE
  old_ref TEXT := 'koulmtfnkuapzigcplov';
  new_ref TEXT := 'YOUR_NEW_PROJECT_ID';  -- <-- CHANGE THIS
BEGIN
  -- blog_posts (6,834 rows)
  UPDATE blog_posts SET
    featured_image_url = REPLACE(featured_image_url, old_ref, new_ref),
    middle_image_1_url = REPLACE(middle_image_1_url, old_ref, new_ref),
    middle_image_2_url = REPLACE(middle_image_2_url, old_ref, new_ref)
  WHERE featured_image_url LIKE '%' || old_ref || '%'
     OR middle_image_1_url LIKE '%' || old_ref || '%'
     OR middle_image_2_url LIKE '%' || old_ref || '%';

  -- pages (135 rows)
  UPDATE pages SET
    featured_image_url = REPLACE(featured_image_url, old_ref, new_ref)
  WHERE featured_image_url LIKE '%' || old_ref || '%';

  -- category_images (43 rows)
  UPDATE category_images SET
    image_url = REPLACE(image_url, old_ref, new_ref),
    large_url = REPLACE(large_url, old_ref, new_ref),
    thumbnail_url = REPLACE(thumbnail_url, old_ref, new_ref)
  WHERE image_url LIKE '%' || old_ref || '%'
     OR large_url LIKE '%' || old_ref || '%'
     OR thumbnail_url LIKE '%' || old_ref || '%';

  -- og_images (28 rows)
  UPDATE og_images SET
    image_url = REPLACE(image_url, old_ref, new_ref)
  WHERE image_url LIKE '%' || old_ref || '%';

  -- letter_purchases (1 row)
  UPDATE letter_purchases SET
    pdf_url = REPLACE(pdf_url, old_ref, new_ref),
    docx_url = REPLACE(docx_url, old_ref, new_ref)
  WHERE pdf_url LIKE '%' || old_ref || '%'
     OR docx_url LIKE '%' || old_ref || '%';

  RAISE NOTICE 'URL rewrite complete: old_ref=% → new_ref=%', old_ref, new_ref;
END $$;
```

## Part 4: Database Functions with Hardcoded Project ID

Several database functions contain the old project ID and anon key hardcoded (used by `pg_net` for cron recovery jobs). These also need updating:

- `recover_stale_backfill_jobs()`
- `recover_stale_semantic_scan_jobs()`
- `recover_stale_image_optimization_jobs()`
- `recover_stale_generation_jobs()`

After creating the new project, you'll need to recreate these functions with the new project URL and anon key substituted in.

## Summary of Affected Data

| Table | Column(s) | Rows to update |
|-------|-----------|----------------|
| blog_posts | featured_image_url, middle_image_1/2_url | 6,834 |
| pages | featured_image_url | 135 |
| category_images | image_url, large_url, thumbnail_url | 43 |
| og_images | image_url | 28 |
| letter_purchases | pdf_url, docx_url | 1 |
| **Total** | | **7,041** |

