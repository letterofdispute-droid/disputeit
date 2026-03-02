
Root cause confirmed from your live run:
- The failing calls are true network timeouts (`Error: Failed to fetch`) on `POST /functions/v1/backfill-page-seo`, not normal API error responses.
- Successful calls are mostly ~7–12s, but there is a long-tail outlier at `duration_ms: 122076` (~122s), and several failures happen at ~152s intervals, which matches browser/network timeout behavior.
- The failed page IDs from your run still have `meta_title`, `meta_description`, and `featured_image_url` all null, so those attempts did not complete.
- Why this happens even for “just title + image”: image generation can occasionally stall unpredictably; right now the page SEO function has a timeout for meta generation, but no hard timeout around image generation.

Implementation plan (ASAP reliability fix):
1) Add hard image timeout with abort
- File: `supabase/functions/_shared/googleImageGen.ts`
- Add AbortController-based timeout support to `generateImageWithGoogle` so hanging image calls are force-cancelled (instead of running until browser request timeout).

2) Add controlled retry for transient image stalls
- File: `supabase/functions/backfill-page-seo/index.ts`
- Wrap image generation with one fast retry on timeout/rate-limit transient conditions (short backoff), then stop retrying.
- Keep retry bounded so each invocation finishes well under browser timeout limits.

3) Never let slow image generation block the entire page invocation
- File: `supabase/functions/backfill-page-seo/index.ts`
- If image times out after retry, persist generated meta fields anyway and return quickly.
- Return explicit per-page error reasons like `image_timeout` (instead of letting frontend see generic `invoke_error` from transport failure).

4) Improve client-side reporting for clarity
- File: `src/hooks/usePageSeoBackfill.ts`
- Distinguish transport-level `invoke_error` from backend-returned `image_timeout` / `ai_timeout`.
- This will make progress UI truthful (real backend errors vs network-level timeouts).

Technical details:
- Add timeout constants (e.g., image attempt timeout 35–45s) so worst-case per invocation stays below browser/network timeout.
- Keep batch size = 1 and current inter-batch delay.
- Preserve existing bail-out behavior for quota/rate-limit (`402/429`) so runs stop safely when needed.
- Ensure no top-level 500 is thrown for per-page image stalls; they should be captured and returned in structured `errors`.

Validation checklist after implementation:
1. Run “Generate SEO (template)” again on the same group.
2. Confirm no new generic `invoke_error` spikes during normal run.
3. Confirm long-tail pages now show backend error types (`image_timeout`) instead of fetch failures.
4. Confirm meta fields continue to populate even when an image for that page times out.
5. Confirm overall throughput stays stable and the run can continue instead of stalling.
