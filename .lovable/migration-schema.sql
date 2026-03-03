-- =============================================================================
-- FULL SCHEMA MIGRATION: Lovable Cloud -> Self-Hosted Supabase
-- Generated from live database on 2026-03-03
-- Run sections in order in your new Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- PHASE 1: EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
-- pg_cron is enabled via Supabase dashboard > Database > Extensions

-- =============================================================================
-- PHASE 2: ENUM TYPES
-- =============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================================================
-- PHASE 3: TABLES (dependency order)
-- =============================================================================

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  first_name text,
  last_name text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  role text DEFAULT 'user'::text,
  plan text NOT NULL DEFAULT 'free'::text,
  status text NOT NULL DEFAULT 'active'::text,
  letters_count integer NOT NULL DEFAULT 0,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'none'::text,
  subscription_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);


CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. site_settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. blog_categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. blog_tags
CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. content_plans
CREATE TABLE public.content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text NOT NULL UNIQUE,
  template_name text NOT NULL,
  category_id text NOT NULL,
  subcategory_slug text,
  target_article_count integer NOT NULL DEFAULT 8,
  value_tier text NOT NULL DEFAULT 'medium'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. blog_posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  category text NOT NULL,
  category_slug text NOT NULL,
  author text NOT NULL DEFAULT 'DisputeLetters Team'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  featured boolean NOT NULL DEFAULT false,
  read_time text,
  views integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  meta_title text,
  meta_description text,
  featured_image_url text,
  tags text[] DEFAULT '{}'::text[],
  scheduled_at timestamptz,
  author_id uuid REFERENCES public.profiles(user_id),
  related_templates text[] DEFAULT '{}'::text[],
  content_plan_id uuid REFERENCES public.content_plans(id),
  article_type text,
  middle_image_1_url text,
  middle_image_2_url text,
  featured_image_alt text,
  middle_image_1_alt text,
  middle_image_2_alt text,
  primary_keyword text,
  secondary_keywords text[],
  content_hash text,
  last_link_scan_at timestamptz,
  keyword_counts jsonb
);

-- 8. content_queue
CREATE TABLE public.content_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.content_plans(id),
  article_type text NOT NULL,
  suggested_title text NOT NULL,
  suggested_keywords text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'queued'::text,
  priority integer DEFAULT 50,
  error_message text,
  blog_post_id uuid REFERENCES public.blog_posts(id),
  generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  parent_queue_id uuid REFERENCES public.content_queue(id),
  scheduled_at timestamptz,
  primary_keyword text,
  secondary_keywords text[],
  meta_title text,
  meta_description text,
  pillar_link_anchor text
);

-- 9. analytics_events
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text,
  page_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. article_embeddings
CREATE TABLE public.article_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid,
  slug text NOT NULL,
  title text NOT NULL,
  category_id text NOT NULL,
  subcategory_slug text,
  embedding vector,
  topic_summary text,
  headings_text text,
  primary_keyword text,
  secondary_keywords text[],
  anchor_variants text[],
  article_type text,
  article_role text NOT NULL DEFAULT 'cluster'::text,
  parent_pillar_id uuid REFERENCES public.article_embeddings(id),
  related_categories text[],
  inbound_count integer DEFAULT 0,
  outbound_count integer DEFAULT 0,
  max_inbound integer DEFAULT 20,
  embedding_status text DEFAULT 'pending'::text,
  error_message text,
  content_hash text,
  last_embedded_at timestamptz,
  next_scan_due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(content_type, slug)
);

-- 11. letter_purchases
CREATE TABLE public.letter_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  template_slug text NOT NULL,
  template_name text NOT NULL,
  letter_content text NOT NULL,
  purchase_type text NOT NULL,
  amount_cents integer NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending'::text,
  pdf_url text,
  docx_url text,
  user_id uuid,
  evidence_photos jsonb DEFAULT '[]'::jsonb,
  follow_up_due_at timestamptz,
  follow_up_sent_at timestamptz,
  edit_expires_at timestamptz,
  last_edited_at timestamptz,
  last_edited_content text,
  refund_reason text,
  refunded_at timestamptz,
  feedback_vote text,
  resolution_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. link_suggestions
CREATE TABLE public.link_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id uuid NOT NULL REFERENCES public.blog_posts(id),
  target_type text NOT NULL,
  target_slug text NOT NULL,
  target_title text NOT NULL,
  anchor_text text NOT NULL,
  context_snippet text,
  insert_position integer,
  relevance_score integer,
  status text NOT NULL DEFAULT 'pending'::text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  semantic_score double precision,
  keyword_overlap_score double precision,
  hierarchy_valid boolean DEFAULT true,
  target_embedding_id uuid REFERENCES public.article_embeddings(id),
  hierarchy_violation text,
  anchor_source text,
  generated_sentence text
);

-- 13. template_seo_overrides
CREATE TABLE public.template_seo_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 14. template_stats
CREATE TABLE public.template_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  satisfaction_score numeric NOT NULL DEFAULT 95.0,
  total_votes integer NOT NULL DEFAULT 0,
  positive_votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 15. dispute_outcomes
CREATE TABLE public.dispute_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'in_progress'::text,
  amount_disputed numeric,
  amount_recovered numeric,
  resolution_steps jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 16. user_letters
CREATE TABLE public.user_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  template_name text NOT NULL,
  template_slug text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'completed'::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 17. evidence_photos
CREATE TABLE public.evidence_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  purchase_id uuid REFERENCES public.letter_purchases(id),
  storage_path text NOT NULL,
  description text,
  original_filename text,
  file_size_bytes integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 18. refund_logs
CREATE TABLE public.refund_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.letter_purchases(id),
  amount_cents integer NOT NULL,
  processed_by uuid NOT NULL,
  reason text,
  stripe_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 19. user_credits
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  granted_by uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'active'::text,
  purchase_id uuid REFERENCES public.letter_purchases(id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + '30 days'::interval),
  used_at timestamptz
);

-- 20. category_images
CREATE TABLE public.category_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  context_key text NOT NULL DEFAULT 'default'::text,
  image_url text NOT NULL,
  thumbnail_url text NOT NULL,
  large_url text NOT NULL,
  pixabay_id text NOT NULL,
  search_query text NOT NULL,
  alt_text text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + '7 days'::interval),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, context_key, pixabay_id)
);

-- 21. canonical_anchors
CREATE TABLE public.canonical_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_phrase text NOT NULL,
  anchor_normalized text NOT NULL,
  canonical_target_id uuid NOT NULL REFERENCES public.article_embeddings(id),
  category_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(anchor_normalized, category_id)
);

