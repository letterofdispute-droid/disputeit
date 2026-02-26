
Issue confirmed: deep-fix is matching/replacing normalized hrefs while stored HTML keeps query/trailing-slash/punctuation variants, so the same 10 anchors never get rewritten or stripped.

Implementation steps
1. Harden broken-link parsing in `supabase/functions/fix-broken-links/index.ts`
- Capture both `rawHref` (exact href attribute value) and `normalizedPath` (for validation).
- Expand internal-origin matcher to include `www.letterofdispute.com` and both quote styles (`"` and `'`).

2. Make deep-fix replacements operate on raw hrefs
- Replace all `href="...cleanPath..."` rewrites with a helper that rewrites by exact `rawHref`.
- Update strip logic to match `<a ... href=...>...</a>` with `[\s\S]*?` so multiline anchors are stripped reliably.

3. Add noisy-slug normalization before fuzzy matching
- For unknown links, slugify last segment (remove punctuation/apostrophes, collapse spaces to `-`) before exact/fuzzy lookup.
- Add explicit legacy `/blog/*` normalization path so title-like `/blog/...` links can resolve or be stripped deterministically.

4. Enforce destructive fallback for unresolved internals
- If rewrite/fuzzy/template recovery fails, always strip anchor and keep text (no unresolved internal href survives deep-fix).

5. Close manual-content reintroduction paths
- Strengthen `sanitizeContentLinks` in `src/pages/admin/AdminBlogEditor.tsx` to strip/normalize `/blog/*`, malformed bare slugs, and invalid internal paths.
- Apply the same sanitizer logic in `src/hooks/useCreateDraftFromGenerated.ts` so AI-created drafts cannot save dead internal links.

6. Run remediation and lock verification
- Execute targeted deep-fix on the 7 affected posts, then a full deep-fix pass.
- Re-scan twice; require stable `0` recurring links between scans.
- Add a regression test file for `fix-broken-links` covering the 10 exact failing href patterns.

Technical details
- Primary file: `supabase/functions/fix-broken-links/index.ts`
  - `validateInternalLinks`: preserve raw href + canonical path.
  - `applyDeepFix`: raw-href rewrite helper + robust strip helper + slugify/fuzzy path handling.
- Editor ingress: `src/pages/admin/AdminBlogEditor.tsx`, `src/hooks/useCreateDraftFromGenerated.ts`
  - Shared strict internal-link sanitization behavior (strip unresolved internal anchors).
- Regression coverage: `supabase/functions/fix-broken-links/index_test.ts` with fixtures for:
  - trailing slash variants (`/hoa-neighbor-disputes/`)
  - query-suffixed links (`/blog/...?...`)
  - punctuation/apostrophe slugs (`...homeowner's...`, `...: Which is Better?`)

Acceptance checks
- Broken Link Scanner reports `0` on consecutive scans after deep-fix.
- The same 10 links do not reappear after refresh + rescan.
- Manual save and AI-draft save both remove unresolved `/blog/*` and malformed internal anchors.
