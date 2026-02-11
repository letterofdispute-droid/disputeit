

# Comprehensive Admin & Platform Improvements

This plan covers 6 areas you requested. Given the scope, I recommend implementing them in phases.

---

## Phase 1: Quick Fixes (Immediate)

### 1A. Orders: Handle Credit Redemptions Correctly

**Problem**: Credit redemptions create `amount_cents = 0` purchases that inflate "Completed Orders" count and deflate "Average Order Value."

**Fix** (2 files):
- **`AdminOrders.tsx`**: Split stats into "Paid Orders" vs "Credit Redemptions". Revenue only counts `amount_cents > 0`. Add a "Credit" badge in the orders table for `amount_cents = 0` rows.
- **`AdminAnalytics.tsx`**: Same logic -- revenue metrics exclude $0 orders; add a separate "Credit Redemptions" counter.

### 1B. Prices from Settings Reflected Sitewide

**Problem**: Prices are hardcoded as `$9.99` / `$14.99` / `$5.99` in 5+ UI components and the checkout edge function uses Stripe Price IDs.

**Solution**: Create a `useSiteSettings` hook that fetches `pdf_only_price` and `pdf_editable_price` from `site_settings` and caches them. Update these components to use the hook:
- `src/components/home/Pricing.tsx` -- homepage pricing cards
- `src/components/letter/PricingModal.tsx` -- checkout modal
- `src/components/letter/UnlockEditingModal.tsx` -- re-edit pricing
- `src/pages/PricingPage.tsx` -- dedicated pricing page
- `src/pages/HowItWorksPage.tsx` -- FAQ answers mentioning prices

The checkout edge function (`create-letter-checkout`) will also need to read the price from `site_settings` to pass the correct `amount_cents` to Stripe. Note: The Stripe Price IDs are currently hardcoded -- changing prices in settings will update the UI display, but the actual Stripe charge amount is controlled by the Stripe Price object. For full dynamic pricing, we'd need to create Stripe checkout sessions with `line_items` using `price_data` instead of fixed Price IDs.

---

## Phase 2: SEO Editing (Medium)

### 2A. Editable SEO on Template Pages

**Problem**: Template SEO (title, description) is defined in code files and can only be changed by editing source code.

**Solution**: Create a `template_seo_overrides` table that stores admin-edited SEO metadata per template slug. The template page will check for an override before falling back to the code-defined values.

- New table: `template_seo_overrides` (slug, meta_title, meta_description, updated_at)
- Update `AdminTemplates.tsx`: Add an "Edit SEO" button per row that opens an inline editor
- Update `LetterPage.tsx`: Fetch override from DB, merge with code defaults

### 2B. Blog SEO Editing

**Problem**: Blog posts already have `meta_title` and `meta_description` columns and the editor has an SEO panel. This should already work.

**Verification**: The `AdminBlogEditor.tsx` already has the `SEOPanel` component. If the issue is that you can't edit SEO on *published* posts easily, I'll add a quick-edit SEO modal accessible from the blog list view (similar to what we'll do for templates).

---

## Phase 3: CMS Pages Migration (Larger Effort)

### 3. Migrate Static Pages to CMS

**Problem**: About, FAQ, Contact, How It Works, Disclaimer, Privacy, Terms are hardcoded React components. The admin Pages section queries the `pages` database table which is empty.

**Solution**: Seed the `pages` table with existing page content, then update the page routes to render from DB content with a fallback to the static component.

Steps:
1. Create a migration that inserts the existing static pages into the `pages` table with their current content (title, slug, excerpt, meta fields)
2. Create a generic `DynamicPage` component that fetches page content from DB and renders HTML
3. Update routes to try DB-based rendering first, fall back to static components
4. Admin Pages will then show all pages and allow editing

This is the most complex item -- the static pages have custom layouts (FAQ has accordions, Pricing has cards). The CMS version would need to support rich HTML content or we keep the static components but allow SEO metadata editing from admin. I recommend starting with **SEO metadata editing only** (title, description) from the Pages admin, keeping the page layouts in code.

---

## Phase 4: Full Funnel Analytics (Larger Effort)

### 4. Upgrade Analytics to Full Funnel Tracking

**Current limitation**: Analytics only records events from authenticated users (RLS policy: `auth.uid() = user_id`).

**Solution**:

1. **Allow anonymous event insertion**: Add an RLS policy that allows inserts with `user_id = NULL` for specific event types, or use an edge function to insert events server-side (bypassing RLS)
2. **Expand event types**: Add these to the tracking system:
   - `form_started` -- user begins filling a template form
   - `form_completed` -- user finishes form and sees letter preview
   - `checkout_initiated` -- user opens pricing modal
   - `checkout_completed` -- purchase confirmed
   - `credit_redeemed` -- free credit used
3. **Add session tracking**: Generate a session ID (stored in sessionStorage) to link anonymous events to eventual signups
4. **Build funnel visualization**: New admin dashboard tab showing:

```text
Visit -> Template View -> Form Fill -> Checkout Open -> Purchase
  100%      45%             22%          8%              3.5%
```

5. **Add these dashboard sections**:
   - Funnel chart (bar/sankey diagram)
   - Top landing pages
   - Template conversion rates (which templates sell best)
   - User journey paths
   - Time-to-purchase distribution
   - Geographic breakdown (from browser locale)

---

## Phase 5: Backups

### 5. Automated Backup Notifications

The CSV export system already exists. To add a safety net:
- Add a "Last Backup" timestamp in `site_settings`
- Show a warning banner in admin dashboard if no export has been done in 7+ days
- The actual database is managed by Lovable Cloud which handles infrastructure-level backups automatically

---

## Technical Details

### New Database Table

```sql
CREATE TABLE public.template_seo_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.template_seo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template SEO"
  ON public.template_seo_overrides FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read template SEO"
  ON public.template_seo_overrides FOR SELECT
  USING (true);
```

### New Hook: `useSiteSettings`

```text
Fetches all site_settings rows, caches with React Query.
Returns: { pdfOnlyPrice, pdfEditablePrice, siteName, ... }
Used by: Pricing.tsx, PricingModal.tsx, HowItWorksPage.tsx, etc.
```

### Analytics RLS Change

```sql
-- Allow anonymous event insertion via edge function
-- Or: relax INSERT policy to not require user_id
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);
```

(With server-side validation in the tracking code to prevent abuse)

---

## Implementation Order

1. Orders fix + dynamic pricing hook (Phase 1) -- immediate value
2. Template SEO overrides (Phase 2A) -- high SEO impact
3. Blog quick-edit SEO (Phase 2B) -- convenience
4. Pages CMS migration (Phase 3) -- after confirming approach
5. Analytics upgrade (Phase 4) -- largest effort
6. Backup reminders (Phase 5) -- quick add-on

