
Full audit completed (codebase + database + backend functions). Here is the working fix path.

## What I verified (no guessing)

1. **Database data is correct**
   - `pages` has unique published rows for:
     - `state-rights/alaska`
     - `state-rights/california`
   - Both have unique `meta_title` and `meta_description`.

2. **Backend function audit**
   - `backfill-page-seo` only **writes SEO data/images to `pages`**.
   - `generate-seo` is for blog editor suggestions only.
   - No backend function is serving route HTML for public pages.
   - Conclusion: this is **not** an edge-function runtime serving issue.

3. **Build pipeline audit**
   - `vite.config.ts` runs `scripts/inject-page-meta.mjs` in production closeBundle.
   - `inject-page-meta.mjs` already generates:
     - `dist/{slug}/index.html`
     - `dist/{slug}.html`
     - and validates Alaska/California content.
   - So generation is present in code.

4. **Serving behavior problem**
   - Pretty URL `/state-rights/california` is still returning homepage source/canonical.
   - This means generated files exist, but pretty routes are not consistently resolved to them on hosting.
   - Current `_redirects` only has trailing slash + SPA catch-all, so serving still falls back to `/index.html`.

## Root cause

Your build creates page-specific files, but your host routing is still choosing SPA fallback for pretty routes in practice.

```text
Request: /state-rights/california
Current resolution: /index.html (homepage source meta)
Expected resolution: /state-rights/california.html (or /state-rights/california/index.html)
```

## Working solution (robust, harder)

Implement **explicit route-to-file rewrites for every published page slug** during build, then keep SPA fallback only as last rule.

### 1) Generate rewrite manifest from the same page list used for meta injection
Update `scripts/inject-page-meta.mjs` to also write `dist/_redirects` with:

- Existing trailing-slash rule first
- **Auto-generated specific rules**:
  - `/state-rights/california  /state-rights/california.html  200`
  - `/state-rights/alaska      /state-rights/alaska.html      200`
  - ...for all published `pages.slug` rows with `meta_title`
- Final fallback:
  - `/* /index.html 200`

This removes host ambiguity and forces pretty URLs to the correct HTML files.

### 2) Preserve base redirects + inject generated block
Keep `public/_redirects` as base template, but build script should output final `dist/_redirects` including generated rules.

### 3) Extend build-time validation
In `inject-page-meta.mjs` validation, also assert:

- `dist/_redirects` contains rewrite entries for:
  - `state-rights/alaska`
  - `state-rights/california`
- Those entries point to `/{slug}.html`
- Build fails if missing.

## File-level implementation plan

- **Edit `scripts/inject-page-meta.mjs`**
  - Add `generateRouteRedirects(pages)` function.
  - Read base redirects template.
  - Insert auto-generated route rules before SPA fallback.
  - Write to `dist/_redirects`.
  - Extend validator to check both HTML and redirect entries.

- **Optional small cleanup in `public/_redirects`**
  - Keep only canonical base rules/comments; generated routes stay build-time only.

- **No database or edge-function code changes needed** for this fix.

## Acceptance criteria

After publish, all must pass in **view-source**:

1. `https://letterofdispute.com/state-rights/alaska`
   - Title is Alaska-specific
   - Canonical = `/state-rights/alaska`

2. `https://letterofdispute.com/state-rights/california`
   - Title is California-specific
   - Canonical = `/state-rights/california`

3. Source for those URLs no longer contains homepage canonical/title fragment.

4. Non-generated routes still work via SPA fallback.

## Risk + fallback

- Risk: `_redirects` file grows with many routes.
- Mitigation: This is still manageable for ~1,200 routes; if platform limit is hit, we switch to grouped rewrite strategy (by page group prefixes) as phase 2.
