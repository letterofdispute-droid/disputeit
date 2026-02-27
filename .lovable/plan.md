

## Full Website Audit Report

### 1. SEO Issues

**Missing `noIndex` on private pages:**
- `LetterEditorPage.tsx` — renders at `/letters/:purchaseId/edit` (user-specific content) but has NO `noIndex` flag. Search engines could index these private letter editing URLs.

**NotFound page uses raw `<Helmet>` instead of `<SEOHead>`:**
- `NotFound.tsx` uses `<Helmet>` directly with `<meta name="robots" content="noindex, nofollow" />` instead of using the centralized `<SEOHead>` component with `noIndex={true}`. This works but bypasses OG tags, canonical normalization, and structured data.

**Sitemap gap — missing tool pages:**
- `sitemap-static.xml` includes `/small-claims/statement-generator` but is missing `/small-claims/cost-calculator`, `/small-claims/demand-letter-cost`, and `/small-claims/escalation-guide`. These ARE in `sitemap-small-claims.xml` though, so they're covered — but they're duplicated across sitemap files with different priorities. Not harmful but untidy.

**OG image fallback is SVG:**
- `SEOHead.tsx` defaults to `/ld-logo.svg` for `og:image`. Many social platforms (Facebook, LinkedIn) do not render SVG OG images. Should fall back to a raster image (PNG/JPG).

### 2. Security

**Strengths (already solid):**
- CSP headers configured in `_headers`
- HSTS with preload
- X-Frame-Options, X-Content-Type-Options, Referrer-Policy all set
- DOMPurify used for all user-facing HTML rendering (ArticlePage, ContentPreview)
- RLS policies on database tables
- Admin RPCs check `is_admin()` or `service_role`
- reCAPTCHA on login/signup
- Input validation on public AI endpoints (message limits, character limits)
- `noIndex` on auth/dashboard pages

**Issues found:**
- `dangerouslySetInnerHTML` on SVG map components (`USMap.tsx`, `StateRightsMap.tsx`) — these load SVG content but it's not clear if it's sanitized through DOMPurify. If SVG is fetched from a static file this is low risk, but worth verifying.
- Console log shows `Failed to fetch` error in `AdminSettings` — the image optimizer trigger is failing silently. Non-fatal but indicates a broken admin feature.

### 3. UI/UX Consistency

**Hero section inconsistencies (previously identified, now fixed):**
- All 4 tool pages were updated in the previous session to Pattern A. No further hero issues.

**Footer link density:**
- Footer has 6 columns which is good for SEO but may feel cramped on tablet viewports (768-1024px). The `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` handles this reasonably.

**Mobile menu completeness:**
- Mobile Sheet menu mirrors desktop MegaMenu categories well with Accordion pattern
- "Get Started" in mobile is a direct link to `/how-it-works`, while in desktop it's a dropdown — slight behavioral difference but acceptable

**404 page:**
- Well designed with search, category suggestions, and URL-based hints
- Uses framer-motion animations appropriately

### 4. Usability & Connectivity

**Scroll behavior:** `ScrollToTop` correctly resets scroll on navigation and handles hash-based smooth scrolling.

**Trailing slash normalization:** Triple-layer enforcement (edge `_redirects`, client `TrailingSlashRedirect`, `SEOHead` canonical stripping) — thorough.

**Auth flow:** 
- OAuth redirect handling with `AuthRedirectHandler` and `processOAuthToken`
- 8-second safety timeout on auth initialization prevents infinite loading states
- Protected routes redirect to `/login` with return-path state

**Lazy loading:** 
- Good code splitting with `lazyRetry` pattern that auto-reloads on stale chunks
- Images use `loading="lazy"` in article and blog components
- React Query configured with 5-min stale time, no refetch on window focus

### 5. Recommended Fixes (Priority Order)

1. **Add `noIndex={true}` to `LetterEditorPage.tsx`** — all 3 SEOHead instances (loading, error, and main states) should have `noIndex` to prevent indexing of private user content.

2. **Replace SVG OG fallback with a raster image** — create/reference a `ld-og-default.png` (1200x630) as the default OG image instead of SVG.

3. **Migrate `NotFound.tsx` to use `<SEOHead>`** — replace raw `<Helmet>` with `<SEOHead noIndex={true}>` for consistency and to get proper OG tags on 404 pages shared via URL.

4. **Verify SVG map sanitization** — confirm `USMap.tsx` and `StateRightsMap.tsx` fetch from local static files only (not user-controllable sources).

5. **Fix AdminSettings image optimizer fetch error** — the `Failed to fetch` in console suggests a CORS or endpoint issue in the admin image optimization trigger.

