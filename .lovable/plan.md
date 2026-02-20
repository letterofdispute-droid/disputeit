
# Full Website Audit — Performance & Security

This is a comprehensive audit of every part of the website: homepage, template pages, articles, guides, state rights, deadlines calculator, consumer news, letter analyzer, user dashboard, settings, and all public/admin routes.

---

## Overall Assessment

The site is well-architected. Most critical security concerns are properly addressed. There are targeted improvements to make across three areas: **RLS policy gaps**, **performance quick wins**, and **SEO/metadata gaps on a handful of pages**.

---

## Security Findings

### CRITICAL — `letter_purchases` SELECT policy uses email fallback (exploitable)

The current SELECT policy on `letter_purchases` is:
```sql
USING (auth.uid() = user_id OR email = auth.email())
```

The `email = auth.email()` branch is dangerous. If a user changes their email or if a session token is intercepted, this creates a path to view purchases made before auth linkage. Additionally, `user_id` is nullable on this table — meaning guest purchases (no user_id) fall through to the email branch which is unvalidated for non-authenticated callers.

**Fix:** Add a hard authenticated-only guard. Guest purchases (user_id IS NULL) should only be accessible via the server-side edge function that verifies the Stripe session, not via direct DB select.

```sql
-- New SELECT policy (drop the old one first)
CREATE POLICY "Users can view own purchases"
ON letter_purchases FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (auth.uid() = user_id OR email = auth.email())
);
```

This ensures unauthenticated callers — even with a valid email in the session — cannot query the table.

---

### MEDIUM — `profiles` UPDATE policy has no `WITH CHECK` clause

The policy `Users can update their own profile` has:
- `USING (auth.uid() = user_id)` ✅
- `WITH CHECK: <nil>` ❌

Without a `WITH CHECK`, a user could update their row to set `is_admin = true` or change their `user_id` to another user's ID, because there is no constraint enforcing the shape of the updated row.

**Fix:**
```sql
-- Replace existing update policy
ALTER POLICY "Users can update their own profile" ON profiles
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (is_admin = (SELECT is_admin FROM profiles WHERE user_id = auth.uid()))
  );
```

This prevents privilege escalation via profile update.

---

### LOW — `analytics_events` INSERT policy uses `WITH CHECK (true)` — anonymous flood risk

The policy `Anyone can insert analytics events` has no length limit, no rate limit, and no content validation at the RLS layer. While analytics silently fail, a bad actor could flood this table with millions of rows trivially.

The `useAnalytics` hook already checks cookie consent before inserting, which is good. But the DB has no safeguard if the hook is bypassed.

**Fix:** Restrict anonymous inserts to require a minimum payload shape, or limit to `authenticated` role only. Since the site tracks anonymous page views, the best mitigation is adding a DB-level row limit trigger. As a lighter alternative, we scope insert access to only allow `event_type` values from an allowlist.

---

### INFO — `user_credits` exposes `granted_by` (admin UUID)

The `granted_by` column is an admin's UUID. While users can only SELECT their own credits, they can read the UUID of the admin who granted the credit. This leaks internal admin identity, which could help social engineering attacks.

**Fix:** Exclude `granted_by` from the user-facing SELECT policy by creating a view or updating the query in `useUserCredits` to never select `granted_by`.

---

### INFO — `Permissive RLS Policy Always True` linter warning (Supabase)

Tables with `WITH CHECK (true)` flagged by Supabase linter:
- `analytics_events` INSERT — discussed above
- `blog_categories`, `blog_tags`, `category_images`, `consumer_news_cache`, `letter_analyses`, `site_settings`, `template_seo_overrides`, `template_stats` — all are intentional public read tables (SELECT true is fine per spec)

The only actionable one is `analytics_events` INSERT.

---

### INFO — Extension in Public schema (Supabase linter)

The `vector` extension (pgvector) is installed in the `public` schema rather than a dedicated schema. This is a Supabase-managed configuration — it cannot be changed without dropping and recreating the extension. This is **not actionable** from the app layer and is noted as informational.

---

## Performance Findings

### HIGH — Dashboard makes 3 sequential uncoordinated fetches on mount

`Dashboard.tsx` calls `fetchLetters()`, `fetchPurchases()`, and `fetchProfile()` inside a single `useEffect` that fires when `user` is truthy. These three fetches run in parallel (good) but are not using React Query — they use raw `useState` and `setIsLoading`. This means:
1. No caching — every Dashboard navigation triggers 3 new Supabase round-trips
2. No stale-while-revalidate — users see a spinner on every visit
3. The `profile` state in Dashboard is a **duplicate** of the `profile` already available from `useAuth()` — a wasted fetch

**Fix:**
- Remove `fetchProfile()` from Dashboard entirely — use `profile` from `useAuth()` which is already loaded
- Migrate `fetchLetters` and `fetchPurchases` to `useQuery` with `staleTime: 5 * 60 * 1000` — this eliminates the loading spinner on return visits

---

### MEDIUM — `SettingsPage` re-fetches profile data already in AuthContext

`SettingsPage.tsx` calls `supabase.from('profiles').select(...)` on mount. `useAuth()` already contains `profile` (first_name, last_name, avatar_url). The settings page fetches the same data again unnecessarily, plus `email` and `created_at` which are available from `user` object in Auth.

