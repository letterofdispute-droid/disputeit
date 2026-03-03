

# Phase 4: Update All Edge Functions to Use Google Gemini Directly

## Summary

21 edge functions currently call `ai.gateway.lovable.dev` with `LOVABLE_API_KEY`. All need to be updated to call Google Gemini's **OpenAI-compatible endpoint** directly with `GOOGLE_GEMINI_API_KEY`. This is a minimal-change approach -- same request/response format, just swap URL and key.

Additionally, 1 function (`generate-small-claims-statement`) calls `openrouter.ai` with `LOVABLE_API_KEY` and needs the same treatment.

The `_shared/googleImageGen.ts` has a `generateImageWithLovable` function that uses the gateway -- it should be removed since nothing imports it, and `generateImageWithGoogle` (which already uses `GOOGLE_GEMINI_API_KEY` directly) is what's actually used.

## The Change Pattern

Every function gets the same mechanical replacement:

**URL:**
```
ai.gateway.lovable.dev/v1/chat/completions
→ generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

**Key variable:**
```
LOVABLE_API_KEY → GOOGLE_GEMINI_API_KEY
```

**Model names** stay the same -- Google's OpenAI-compatible endpoint accepts the same `google/gemini-*` model identifiers.

**For `generate-small-claims-statement`** specifically: the URL changes from `openrouter.ai/api/v1/chat/completions` to the same Google endpoint, and the extra `HTTP-Referer` / `X-Title` headers are removed.

## All 21 Files to Update

| # | Function | Models Used | Streaming? |
|---|----------|-------------|------------|
| 1 | `dispute-assistant` | gemini-3-flash-preview | Yes |
| 2 | `legal-expert-letter` | gemini-3-flash-preview | Yes |
| 3 | `form-assistant` | gemini-2.5-flash | No |
| 4 | `generate-legal-letter` | gemini-3-flash-preview | No |
| 5 | `generate-blog-content` | gemini-2.5-flash | No |
| 6 | `generate-seo` | gemini-3-flash-preview | No |
| 7 | `generate-content-plan` | gemini-2.5-flash | No |
| 8 | `bulk-generate-articles` | gemini-2.5-flash + flash-lite | No |
| 9 | `bulk-plan-category` | gemini-2.5-flash | No |
| 10 | `suggest-category-tags` | gemini-2.5-flash | No |
| 11 | `suggest-images` | gemini-2.5-flash-lite | No |
| 12 | `suggest-content-topics` | gemini-2.5-flash | No |
| 13 | `scan-for-links` | gemini-2.5-flash | No |
| 14 | `scan-for-smart-links` | gemini-2.5-flash | No |
| 15 | `apply-links-bulk` | gemini-2.5-flash-lite | No |
| 16 | `diagnose-page-performance` | gemini-2.5-flash | No |
| 17 | `gsc-recommendations` | gemini-2.5-flash | No |
| 18 | `backfill-page-seo` | gemini-2.5-flash-lite | No |
| 19 | `plan-from-keywords` | gemini-2.5-flash | No |
| 20 | `generate-small-claims-statement` | gemini-2.5-flash | No |
| 21 | `_shared/googleImageGen.ts` | Remove `generateImageWithLovable` | N/A |

## Not Touched

- `process-embedding-queue` -- already calls `api.openai.com` directly with `OPENAI_API_KEY`
- `generate-blog-image` -- already uses `GOOGLE_GEMINI_API_KEY` directly via `generateImageWithGoogle`
- All non-AI functions (Stripe, email, storage, etc.)

## Implementation

I will update all 21 files in parallel. Each edit is mechanical: find-and-replace the URL and key variable name. The `generate-small-claims-statement` gets slightly more work (removing OpenRouter-specific headers).

