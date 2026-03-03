

# Full Migration Plan: Lovable Cloud to Self-Hosted Supabase

## Scope Summary

- **38 tables** in public schema
- **4 storage buckets** (blog-images, evidence-photos, letters, og-images)
- **60 edge functions**
- **25+ custom database functions** (RPCs)
- **1 enum type** (app_role)
- **Extensions**: pgvector, pg_cron, pgcrypto, uuid-ossp
- **10 secrets** to reconfigure
- **21 edge functions** using Lovable AI Gateway (must be repointed)

## Phase 1: Create New Supabase Project

1. Go to supabase.com, create a new project
2. Note your project URL, anon key, and service role key
3. Enable extensions in SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

## Phase 2: Schema Migration

Run these SQL statements in order in the Supabase SQL editor.

### 2a. Enum Types

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
```

### 2b. Tables (in dependency order)

```sql
-- profiles (referenced by other tables)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- site_settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- blog_categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- blog_tags (check structure)
-- blog_posts
-- content_plans
-- content_queue
-- letter_purchases
-- analytics_events
-- article_embeddings
-- link_suggestions
-- ... (all 38 tables)
```

I will generate the **complete CREATE TABLE statements** for all 38 tables by querying the current schema's column definitions, constraints, and defaults. This will be a large SQL file.

### 2c. Custom Functions (RPCs)

All 25+ functions need to be exported. Key ones:

```sql
-- has_role (critical for RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id AND role = 'admin'
  )
$$;

-- handle_new_user (auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Plus ~22 more functions (get_article_health_data, get_seo_metrics, increment_link_counters, etc.). I will extract all their definitions.

### 2d. RLS Policies

Every table's RLS policies need recreation. There are approximately 80+ policies across 38 tables. I will generate them all.

### 2e. Storage Buckets

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('blog-images', 'blog-images', true),
  ('evidence-photos', 'evidence-photos', false),
  ('letters', 'letters', false),
  ('og-images', 'og-images', true);
```

Plus storage RLS policies for each bucket (MIME type restrictions, size limits, ownership checks).

## Phase 3: Data Migration

Export from current project, import to new:

1. **blog_posts**: Export all rows (this is your main content)
2. **blog_categories, blog_tags**: Reference data
3. **site_settings**: Configuration
4. **template_seo_overrides, template_stats**: SEO data
5. **letter_purchases**: Transaction history
6. **profiles, user_roles**: User data (users themselves migrate via auth export)
7. **article_embeddings**: Vector data
8. **All other tables**: content_plans, content_queue, link_suggestions, etc.

Auth users must be exported/imported via Supabase CLI: `supabase auth export` / `supabase auth import`.

Storage files (images, PDFs) must be downloaded and re-uploaded to the new buckets.

## Phase 4: Edge Functions Migration

### 4a. AI Gateway Replacement (21 functions)

Every function calling `ai.gateway.lovable.dev` with `LOVABLE_API_KEY` must be updated to call Google's API directly:

```typescript
// BEFORE (Lovable AI Gateway)
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
  body: JSON.stringify({ model: 'google/gemini-2.5-flash', ... })
});

// AFTER (Google Gemini direct)
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get('GOOGLE_GEMINI_API_KEY')}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      // ... Google's format differs from OpenAI format
    })
  }
);
```

Alternatively, use the OpenAI-compatible endpoint Google provides to minimize code changes:
```
https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```
with API key as Bearer token. This keeps the same request/response format.

### 4b. Deploy all 60 functions

```bash
cd supabase
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

## Phase 5: Secrets Configuration

Set these in your new Supabase dashboard (Project Settings > Edge Functions > Secrets):

| Secret | Source |
|--------|--------|
| GOOGLE_GEMINI_API_KEY | Google AI Studio |
| GOOGLE_SERVICE_ACCOUNT_KEY | Google Cloud Console |
| GSC_SITE_URL | Your site URL |
| OPENAI_API_KEY | OpenAI dashboard |
| PIXABAY_API_KEY | Pixabay |
| RECAPTCHA_SECRET_KEY | Google reCAPTCHA |
| RESEND_API_KEY | Resend dashboard |
| STRIPE_SECRET_KEY | Stripe dashboard |
| VITE_RECAPTCHA_SITE_KEY | Google reCAPTCHA |

`LOVABLE_API_KEY` is replaced by `GOOGLE_GEMINI_API_KEY` (or kept if using OpenAI-compatible endpoint).

## Phase 6: Frontend Configuration

Update `.env` in your new Lovable project (or hosting config):
```
VITE_SUPABASE_URL=https://YOUR-NEW-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key
VITE_SUPABASE_PROJECT_ID=your-new-project-id
```

## Phase 7: Hosting & Domain

1. Connect GitHub repo to Netlify/Vercel/your server
2. Point `letterofdispute.com` DNS to new host
3. Configure Supabase Auth > URL Configuration:
   - Site URL: `https://letterofdispute.com`
   - Redirect URLs: `https://letterofdispute.com/**`

## Phase 8: SEO Fix (finally works)

On Netlify/your server, the pre-rendered static HTML files generated by the build script will be served correctly. No User-Agent tricks needed - the file system serves the right files.

## Implementation Approach

When you're ready to proceed, I will:
1. Query every table's full column definitions and generate complete CREATE TABLE SQL
2. Export all custom function definitions
3. Generate all RLS policies
4. Update all 21 edge functions to use Google's API directly
5. Provide a step-by-step checklist

This is a large migration (~2-3 sessions of work). The most time-consuming parts are the AI gateway replacement across 21 functions and the complete RLS policy recreation.

