
Goal: make internal-link integrity “waterproof” so scans do not bounce back after refresh, and ensure templates/tools/guides stay clean.

Current status from audit:
- Template/tools/guides frontend routing is mostly correct.
- Recurrence root cause is backend data + backend link writers:
  1) `content_plans.category_id` contains many legacy/noncanonical values (e.g. `Contractors`, `Damaged Goods`, `HOA & Property`) instead of canonical IDs.
  2) Deep Fix rewrites using those bad values, so links can become invalid again.
  3) `apply-links-bulk` currently writes template links as `/templates/{templateSlug}` (missing required category/subcategory path), which reintroduces broken links.

Implementation plan:

1) Canonicalize template category IDs at the source (database hardening)
- Add one-time migration to normalize all legacy `content_plans.category_id` values to canonical IDs.
- Backfill `subcategory_slug` to `'general'` where null.
- Add a DB normalization/validation trigger on `content_plans` insert/update so bad category formats cannot be saved again.

2) Fix the link writer that keeps reintroducing bad links
- Update `supabase/functions/apply-links-bulk/index.ts`:
  - `buildTargetUrl()` for template suggestions must resolve full hierarchical URL from `content_plans` (`/templates/{categoryId}/{subcategorySlug}/{templateSlug}`), not `/templates/{templateSlug}`.
  - Fix pillar CTA template URL generation with the same full path logic.
  - Add strict fallback behavior (no malformed template URL writes).

3) Make Deep Fix deterministic and persistent
- Update `supabase/functions/fix-broken-links/index.ts`:
  - Normalize template category IDs before constructing repaired URLs.
  - Add explicit rewrite coverage for legacy display-name categories (spaces, ampersands, title case).
  - Ensure deep-fix save path always persists transformed content consistently.
- Then run a full-batch repair pass over all published posts (offset pagination) until remaining broken links = 0.

4) Tighten generation-time and post-generation validation
- Update `supabase/functions/bulk-generate-articles/index.ts`:
  - Normalize `content_plans` categories when building URL registry and sanitizer rewrites.
  - Strengthen `validateAndStripBadLinks()` so template links are only kept if they resolve to canonical category + valid template slug path.
  - Keep destructive strip behavior for dead/unverifiable internal links.

5) Protect manual/admin-created content too
- Add validation pass on admin save/publish flow (`src/pages/admin/AdminBlogEditor.tsx` and generated-draft flow) so manually edited content is sanitized/validated before final write.
- This closes the gap where non-AI content could still introduce broken internal links.

6) Verification checklist (must pass before closing)
- Run full scanner across all offsets and confirm:
  - `totalBrokenLinks = 0`
  - no recurring jump back after refresh/re-scan
- Spot-check template/tools/guides routes and cross-links:
  - `/templates/:category/:subcategory/:slug`
  - `/guides/:category`
  - small-claims tool routes
- Confirm logs show stable post-fix behavior with no reintroduced malformed template links.

Technical details (target files/components):
- `supabase/functions/apply-links-bulk/index.ts` (primary regression source)
- `supabase/functions/fix-broken-links/index.ts` (deep-fix persistence + normalization)
- `supabase/functions/bulk-generate-articles/index.ts` (registry + validator hardening)
- `src/pages/admin/AdminBlogEditor.tsx` (+ generated draft save path)
- DB migration on `content_plans` for canonical category enforcement