**Fix:** Remove the `fetchProfile` call from `SettingsPage`. Read `profile` from `useAuth()` and `user.email` / `user.created_at` from the auth `user` object directly.

---

### MEDIUM — `letter_purchases` fetch in Dashboard has no limit

```typescript
const { data, error } = await supabase
  .from('letter_purchases')
  .select('...')
  .eq('status', 'completed')
  .order('created_at', { ascending: false });
  // NO .limit() call
```

For a power user with 50+ purchases, this returns every row. Supabase's default cap is 1000 rows.

**Fix:** Add `.limit(50)` and implement pagination if needed.

---

### LOW — Framer Motion animations on Dashboard load with delay cascade

The Dashboard uses `motion.div` with `delay: 0.1s / 0.2s / 0.3s / 0.4s / 0.5s` staggered animations. On a slow connection, the user sees sequential content pop-ins. This increases perceived load time.

**Fix:** Reduce delays to max 0.15s and use `layout` animations instead of staggered opacity/y transitions for stat blocks.

---

### LOW — Hero section uses `animate-float` on multiple elements simultaneously

`Hero.tsx` has 6+ elements with `animate-float` / `animate-float-delayed` / `animate-spin-slow`. These all use `will-change-transform` which is good, but running 6 simultaneous CSS animations on the LCP-critical first fold adds GPU compositing pressure on low-end mobile devices.

**Fix:** Remove `animate-spin-slow` from the accent diamond and limit concurrent float animations to max 2 on mobile (use `hidden sm:block` on decorative animated elements).

---

### LOW — `og-image.png` referenced but does not exist in `public/`

`index.html` and `SEOHead.tsx` both reference `/og-image.png`:
```html
<meta property="og:image" content="https://letterofdispute.com/og-image.png" />
```
This file does not appear in the project's `public/` directory. When shared on social media (Twitter/X, LinkedIn, Facebook), the preview card will show a broken image. This also affects every page using `SEOHead` with the default `ogImage`.

**Fix:** Create and add `public/og-image.png` (1200×630px recommended) to the repository. Until then, fall back to the logo SVG or hero background image.

---

## SEO / Metadata Gaps

### MEDIUM — Dashboard and Settings pages have wrong brand name in SEO title

```
title="Dashboard | DisputeLetters"      ← should be "Letter of Dispute"
title="Account Settings | DisputeLetters"
```

The site brand is consistently "Letter of Dispute" everywhere else. These two pages use an undifferentiated "DisputeLetters" variant. Since dashboard/settings are noindexed by default (not in sitemap), this is low SEO impact but matters for browser tab display.

**Fix:** Update both titles to use the correct brand name format: `"My Dashboard | Letter of Dispute"` and `"Account Settings | Letter of Dispute"`.

---

### LOW — Login/Signup pages lack `noindex` directive

`LoginPage` and `SignupPage` have SEO titles and descriptions but are not marked `noindex`. These pages should never rank in search — they have thin, duplicate-pattern content.

**Fix:** Add `<meta name="robots" content="noindex, nofollow" />` to the `SEOHead` on `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/dashboard`, and `/settings`.

---

### LOW — `ArticlePage` Article schema uses `new Date().toISOString()` as fallback for `datePublished`

```typescript
datePublished: publishedTime || new Date().toISOString(),
```

If `publishedTime` is missing, Google sees today's date — making the article appear freshly published every time the page renders. This inflates apparent freshness and can cause trust penalties.

**Fix:** Only emit the `datePublished` field when `publishedTime` is actually present.

---

## Implementation Plan

### Phase 1 — Security (Database Migration)

**File:** new migration SQL

1. Fix `letter_purchases` SELECT policy — add `auth.uid() IS NOT NULL` guard
2. Fix `profiles` UPDATE policy — add `WITH CHECK` preventing `is_admin` field modification
3. Scope `analytics_events` INSERT to require `auth.role() = 'authenticated'` OR limit via `event_type` allowlist

### Phase 2 — Performance (Code Changes)

**Files:** `src/pages/Dashboard.tsx`, `src/pages/SettingsPage.tsx`

1. Remove duplicate `fetchProfile` from Dashboard — use `profile` from `useAuth()`
2. Migrate `fetchLetters` + `fetchPurchases` to `useQuery` with stale caching
3. Add `.limit(50)` to purchases query
4. Reduce animation delay cascade from 0.5s max to 0.2s max

### Phase 3 — SEO Metadata (Code Changes)

**Files:** `src/pages/Dashboard.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`, `src/pages/ForgotPasswordPage.tsx`, `src/pages/ResetPasswordPage.tsx`, `src/components/SEOHead.tsx`

1. Fix brand name in Dashboard and Settings page titles
2. Add `noindex` support to `SEOHead` component (new optional prop)
3. Apply `noindex` to auth pages and dashboard/settings
4. Fix `datePublished` fallback in Article JSON-LD schema

### Phase 4 — Missing OG Image

**File:** `public/og-image.png`

Create and add a proper 1200×630px Open Graph image. This will require the user to supply an image file since it is a design asset. As an interim fix, update the `og:image` fallback in `SEOHead` to use `/ld-logo.svg` (which exists) until the proper image is created.
