
Goal: get the live domain off the stale build so the already-fixed hero background can deploy.

Current findings:
- `src/pages/SmallClaimsStatePage.tsx` hero code is already correct (image + `bg-primary/45` overlay).
- Live remains white because production build is still blocked by `template-slug-validator`.
- After last edit, validator state is now `siteContext: 623` vs `templates: 624` (still failing).
- Confirmed template slugs missing from `siteContext.ts`:  
  `final-paycheck-demand`, `wrongful-termination-complaint`, `employment-discrimination-complaint`.
- `repair-request-letter` and `mould-damp-complaint` were correctly removed (they do not exist in template files).

Implementation steps:
1. Update `vite.config.ts` validator error handling to log both `stdout` and `stderr` from the failed script (currently only `stdout` is surfaced, hiding exact slug names).
2. Run `node scripts/validate-template-slugs.mjs` and capture full mismatch output (both stale + missing lists).
3. Update `supabase/functions/_shared/siteContext.ts` slug whitelist:
   - Add the 3 confirmed missing employment slugs.
   - Remove any remaining stale slugs reported by the validator output.
4. Re-run slug validator until it reports zero drift (matching sets, not just matching counts).
5. Re-run production build and publish.
6. Verify live:
   - `https://letterofdispute.com/small-claims/north-dakota`
   - one additional `/small-claims/{state}` page
   - hard refresh / incognito to bypass cache.

Technical details:
- The blocker is deployment integrity, not hero UI code.
- The immediate reliability fix is improving validator error visibility in `vite.config.ts`, then syncing `siteContext.ts` to actual template slugs.
