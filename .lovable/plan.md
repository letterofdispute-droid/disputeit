
## Diagnosis (what is actually happening)

I confirmed this is **not a content-data issue**:
- Your database already has unique, published SEO values for:
  - `state-rights/alaska`
  - `state-rights/california`
- Both have unique `meta_title`, `meta_description`, and generated image URLs.

The failure is in **route-to-HTML serving** on live:
- Your deployed `_redirects` currently contains:
  - trailing-slash rule
  - `/* /index.html 200` catch-all
- That catch-all is forcing homepage `index.html` source for route requests, so view-source shows homepage canonical + homepage meta.

## Fix Plan (ASAP path)

1. **Adjust redirect behavior so route HTML can be served**
   - Update `public/_redirects` to stop forcing every route to root `index.html`.
   - Keep trailing-slash normalization.
   - Ensure route-specific static files can win for paths like `/state-rights/alaska` and `/state-rights/california`.

2. **Harden static meta generation output**
   - Update `scripts/inject-page-meta.mjs` to write both:
     - `dist/{slug}/index.html`
     - `dist/{slug}.html`
   - This makes serving resilient across host path-resolution behavior.

3. **Add build-time validation guard**
   - In `inject-page-meta.mjs`, after file generation, validate key slugs (at least Alaska + California):
     - title is not homepage title
     - canonical is not homepage canonical
   - If validation fails, throw and fail build (prevents silent bad deploys).

4. **Republish and verify raw HTML source**
   - Verify `view-source:` (or raw fetch) on:
     - `/state-rights/alaska`
     - `/state-rights/california`
   - Confirm each now has unique `<title>`, `<meta name="description">`, and route canonical.

## Technical details (implementation-focused)

- Files to update:
  - `public/_redirects`
  - `scripts/inject-page-meta.mjs`
- No schema/database changes required.
- Acceptance criteria:
  - Alaska and California source HTML no longer show homepage meta/canonical.
  - Route-specific meta appears in initial HTML before client JS.
  - Build fails if route files are missing or still contain homepage metadata.