-- 22. backfill_jobs
CREATE TABLE public.backfill_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'::text,
  total_images integer DEFAULT 0,
  processed_images integer DEFAULT 0,
  failed_images integer DEFAULT 0,
  last_post_slug text,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 23. bulk_planning_jobs
CREATE TABLE public.bulk_planning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  category_name text NOT NULL,
  value_tier text NOT NULL DEFAULT 'medium'::text,
  total_templates integer NOT NULL DEFAULT 0,
  completed_templates integer NOT NULL DEFAULT 0,
  failed_templates integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'::text,
  template_slugs text[] NOT NULL DEFAULT '{}'::text[],
  processed_slugs text[] NOT NULL DEFAULT '{}'::text[],
  failed_slugs text[] NOT NULL DEFAULT '{}'::text[],
  error_messages jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 24. generation_jobs
CREATE TABLE public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  total_items integer NOT NULL DEFAULT 0,
  succeeded_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'::text,
  bail_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 25. embedding_jobs
CREATE TABLE public.embedding_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL DEFAULT 'blog_post'::text,
  category_filter text,
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  skipped_items integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'::text,
  processed_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  failed_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  error_messages jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 26. embedding_queue
CREATE TABLE public.embedding_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  trigger_source text NOT NULL,
  priority integer DEFAULT 50,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- 27. semantic_scan_jobs
CREATE TABLE public.semantic_scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'processing'::text,
  category_filter text,
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer NOT NULL DEFAULT 0,
  total_suggestions integer NOT NULL DEFAULT 0,
  similarity_threshold double precision NOT NULL DEFAULT 0.75,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 28. daily_publish_jobs
CREATE TABLE public.daily_publish_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_count integer NOT NULL DEFAULT 5,
  published_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing'::text,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 29. gsc_performance_cache
CREATE TABLE public.gsc_performance_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  page text,
  country text DEFAULT 'US'::text,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr double precision NOT NULL DEFAULT 0,
  position double precision NOT NULL DEFAULT 0,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- 30. gsc_index_status
CREATE TABLE public.gsc_index_status (
  id text PRIMARY KEY DEFAULT 'singleton'::text,
  submitted_count integer NOT NULL DEFAULT 0,
  indexed_count integer NOT NULL DEFAULT 0,
  sitemaps jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- 31. gsc_recommendations_cache
CREATE TABLE public.gsc_recommendations_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 32. image_optimization_jobs
CREATE TABLE public.image_optimization_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'::text,
  total_files integer DEFAULT 0,
  total_size_bytes bigint DEFAULT 0,
  oversized_files integer DEFAULT 0,
  oversized_size_bytes bigint DEFAULT 0,
  processed integer DEFAULT 0,
  saved_bytes bigint DEFAULT 0,
  deleted integer DEFAULT 0,
  freed_bytes bigint DEFAULT 0,
  current_offset integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  file_list jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- 33. keyword_targets
CREATE TABLE public.keyword_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical text NOT NULL,
  keyword text NOT NULL,
  column_group text,
  is_seed boolean DEFAULT false,
  priority integer DEFAULT 50,
  used_in_queue_id uuid REFERENCES public.content_queue(id),
  batch_id uuid DEFAULT gen_random_uuid(),
  imported_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 34. keyword_planning_jobs
CREATE TABLE public.keyword_planning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'processing'::text,
  verticals text[] NOT NULL DEFAULT '{}'::text[],
  completed_verticals text[] NOT NULL DEFAULT '{}'::text[],
  failed_verticals text[] NOT NULL DEFAULT '{}'::text[],
  current_vertical_index integer NOT NULL DEFAULT 0,
  total_planned integer NOT NULL DEFAULT 0,
  vertical_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 35. og_images
CREATE TABLE public.og_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  image_url text NOT NULL,
  prompt_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 36. consumer_news_cache
CREATE TABLE public.consumer_news_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text NOT NULL,
  excerpt text,
  url text NOT NULL,
  category_tags text[],
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- 37. letter_analyses
CREATE TABLE public.letter_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  score integer,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 38. pages
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  content text,
  excerpt text,
  page_type text NOT NULL DEFAULT 'page'::text,
  page_group text,
  status text NOT NULL DEFAULT 'draft'::text,
  no_index boolean NOT NULL DEFAULT false,
  sort_order integer,
  parent_id uuid REFERENCES public.pages(id),
  author text,
  author_id uuid,
  meta_title text,
  meta_description text,
  featured_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- PHASE 4: INDEXES (non-primary, non-unique)
-- =============================================================================

-- analytics_events
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events USING btree (created_at);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events USING btree (event_type);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events USING btree (session_id);

-- article_embeddings
CREATE INDEX idx_embeddings_category ON public.article_embeddings USING btree (category_id);
CREATE INDEX idx_embeddings_content_id ON public.article_embeddings USING btree (content_id) WHERE (content_id IS NOT NULL);
CREATE INDEX idx_embeddings_hash ON public.article_embeddings USING btree (content_hash);
CREATE INDEX idx_embeddings_inbound ON public.article_embeddings USING btree (inbound_count);
CREATE INDEX idx_embeddings_role ON public.article_embeddings USING btree (article_role);
CREATE INDEX idx_embeddings_scan_due ON public.article_embeddings USING btree (next_scan_due_at) WHERE (next_scan_due_at IS NOT NULL);
CREATE INDEX idx_embeddings_status ON public.article_embeddings USING btree (embedding_status);

-- blog_posts
CREATE INDEX idx_blog_posts_category_slug ON public.blog_posts USING btree (category_slug);
CREATE INDEX idx_blog_posts_related_templates ON public.blog_posts USING gin (related_templates);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);
CREATE INDEX idx_posts_no_links ON public.blog_posts USING btree (id) WHERE ((status = 'published'::text) AND (last_link_scan_at IS NULL));

-- bulk_planning_jobs
CREATE INDEX idx_bulk_planning_jobs_category_status ON public.bulk_planning_jobs USING btree (category_id, status);
CREATE INDEX idx_bulk_planning_jobs_status ON public.bulk_planning_jobs USING btree (status);

-- canonical_anchors
CREATE INDEX idx_canonical_lookup ON public.canonical_anchors USING btree (anchor_normalized, category_id);

-- category_images
CREATE INDEX idx_category_images_category ON public.category_images USING btree (category_id, context_key);
CREATE INDEX idx_category_images_expires ON public.category_images USING btree (expires_at);

-- content_plans
CREATE INDEX idx_content_plans_category ON public.content_plans USING btree (category_id);
CREATE INDEX idx_content_plans_template ON public.content_plans USING btree (template_slug);

