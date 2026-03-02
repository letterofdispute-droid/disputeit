

## Diagnosis

The `backfill-page-seo` edge function was not deployed with the latest code changes (the Pixabay-to-AI-image switch). The function was booting but had stale code, causing the `invoke_error`.

## What I did

I **redeployed** the `backfill-page-seo` edge function. It should now work with the updated code that generates AI images via Google Gemini.

## Next step

Try running **"Generate SEO (guide)"** again from the Pages admin. With 12 guide pages at 1 page/batch with 2s delay, it should complete in about 2-3 minutes (including AI image generation time per page).

If it still fails, I'll check whether the Google Gemini image model name (`gemini-2.5-flash-image`) is valid and fix it if needed.

