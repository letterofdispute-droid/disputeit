

# Performance Bottleneck Audit and Fixes

## Summary

There are **6 significant over-fetching problems** still in the codebase. Several follow the exact same pattern as the blog listing page you just had me fix. These should have been caught proactively -- you shouldn't have to point these out one by one.

---

## Bottleneck 1: Admin Orders -- fetches ALL purchases with full letter content

**File:** `src/pages/admin/AdminOrders.tsx`
**Problem:** `select('*')` on `letter_purchases` with no pagination. The `letter_content` field contains the full generated letter HTML for every order. As orders grow, this becomes a massive payload -- and the 1,000-row PostgREST limit silently hides older orders.
**Fix:**
- Use lean select: `id, email, template_name, template_slug, purchase_type, amount_cents, status, created_at, stripe_payment_intent_id, pdf_url, refunded_at, refund_reason, user_id`
- Drop `letter_content`, `docx_url`, `stripe_session_id` from list view (only needed in detail modal)
- Add server-side pagination with `.range()`
- Fetch `letter_content` on-demand when the detail modal opens
- Move stats to server-side aggregation (`count: exact, head: true`) instead of client-side `.filter().reduce()`

---

## Bottleneck 2: Admin Users -- fetches ALL profiles with no pagination

**File:** `src/pages/admin/AdminUsers.tsx`
**Problem:** `select('*')` on `profiles` with no limit or pagination. As user count grows, this will hit the 1,000-row cap and silently hide users. Search/filter happens client-side, wasting bandwidth.
**Fix:**
- Add server-side pagination with `.range()`
- Move search to server-side with `.ilike()`
- Use `{ count: 'exact' }` for stats instead of `data.length`

---

## Bottleneck 3: Admin Analytics -- fetches ALL analytics events

**File:** `src/pages/admin/AdminAnalytics.tsx`
**Problem:** `select('*')` on `analytics_events` for the selected period. Even a 30-day window could have tens of thousands of events. The full `event_data` JSON blob is fetched for every event, then filtered/grouped client-side. This will hit the 1,000-row cap, making analytics inaccurate.
**Fix:**
- Use server-side aggregation via database functions (RPC) for counts by event type and date
- Or at minimum, use `{ count: 'exact', head: true }` for totals and paginated fetching for chart data
- The purchases query already uses lean select -- good

---

## Bottleneck 4: ArticlePage related posts -- fetches full content for sidebar cards

**File:** `src/pages/ArticlePage.tsx` (line 125-133)
**Problem:** `select('*')` for related posts fetches full HTML `content` for 3 sidebar cards that only show title/excerpt/image.
**Fix:**
- Change to lean select: `slug, title, excerpt, category_slug, read_time, featured_image_url, published_at`

---

## Bottleneck 5: GapAnalysis -- fetches ALL published blog posts

**File:** `src/components/admin/seo/analytics/GapAnalysis.tsx`
**Problem:** `select('id, related_templates')` on ALL published blog posts (2,800+). This will hit the 1,000-row limit, making the gap analysis inaccurate.
**Fix:**
- Create a database function that aggregates article counts per template server-side
- Or use paginated fetching to get all posts in batches

---

## Bottleneck 6: Content Queue -- fetches up to 1,000 items with joined data

**File:** `src/hooks/useContentQueue.ts`
**Problem:** Fetches up to 1,000 queue items with a join to `content_plans`. While it has a limit, it still loads all items into memory for client-side filtering by category.
**Fix:**
- Move category filtering to the server side using a proper join filter
- Add pagination for the queue table view

---

## Implementation Order

1. **ArticlePage related posts** -- smallest change, immediate impact on every article page view (public-facing)
2. **Admin Orders** -- high-impact, `letter_content` is the heaviest field
3. **Admin Users** -- straightforward pagination add
4. **Admin Analytics** -- needs server-side aggregation for accuracy
5. **GapAnalysis** -- needs an RPC function for correct counts beyond 1,000 rows
6. **Content Queue** -- already partially optimized, lowest priority

Each fix follows the same pattern already established: lean `select()`, server-side pagination with `.range()`, and `{ count: 'exact' }` for totals.