-- content_queue
CREATE INDEX idx_content_queue_parent ON public.content_queue USING btree (parent_queue_id) WHERE (parent_queue_id IS NOT NULL);
CREATE INDEX idx_content_queue_plan ON public.content_queue USING btree (plan_id);
CREATE INDEX idx_content_queue_status ON public.content_queue USING btree (status);

-- embedding_jobs
CREATE INDEX idx_embedding_jobs_status ON public.embedding_jobs USING btree (status);

-- keyword_targets
CREATE INDEX idx_keyword_targets_vertical ON public.keyword_targets USING btree (vertical);
CREATE INDEX idx_keyword_targets_unused ON public.keyword_targets USING btree (vertical) WHERE (used_in_queue_id IS NULL);

-- letter_purchases
CREATE INDEX idx_letter_purchases_email ON public.letter_purchases USING btree (email);
CREATE INDEX idx_letter_purchases_user_id ON public.letter_purchases USING btree (user_id) WHERE (user_id IS NOT NULL);
CREATE INDEX idx_letter_purchases_status ON public.letter_purchases USING btree (status);

-- link_suggestions
CREATE INDEX idx_link_suggestions_source ON public.link_suggestions USING btree (source_post_id);
CREATE INDEX idx_link_suggestions_status ON public.link_suggestions USING btree (status);

-- =============================================================================
-- PHASE 5: CUSTOM FUNCTIONS (RPCs)
-- Skip pgvector internal functions - they come with the extension
-- =============================================================================

-- Core auth functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $$
  SELECT public.has_role(check_user_id, 'admin')
$$;

-- Auth trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), ' ', 2)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role management
CREATE OR REPLACE FUNCTION public.assign_role(target_user_id uuid, target_role app_role)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN 'Error: Only admins can assign roles';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN 'Role assigned successfully';
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_role(target_user_id uuid, target_role app_role)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN 'Error: Only admins can revoke roles';
  END IF;
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;
  RETURN 'Role revoked successfully';
