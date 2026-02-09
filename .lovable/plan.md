
# Switch Blog Image Generation to Direct Google Gemini API

## Step 1: Add your Google API key

You'll need to get a free API key from Google AI Studio:
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

We'll store it as a backend secret called `GOOGLE_GEMINI_API_KEY`.

## Step 2: Update 3 edge functions

All three functions that currently call the Lovable gateway for image generation will be switched to call Google's API directly. The endpoint changes from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`.

### Files to modify:

**`supabase/functions/generate-blog-image/index.ts`** (standalone image generation)
- Switch from `LOVABLE_API_KEY` to `GOOGLE_GEMINI_API_KEY`
- Call Google's native API format instead of OpenAI-compatible format
- Add structured error handling: return categorized errors (`CREDIT_EXHAUSTED:`, `RATE_LIMITED:`, `AI_ERROR:`) matching the existing pattern from the article generation system
- Return proper HTTP status codes (402, 429, 500) so callers can bail out

**`supabase/functions/bulk-generate-articles/index.ts`** (~lines 482-500, ~lines 728-739)
- Update the `generateAIImage()` function to use Google's API directly
- Update the `generateInfographic()` function to use Google's API directly
- On error, propagate categorized error prefixes so the queue system marks items correctly and stops the batch

**`supabase/functions/generate-infographic/index.ts`** (~line 384-388)
- Same API switch as above

### Google API request format:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=API_KEY

Body:
{
  "contents": [{ "parts": [{ "text": "prompt" }] }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### Google API response format:

```text
{
  "candidates": [{
    "content": {
      "parts": [
        { "inlineData": { "mimeType": "image/png", "data": "base64..." } },
        { "text": "description" }
      ]
    }
  }]
}
```

## Step 3: Robust error handling for stability

Each function will implement:

1. **Pre-flight check**: Verify `GOOGLE_GEMINI_API_KEY` exists before doing any work
2. **HTTP status mapping**:
   - 429 from Google -> return `RATE_LIMITED:` error, HTTP 429
   - 403 (quota exceeded) -> return `CREDIT_EXHAUSTED:` error, HTTP 402
   - 5xx from Google -> return `AI_ERROR:` error, HTTP 500
3. **Batch bail-out**: In `bulk-generate-articles`, when an image generation call returns a rate-limit or quota error, the function stops processing further items in the batch immediately (matching the existing `CREDIT_EXHAUSTED` bail-out pattern)
4. **No silent failures**: Every error is logged and surfaced to the caller with a clear message

## What stays the same

- The image prompts (realistic photography requirements) stay identical
- The base64-to-storage upload logic stays identical
- The response format returned to the frontend stays identical
- All other AI calls (article text generation, SEO, etc.) continue using the Lovable gateway
- The `FailureSummary` component already handles these error categories in the UI

## Cost impact

- Google's free tier: ~1500 requests/day at no cost
- Same `gemini-2.0-flash-exp` model (image generation variant)
- Your workspace credits will no longer be consumed for image generation
