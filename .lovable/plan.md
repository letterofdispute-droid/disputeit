
## What’s happening
- Preview state pages show the correct blue hero with image.
- Live state pages are still white because the latest deployment did not complete.
- The deployment is blocked by `template-slug-validator` (`siteContext slugs: 625`, `actual template slugs: 624`).

## Implementation steps
1. Run `node scripts/validate-template-slugs.mjs` by itself (outside full build) to get the full mismatch output and identify the exact orphan slug.
2. Update `supabase/functions/_shared/siteContext.ts` to remove/fix that orphan slug (or add the corresponding missing template slug in source files if needed).
3. Re-run the validator until it reports zero drift and matching counts.
4. Run production build again and confirm success.
5. Publish and verify live pages:
   - `https://letterofdispute.com/small-claims/north-dakota`
   - one additional state page for sanity check  
   Confirm hero renders with `/images/tools-hero-bg.jpg` + blue overlay.

## Technical details
- `src/pages/SmallClaimsStatePage.tsx` already contains the correct hero implementation.
- This is a deployment-blocker issue, not a remaining UI-code issue on that page.
- Keep slug validation enabled; fix data drift so production can publish safely.