END;
$$;

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF user_email = (SELECT email FROM profiles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Cannot modify your own admin status';
  END IF;
  UPDATE public.profiles SET is_admin = true, role = 'admin' WHERE email = user_email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  INSERT INTO analytics_events (event_type, user_id, event_data)
  VALUES ('admin_promotion', auth.uid(), jsonb_build_object('promoted_email', user_email));
  RETURN 'User ' || user_email || ' is now an admin';
END;
$$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_dispute_outcomes_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.update_embeddings_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- Content/SEO functions
CREATE OR REPLACE FUNCTION public.get_article_health_data()
RETURNS TABLE(id uuid, title text, slug text, category_slug text, featured_image_url text, meta_title text, meta_description text, primary_keyword text, secondary_keywords text[], related_templates text[], middle_image_1_url text, middle_image_2_url text, content_length integer, published_at timestamptz, inbound_count integer, outbound_count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT bp.id, bp.title, bp.slug, bp.category_slug, bp.featured_image_url, bp.meta_title, bp.meta_description,
    bp.primary_keyword, bp.secondary_keywords, bp.related_templates, bp.middle_image_1_url, bp.middle_image_2_url,
    length(bp.content)::integer AS content_length, bp.published_at,
    COALESCE(ae.inbound_count, 0)::integer AS inbound_count,
    COALESCE(ae.outbound_count, 0)::integer AS outbound_count
  FROM blog_posts bp LEFT JOIN article_embeddings ae ON ae.content_id = bp.id
  WHERE bp.status = 'published' ORDER BY bp.published_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seo_metrics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  result jsonb; published_count bigint; total_articles bigint;
  queued_count bigint; generating_count bigint; generated_count bigint;
  queue_published_count bigint; failed_count bigint;
  links_applied bigint; links_pending bigint; links_approved bigint;
  total_keywords bigint; unused_keywords bigint;
  gsc_last_sync timestamptz; gsc_total_queries bigint;
BEGIN
  SELECT count(*) FILTER (WHERE status = 'published'), count(*) INTO published_count, total_articles FROM blog_posts;
  SELECT count(*) FILTER (WHERE status = 'queued'), count(*) FILTER (WHERE status = 'generating'),
    count(*) FILTER (WHERE status = 'generated'), count(*) FILTER (WHERE status = 'published'),
    count(*) FILTER (WHERE status = 'failed')
  INTO queued_count, generating_count, generated_count, queue_published_count, failed_count FROM content_queue;
  SELECT count(*) FILTER (WHERE status = 'applied'), count(*) FILTER (WHERE status = 'pending'),
    count(*) FILTER (WHERE status = 'approved') INTO links_applied, links_pending, links_approved FROM link_suggestions;
  SELECT count(*), count(*) FILTER (WHERE used_in_queue_id IS NULL) INTO total_keywords, unused_keywords FROM keyword_targets;
  SELECT max(fetched_at), count(DISTINCT query) INTO gsc_last_sync, gsc_total_queries FROM gsc_performance_cache;
  result := jsonb_build_object(
    'publishedArticles', published_count, 'totalArticles', total_articles,
    'queued', queued_count, 'generating', generating_count, 'generated', generated_count,
    'queuePublished', queue_published_count, 'failed', failed_count,
    'linksApplied', links_applied, 'linksPending', links_pending, 'linksApproved', links_approved,
    'totalKeywords', total_keywords, 'unusedKeywords', unused_keywords,
    'gscLastSync', gsc_last_sync, 'gscTotalQueries', gsc_total_queries
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_declining_queries(min_regression double precision DEFAULT 3.0)
RETURNS TABLE(query text, page text, previous_position double precision, current_position double precision, position_delta double precision, current_impressions integer, current_clicks integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT g.query, g.page, g.position, g.impressions, g.clicks, g.fetched_at,
      ROW_NUMBER() OVER (PARTITION BY g.query ORDER BY g.fetched_at DESC) AS rn
    FROM gsc_performance_cache g
  ),
  latest AS (SELECT * FROM ranked WHERE rn = 1),
  previous AS (SELECT * FROM ranked WHERE rn = 2)
  SELECT l.query, l.page, p.position AS previous_position, l.position AS current_position,
    (l.position - p.position) AS position_delta, l.impressions::integer AS current_impressions, l.clicks::integer AS current_clicks
  FROM latest l INNER JOIN previous p ON l.query = p.query
  WHERE (l.position - p.position) >= min_regression
  ORDER BY (l.position - p.position) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_keyword_stats()
RETURNS TABLE(vertical text, total bigint, seeds bigint, used bigint, unused bigint, latest_batch_id uuid, latest_imported_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT kt.vertical, count(*)::bigint AS total, count(*) FILTER (WHERE kt.is_seed = true)::bigint AS seeds,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NOT NULL)::bigint AS used,
    count(*) FILTER (WHERE kt.used_in_queue_id IS NULL)::bigint AS unused,
    (SELECT k2.batch_id FROM keyword_targets k2 WHERE k2.vertical = kt.vertical ORDER BY k2.imported_at DESC NULLS LAST LIMIT 1) AS latest_batch_id,
    max(kt.imported_at) AS latest_imported_at
  FROM keyword_targets kt GROUP BY kt.vertical ORDER BY kt.vertical;
$$;

CREATE OR REPLACE FUNCTION public.get_next_backfill_post()
RETURNS SETOF blog_posts LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT * FROM blog_posts WHERE status = 'published'
    AND (featured_image_url IS NULL OR (middle_image_1_url IS NULL AND content LIKE '%MIDDLE_IMAGE_1%')
      OR (middle_image_2_url IS NULL AND content LIKE '%MIDDLE_IMAGE_2%'))
  ORDER BY created_at DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_optimization_batch(p_job_id uuid, p_offset integer, p_limit integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN COALESCE(
    (SELECT jsonb_agg(elem) FROM (
      SELECT elem FROM jsonb_array_elements(
        COALESCE((SELECT file_list FROM image_optimization_jobs WHERE id = p_job_id), '[]'::jsonb)
      ) WITH ORDINALITY AS t(elem, ord)
      WHERE t.ord > p_offset AND t.ord <= p_offset + p_limit ORDER BY t.ord
    ) sub), '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_orphan_articles(category_filter text DEFAULT NULL)
RETURNS TABLE(id uuid, slug text, title text, category_slug text, published_at timestamptz, inbound_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY SELECT bp.id, bp.slug, bp.title, bp.category_slug, bp.published_at,
    COALESCE(ae.inbound_count, 0)::BIGINT AS inbound_count
  FROM blog_posts bp LEFT JOIN article_embeddings ae ON ae.content_id = bp.id
  WHERE bp.status = 'published' AND (category_filter IS NULL OR bp.category_slug = category_filter)
    AND COALESCE(ae.inbound_count, 0) = 0
  ORDER BY bp.published_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_template_article_counts()
RETURNS TABLE(template_slug text, article_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT unnest(related_templates) AS template_slug, count(*) AS article_count
  FROM blog_posts WHERE status = 'published' AND related_templates IS NOT NULL GROUP BY template_slug;
$$;

CREATE OR REPLACE FUNCTION public.get_template_progress()
RETURNS TABLE(template_slug text, total bigint, generated bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT cp.template_slug, count(*) as total,
    count(*) FILTER (WHERE cq.status IN ('generated','published')) as generated
  FROM content_queue cq JOIN content_plans cp ON cp.id = cq.plan_id GROUP BY cp.template_slug;
$$;

CREATE OR REPLACE FUNCTION public.get_unused_keyword_verticals()
RETURNS TABLE(vertical text) LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT DISTINCT vertical FROM keyword_targets WHERE used_in_queue_id IS NULL ORDER BY vertical;
$$;

-- Link/embedding functions
CREATE OR REPLACE FUNCTION public.increment_link_counters(p_source_post_id uuid, p_target_embedding_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE article_embeddings SET outbound_count = COALESCE(outbound_count, 0) + 1 WHERE content_id = p_source_post_id;
  IF p_target_embedding_id IS NOT NULL THEN
    UPDATE article_embeddings SET inbound_count = COALESCE(inbound_count, 0) + 1 WHERE id = p_target_embedding_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_scan_progress(p_job_id uuid, p_processed integer, p_suggestions integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE semantic_scan_jobs SET processed_items = processed_items + p_processed,
    total_suggestions = total_suggestions + p_suggestions, updated_at = now() WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_backfill_progress(p_job_id uuid, p_processed integer, p_failed integer, p_last_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE backfill_jobs SET processed_images = COALESCE(processed_images, 0) + p_processed,
    failed_images = COALESCE(failed_images, 0) + p_failed, last_post_slug = p_last_slug, updated_at = now()
  WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_optimization_progress(p_job_id uuid, p_processed integer, p_saved_bytes bigint, p_deleted integer, p_errors jsonb DEFAULT '[]'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE image_optimization_jobs SET processed = COALESCE(processed, 0) + p_processed,
    saved_bytes = COALESCE(saved_bytes, 0) + p_saved_bytes, deleted = COALESCE(deleted, 0) + p_deleted,
    errors = COALESCE(errors, '[]'::jsonb) || p_errors, updated_at = now() WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_optimization_progress(p_job_id uuid, p_processed integer, p_saved_bytes bigint, p_deleted integer, p_new_offset integer, p_errors jsonb DEFAULT '[]'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE image_optimization_jobs SET processed = COALESCE(processed, 0) + p_processed,
    saved_bytes = COALESCE(saved_bytes, 0) + p_saved_bytes, deleted = COALESCE(deleted, 0) + p_deleted,
    current_offset = p_new_offset, errors = COALESCE(errors, '[]'::jsonb) || p_errors, updated_at = now() WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_optimization_batch(p_job_id uuid, p_batch_size integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_offset int; v_total int; v_status text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT current_offset, oversized_files, status INTO v_offset, v_total, v_status
  FROM image_optimization_jobs WHERE id = p_job_id FOR UPDATE;
  IF v_offset IS NULL OR v_status = 'cancelled' THEN RETURN -1; END IF;
  IF v_offset >= COALESCE(v_total, 0) THEN RETURN -1; END IF;
  UPDATE image_optimization_jobs SET current_offset = v_offset + p_batch_size, updated_at = now() WHERE id = p_job_id;
  RETURN v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_keyword_overlap(keywords_a text[], keywords_b text[])
RETURNS double precision LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE intersection_size INT; union_size INT;
BEGIN
  IF keywords_a IS NULL OR keywords_b IS NULL OR array_length(keywords_a, 1) IS NULL OR array_length(keywords_b, 1) IS NULL THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO intersection_size FROM unnest(keywords_a) a WHERE a = ANY(keywords_b);
  union_size := array_length(keywords_a, 1) + array_length(keywords_b, 1) - intersection_size;
  IF union_size = 0 THEN RETURN 0; END IF;
  RETURN intersection_size::FLOAT / union_size::FLOAT;
END;
$$;

-- Bulk operations
CREATE OR REPLACE FUNCTION public.bulk_delete_link_suggestions(p_status text DEFAULT NULL, p_category_slug text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE deleted_count bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_category_slug IS NOT NULL THEN
    DELETE FROM link_suggestions WHERE (p_status IS NULL OR status = p_status)
      AND source_post_id IN (SELECT id FROM blog_posts WHERE category_slug = p_category_slug);
  ELSE
    DELETE FROM link_suggestions WHERE (p_status IS NULL OR status = p_status);
  END IF;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_update_link_status(p_current_status text, p_new_status text, p_category_slug text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE affected integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_category_slug IS NOT NULL THEN
    UPDATE link_suggestions ls SET status = p_new_status FROM blog_posts bp
    WHERE ls.source_post_id = bp.id AND bp.category_slug = p_category_slug AND ls.status = p_current_status;
  ELSE
    UPDATE link_suggestions SET status = p_new_status WHERE status = p_current_status;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Keyword counting
CREATE OR REPLACE FUNCTION public.backfill_keyword_counts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE post RECORD; plain_text TEXT; kw TEXT; all_keywords TEXT[]; counts JSONB; regex_pattern TEXT; match_count INTEGER; updated_count INTEGER := 0;
BEGIN
  FOR post IN SELECT id, content, primary_keyword, secondary_keywords FROM blog_posts WHERE primary_keyword IS NOT NULL AND keyword_counts IS NULL LOOP
    plain_text := lower(regexp_replace(post.content, '<[^>]+>', ' ', 'g'));
    all_keywords := ARRAY[]::TEXT[];
    IF post.primary_keyword IS NOT NULL AND post.primary_keyword != '' THEN all_keywords := array_append(all_keywords, post.primary_keyword); END IF;
    IF post.secondary_keywords IS NOT NULL THEN all_keywords := all_keywords || post.secondary_keywords; END IF;
    counts := '{}'::jsonb;
    FOREACH kw IN ARRAY all_keywords LOOP
      IF kw IS NOT NULL AND kw != '' THEN
        regex_pattern := regexp_replace(lower(kw), '([.*+?^${}()|[\]\\])', '\\\1', 'g');
        SELECT count(*) INTO match_count FROM regexp_matches(plain_text, regex_pattern, 'g');
        counts := counts || jsonb_build_object(kw, match_count);
      END IF;
    END LOOP;
    UPDATE blog_posts SET keyword_counts = counts WHERE id = post.id;
    updated_count := updated_count + 1;
  END LOOP;
  RETURN updated_count;
END;
$$;

-- Semantic matching
CREATE OR REPLACE FUNCTION public.match_semantic_links(query_embedding vector, source_category text, source_role text, similarity_threshold double precision DEFAULT 0.75, max_results integer DEFAULT 30, exclude_content_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, content_type text, slug text, title text, category_id text, subcategory_slug text, article_role text, primary_keyword text, secondary_keywords text[], inbound_count integer, max_inbound integer, outbound_count integer, similarity double precision, hierarchy_valid boolean, hierarchy_note text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  SELECT ae.id, ae.content_type, ae.slug, ae.title, ae.category_id, ae.subcategory_slug,
    ae.article_role, ae.primary_keyword, ae.secondary_keywords,
    ae.inbound_count, ae.max_inbound, ae.outbound_count,
    1 - (ae.embedding <=> query_embedding) AS similarity,
    CASE WHEN source_role = 'cluster' THEN ae.article_role IN ('pillar', 'super-pillar') OR (ae.article_role = 'cluster' AND ae.category_id = source_category) ELSE true END AS hierarchy_valid,
    CASE WHEN source_role = 'cluster' AND ae.article_role = 'cluster' AND ae.category_id != source_category THEN 'Cross-category cluster link not recommended' ELSE NULL END AS hierarchy_note
  FROM article_embeddings ae
  WHERE ae.embedding IS NOT NULL AND ae.embedding_status = 'completed'
    AND 1 - (ae.embedding <=> query_embedding) > similarity_threshold
    AND ae.inbound_count < ae.max_inbound
    AND (exclude_content_id IS NULL OR ae.content_id IS DISTINCT FROM exclude_content_id)
  ORDER BY similarity DESC LIMIT max_results;
END;
$$;

-- Template voting
CREATE OR REPLACE FUNCTION public.submit_template_vote(p_slug text, p_positive boolean, p_purchase_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE existing_vote TEXT;
BEGIN
  SELECT feedback_vote INTO existing_vote FROM letter_purchases WHERE id = p_purchase_id AND status = 'completed';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Purchase not found'); END IF;
  IF existing_vote IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Already voted'); END IF;
  UPDATE template_stats SET total_votes = total_votes + 1,
    positive_votes = positive_votes + CASE WHEN p_positive THEN 1 ELSE 0 END,
    satisfaction_score = ROUND(((positive_votes + CASE WHEN p_positive THEN 1 ELSE 0 END)::NUMERIC / (total_votes + 1)::NUMERIC) * 100, 2)
  WHERE template_slug = p_slug;
  UPDATE letter_purchases SET feedback_vote = CASE WHEN p_positive THEN 'positive' ELSE 'negative' END WHERE id = p_purchase_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Credit limit check
CREATE OR REPLACE FUNCTION public.check_user_credit_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.user_credits
  WHERE user_id = NEW.user_id AND status = 'active' AND expires_at > NOW();
  IF active_count >= 2 THEN RAISE EXCEPTION 'User cannot have more than 2 active credits'; END IF;
  RETURN NEW;
END;
$$;

-- Category normalization trigger
CREATE OR REPLACE FUNCTION public.normalize_category_id()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE normalized TEXT;
BEGIN
  normalized := lower(regexp_replace(regexp_replace(NEW.category_id, '[^a-zA-Z0-9-]', '-', 'g'), '-+', '-', 'g'));
  normalized := trim(BOTH '-' FROM normalized);
  normalized := CASE normalized
    WHEN 'contractors-home-improvement' THEN 'contractors'
    WHEN 'damaged--goods' THEN 'damaged-goods'
    WHEN 'hoa--property' THEN 'hoa'
    WHEN 'hoa-property' THEN 'hoa'
    WHEN 'neighbor-hoa-disputes' THEN 'hoa'
    WHEN 'landlord-housing' THEN 'housing'
    WHEN 'landlord--housing' THEN 'housing'
    WHEN 'financial-services' THEN 'financial'
    WHEN 'insurance-claims' THEN 'insurance'
    WHEN 'vehicle-auto' THEN 'vehicle'
    WHEN 'vehicle--auto' THEN 'vehicle'
    WHEN 'employment-workplace' THEN 'employment'
    WHEN 'employment--workplace' THEN 'employment'
    WHEN 'utilities-telecommunications' THEN 'utilities'
    WHEN 'utilities--telecommunications' THEN 'utilities'
    WHEN 'e-commerce' THEN 'ecommerce'
    WHEN 'e-commerce-online-services' THEN 'ecommerce'
    WHEN 'healthcare-medical' THEN 'healthcare'
    WHEN 'healthcare-medical-billing' THEN 'healthcare'
    WHEN 'travel-transportation' THEN 'travel'
    WHEN 'travel--transportation' THEN 'travel'
    ELSE normalized
  END;
  NEW.category_id := normalized;
  IF TG_TABLE_NAME = 'content_plans' AND NEW.subcategory_slug IS NULL THEN
    NEW.subcategory_slug := 'general';
  END IF;
  RETURN NEW;
END;
$$;

-- Embedding queue trigger
CREATE OR REPLACE FUNCTION public.queue_embedding_on_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO public.embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'publish', 100)
    ON CONFLICT (content_type, content_id) WHERE processed_at IS NULL DO NOTHING;
  END IF;
  IF NEW.status = 'published' AND OLD.status = 'published' AND NEW.content_hash IS DISTINCT FROM OLD.content_hash THEN
    INSERT INTO public.embedding_queue (content_type, content_id, trigger_source, priority)
    VALUES ('blog_post', NEW.id, 'update', 50)
    ON CONFLICT (content_type, content_id) WHERE processed_at IS NULL DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Link count reconciliation
CREATE OR REPLACE FUNCTION public.reconcile_link_counts()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' SET statement_timeout TO '120s' AS $$
DECLARE
  inbound_updated INT := 0; outbound_updated INT := 0; ghosts_reset INT := 0; short_links_found INT := 0;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  CREATE TEMP TABLE _extracted_links ON COMMIT DROP AS
  SELECT bp.id AS source_id, m[1] AS target_slug
  FROM blog_posts bp, LATERAL regexp_matches(bp.content, '/articles/[^/"'']+/([^/"''#?]+)', 'g') AS m
  WHERE bp.status = 'published';
  CREATE TEMP TABLE _bare_slug_links ON COMMIT DROP AS
  SELECT bp.id AS source_id, ae.slug AS target_slug
  FROM blog_posts bp, LATERAL regexp_matches(bp.content, 'href="/([a-z0-9][a-z0-9-]{8,})"', 'g') AS m
  INNER JOIN article_embeddings ae ON ae.slug = m[1]
  WHERE bp.status = 'published'
    AND m[1] !~ '^(articles|templates|guides|admin|auth|dashboard|login|signup|pricing|about|contact|faq|privacy|terms|disclaimer|cookie-policy|how-it-works|settings)';
  SELECT COUNT(*) INTO short_links_found FROM _bare_slug_links;
  CREATE TEMP TABLE _all_links ON COMMIT DROP AS
  SELECT DISTINCT source_id, target_slug FROM _extracted_links UNION SELECT DISTINCT source_id, target_slug FROM _bare_slug_links;
  CREATE TEMP TABLE _inbound ON COMMIT DROP AS
  SELECT ae.id AS embedding_id, COUNT(DISTINCT el.source_id) AS real_inbound
  FROM article_embeddings ae LEFT JOIN _all_links el ON el.target_slug = ae.slug
  WHERE ae.embedding_status = 'completed' GROUP BY ae.id;
  CREATE TEMP TABLE _outbound ON COMMIT DROP AS
  SELECT ae.id AS embedding_id, COUNT(DISTINCT el.target_slug) AS real_outbound
  FROM article_embeddings ae LEFT JOIN _all_links el ON el.source_id = ae.content_id
  WHERE ae.embedding_status = 'completed' GROUP BY ae.id;
  UPDATE article_embeddings ae SET inbound_count = COALESCE(ib.real_inbound, 0)
  FROM _inbound ib WHERE ae.id = ib.embedding_id AND ae.inbound_count IS DISTINCT FROM COALESCE(ib.real_inbound, 0);
  GET DIAGNOSTICS inbound_updated = ROW_COUNT;
  UPDATE article_embeddings ae SET outbound_count = COALESCE(ob.real_outbound, 0)
  FROM _outbound ob WHERE ae.id = ob.embedding_id AND ae.outbound_count IS DISTINCT FROM COALESCE(ob.real_outbound, 0);
  GET DIAGNOSTICS outbound_updated = ROW_COUNT;
  UPDATE link_suggestions ls SET status = 'approved', applied_at = NULL
  WHERE ls.status = 'applied' AND NOT EXISTS (SELECT 1 FROM _all_links el WHERE el.source_id = ls.source_post_id AND el.target_slug = ls.target_slug);
  GET DIAGNOSTICS ghosts_reset = ROW_COUNT;
  RETURN jsonb_build_object('inbound_updated', inbound_updated, 'outbound_updated', outbound_updated,
    'ghosts_reset', ghosts_reset, 'short_links_found', short_links_found);
END;
$$;

-- Stale job recovery functions
-- NOTE: Update YOUR_SUPABASE_URL and YOUR_ANON_KEY in these functions after migration
CREATE OR REPLACE FUNCTION public.recover_stale_generating_items()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.content_queue SET status = 'failed', error_message = 'Generation timed out after 10 minutes'
  WHERE status = 'generating' AND started_at < NOW() - INTERVAL '10 minutes' AND (generated_at IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.recover_stale_planning_jobs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.bulk_planning_jobs SET status = 'failed', completed_at = NOW(),
    error_messages = error_messages || '{"_timeout": "Job timed out - no progress for 10+ minutes"}'::jsonb
  WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '10 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_orphaned_generating_items()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE reset_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE content_queue SET status = 'queued', error_message = NULL, started_at = NULL
  WHERE status = 'generating' AND started_at < now() - interval '10 minutes'
    AND NOT EXISTS (SELECT 1 FROM generation_jobs WHERE status = 'processing');
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$;

-- NOTE: recover_stale_backfill_jobs, recover_stale_generation_jobs,
-- recover_stale_image_optimization_jobs, recover_stale_semantic_scan_jobs
-- all contain hardcoded project URLs. You MUST update them with your new Supabase URL + keys.
-- I've omitted them here. Copy from the source and replace:
--   'https://koulmtfnkuapzigcplov.supabase.co' -> 'https://YOUR-PROJECT.supabase.co'
--   The anon key -> Your new anon key

-- =============================================================================
-- PHASE 6: TRIGGERS
-- =============================================================================

-- updated_at triggers
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bulk_planning_jobs_updated_at BEFORE UPDATE ON public.bulk_planning_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_plans_updated_at BEFORE UPDATE ON public.content_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_embedding_jobs_updated_at BEFORE UPDATE ON public.embedding_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON public.generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_letter_purchases_updated_at BEFORE UPDATE ON public.letter_purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_og_images_updated_at BEFORE UPDATE ON public.og_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_seo_overrides_updated_at BEFORE UPDATE ON public.template_seo_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_stats_updated_at BEFORE UPDATE ON public.template_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Special triggers
CREATE TRIGGER update_dispute_outcomes_updated_at BEFORE UPDATE ON public.dispute_outcomes FOR EACH ROW EXECUTE FUNCTION update_dispute_outcomes_updated_at();
CREATE TRIGGER update_article_embeddings_updated_at BEFORE UPDATE ON public.article_embeddings FOR EACH ROW EXECUTE FUNCTION update_embeddings_updated_at();
CREATE TRIGGER trigger_embedding_on_publish AFTER INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION queue_embedding_on_publish();
CREATE TRIGGER trg_normalize_category_id_article_embeddings BEFORE INSERT OR UPDATE OF category_id ON public.article_embeddings FOR EACH ROW EXECUTE FUNCTION normalize_category_id();
CREATE TRIGGER trg_normalize_category_id_content_plans BEFORE INSERT OR UPDATE OF category_id ON public.content_plans FOR EACH ROW EXECUTE FUNCTION normalize_category_id();
CREATE TRIGGER check_credit_limit BEFORE INSERT ON public.user_credits FOR EACH ROW EXECUTE FUNCTION check_user_credit_limit();

-- =============================================================================
-- PHASE 7: ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backfill_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_planning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_news_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_publish_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_index_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_performance_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_optimization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_planning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.og_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_seo_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 8: RLS POLICIES
-- =============================================================================

-- analytics_events
CREATE POLICY "Admins can view all analytics" ON public.analytics_events FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Anonymous users can insert limited analytics events" ON public.analytics_events FOR INSERT TO anon
  WITH CHECK ((user_id IS NULL) AND (event_type = ANY (ARRAY['page_view','template_view','category_view','article_view','guide_view','search','cta_click','assistant_open','browse_templates_click','login_complete','signup_started','signup_complete','google_auth_click','dashboard_view'])) AND ((event_data IS NULL) OR (pg_column_size(event_data) < 4096)));
CREATE POLICY "Authenticated users can insert analytics events" ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- article_embeddings
CREATE POLICY "Admins can manage embeddings" ON public.article_embeddings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access embeddings" ON public.article_embeddings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- backfill_jobs
CREATE POLICY "Admins can manage backfill jobs" ON public.backfill_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access backfill jobs" ON public.backfill_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- blog_categories
CREATE POLICY "Admins can manage categories" ON public.blog_categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view blog categories" ON public.blog_categories FOR SELECT USING (true);

-- blog_posts
CREATE POLICY "Admins can create posts" ON public.blog_posts FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update posts" ON public.blog_posts FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all posts" ON public.blog_posts FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published');

-- blog_tags
CREATE POLICY "Admins can manage tags" ON public.blog_tags FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view blog tags" ON public.blog_tags FOR SELECT USING (true);

-- bulk_planning_jobs
CREATE POLICY "Admins can create bulk planning jobs" ON public.bulk_planning_jobs FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete bulk planning jobs" ON public.bulk_planning_jobs FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update bulk planning jobs" ON public.bulk_planning_jobs FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view bulk planning jobs" ON public.bulk_planning_jobs FOR SELECT USING (is_admin(auth.uid()));

-- canonical_anchors
CREATE POLICY "Admins manage anchors" ON public.canonical_anchors FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access anchors" ON public.canonical_anchors FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- category_images
CREATE POLICY "Anyone can view cached images" ON public.category_images FOR SELECT USING (true);
CREATE POLICY "Service role can manage images" ON public.category_images FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- consumer_news_cache
CREATE POLICY "Anyone can view news cache" ON public.consumer_news_cache FOR SELECT USING (true);
CREATE POLICY "Service role can manage news cache" ON public.consumer_news_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- content_plans
CREATE POLICY "Admins can create content plans" ON public.content_plans FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete content plans" ON public.content_plans FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update content plans" ON public.content_plans FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all content plans" ON public.content_plans FOR SELECT USING (is_admin(auth.uid()));

-- content_queue
CREATE POLICY "Admins can create queue items" ON public.content_queue FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete queue items" ON public.content_queue FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update queue items" ON public.content_queue FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all queue items" ON public.content_queue FOR SELECT USING (is_admin(auth.uid()));

-- daily_publish_jobs
CREATE POLICY "Admins can manage publish jobs" ON public.daily_publish_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access publish jobs" ON public.daily_publish_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- dispute_outcomes
CREATE POLICY "Admins can view all disputes" ON public.dispute_outcomes FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can delete own disputes" ON public.dispute_outcomes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own disputes" ON public.dispute_outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own disputes" ON public.dispute_outcomes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own disputes" ON public.dispute_outcomes FOR SELECT USING (auth.uid() = user_id);

-- embedding_jobs
CREATE POLICY "Admins can create embedding jobs" ON public.embedding_jobs FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete embedding jobs" ON public.embedding_jobs FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update embedding jobs" ON public.embedding_jobs FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view embedding jobs" ON public.embedding_jobs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access embedding jobs" ON public.embedding_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- embedding_queue
CREATE POLICY "Admins can manage embedding queue" ON public.embedding_queue FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access embedding queue" ON public.embedding_queue FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- evidence_photos
CREATE POLICY "Service role can manage evidence photos" ON public.evidence_photos FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can create own evidence photos" ON public.evidence_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence photos" ON public.evidence_photos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence photos" ON public.evidence_photos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own evidence photos" ON public.evidence_photos FOR SELECT USING (auth.uid() = user_id);

-- generation_jobs (assumed admin + service_role pattern)
CREATE POLICY "Admins can manage generation jobs" ON public.generation_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access generation jobs" ON public.generation_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- gsc_index_status
CREATE POLICY "Admins can manage GSC index status" ON public.gsc_index_status FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access GSC index status" ON public.gsc_index_status FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- gsc_performance_cache
CREATE POLICY "Admins can manage GSC cache" ON public.gsc_performance_cache FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access GSC cache" ON public.gsc_performance_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- gsc_recommendations_cache (assumed admin + service_role pattern)
CREATE POLICY "Admins can manage GSC recommendations" ON public.gsc_recommendations_cache FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access GSC recommendations" ON public.gsc_recommendations_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- image_optimization_jobs
CREATE POLICY "Admins can manage optimization jobs" ON public.image_optimization_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access optimization jobs" ON public.image_optimization_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- keyword_planning_jobs
CREATE POLICY "Admins can manage keyword planning jobs" ON public.keyword_planning_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access keyword planning jobs" ON public.keyword_planning_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- keyword_targets
CREATE POLICY "Admins can manage keyword targets" ON public.keyword_targets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access keyword targets" ON public.keyword_targets FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- letter_analyses
CREATE POLICY "Anyone can view analyses for rate limiting" ON public.letter_analyses FOR SELECT USING (true);
CREATE POLICY "Service role can manage analyses" ON public.letter_analyses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- letter_purchases
CREATE POLICY "Admins can view all purchases" ON public.letter_purchases FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can insert own purchases" ON public.letter_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own letters for editing" ON public.letter_purchases FOR UPDATE
  USING ((auth.uid() = user_id) OR (email = auth.email())) WITH CHECK ((auth.uid() = user_id) OR (email = auth.email()));
CREATE POLICY "Users can view their own purchases" ON public.letter_purchases FOR SELECT
  USING ((auth.uid() IS NOT NULL) AND ((auth.uid() = user_id) OR (email = auth.email())));

-- link_suggestions
CREATE POLICY "Admins can create link suggestions" ON public.link_suggestions FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete link suggestions" ON public.link_suggestions FOR DELETE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update link suggestions" ON public.link_suggestions FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Admins can view all link suggestions" ON public.link_suggestions FOR SELECT USING (is_admin(auth.uid()));

-- og_images
CREATE POLICY "Admins can manage OG images" ON public.og_images FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view OG images" ON public.og_images FOR SELECT USING (true);
CREATE POLICY "Service role full access OG images" ON public.og_images FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- pages (assumed public read, admin write)
CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view published pages" ON public.pages FOR SELECT USING (status = 'published');

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_admin = (SELECT is_admin FROM profiles WHERE user_id = auth.uid()) AND role = (SELECT role FROM profiles WHERE user_id = auth.uid()) AND status = (SELECT status FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (is_admin(auth.uid()));

-- refund_logs
CREATE POLICY "Admins can create refund logs" ON public.refund_logs FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view refund logs" ON public.refund_logs FOR SELECT USING (is_admin(auth.uid()));

-- semantic_scan_jobs
CREATE POLICY "Admins can manage scan jobs" ON public.semantic_scan_jobs FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Service role full access scan jobs" ON public.semantic_scan_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- site_settings
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);

-- template_seo_overrides
CREATE POLICY "Admins can manage template SEO" ON public.template_seo_overrides FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can read template SEO" ON public.template_seo_overrides FOR SELECT USING (true);

-- template_stats
CREATE POLICY "Admins can manage template stats" ON public.template_stats FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view template stats" ON public.template_stats FOR SELECT USING (true);
CREATE POLICY "Service role can manage template stats" ON public.template_stats FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- user_credits
CREATE POLICY "Admins can grant credits" ON public.user_credits FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view all credits" ON public.user_credits FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Service role can update credits" ON public.user_credits FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);

-- user_letters
CREATE POLICY "Admins can view all letters" ON public.user_letters FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Users can create their own letters" ON public.user_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own letters" ON public.user_letters FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own letters" ON public.user_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own letters" ON public.user_letters FOR SELECT USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- PHASE 9: STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('evidence-photos', 'evidence-photos', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);
INSERT INTO storage.buckets (id, name, public) VALUES ('letters', 'letters', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('og-images', 'og-images', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Admins can upload blog images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins can update blog images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));
CREATE POLICY "Admins can delete blog images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Users can upload evidence photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own evidence photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own evidence photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'evidence-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Service role can access all evidence photos" ON storage.objects FOR ALL
  USING (bucket_id = 'evidence-photos' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'evidence-photos' AND auth.role() = 'service_role');

CREATE POLICY "Service role can insert letters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'letters');
CREATE POLICY "Users can view own letters" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'letters' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Anyone can view OG images" ON storage.objects FOR SELECT USING (bucket_id = 'og-images');
CREATE POLICY "Service role can manage OG images" ON storage.objects FOR ALL
  USING (bucket_id = 'og-images' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'og-images' AND auth.role() = 'service_role');

-- =============================================================================
-- PHASE 10: CRON JOBS (set up in Supabase dashboard > Database > Extensions > pg_cron)
-- NOTE: Update URLs with your new project URL and anon key
-- =============================================================================

-- Job 1: Recover stale image optimization jobs (every 5 min)
-- SELECT cron.schedule('recover-stale-image-opt', '*/5 * * * *', 'SELECT public.recover_stale_image_optimization_jobs()');

-- Job 2: Recover stale generation jobs (every 5 min)
-- SELECT cron.schedule('recover-stale-gen', '*/5 * * * *', 'SELECT public.recover_stale_generation_jobs()');

-- Job 3: Recover stale backfill jobs (every 30 min)
-- SELECT cron.schedule('recover-stale-backfill', '*/30 * * * *', 'SELECT public.recover_stale_backfill_jobs()');

-- Job 4: Recover stale semantic scan jobs (every 2 min)
-- SELECT cron.schedule('recover-stale-semantic', '*/2 * * * *', 'SELECT public.recover_stale_semantic_scan_jobs()');

-- Job 5: Send follow-up reminders (daily at 9am)
-- SELECT cron.schedule('send-followup', '0 9 * * *', $$
--   SELECT net.http_post(
--     url := 'https://YOUR-PROJECT.supabase.co/functions/v1/send-follow-up-reminders',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
-- $$);

-- Job 6: Daily auto-publish (daily at 9am)
-- SELECT cron.schedule('daily-publish', '0 9 * * *', $$
--   SELECT net.http_post(
--     url := 'https://YOUR-PROJECT.supabase.co/functions/v1/daily-auto-publish',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--     body := '{}'::jsonb
--   );
-- $$);

-- =============================================================================
-- PHASE 11: REALTIME (if needed)
-- =============================================================================
-- Enable realtime on tables that need it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.content_queue;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_jobs;
-- etc.

-- =============================================================================
-- DONE! Next steps:
-- 1. Run this SQL in your new Supabase project's SQL editor
-- 2. Export data from current project and import to new
-- 3. Update recovery functions with new project URL
-- 4. Set up cron jobs (uncomment and update URLs above)
-- 5. Deploy edge functions with `supabase functions deploy`
-- 6. Configure secrets in Supabase dashboard
-- =============================================================================
