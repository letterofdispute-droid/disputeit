

# Remove Pixabay Fallback -- Fail Fast with Admin Email Notification

## What Changes

The `fetch-category-images` function currently falls back to raw Pixabay URLs when storage upload fails. This is unacceptable because Pixabay URLs expire after 24 hours, causing broken images on the site.

**New behavior:** If the image cannot be downloaded and self-hosted in storage, the function will:
1. **Abort the operation** -- return `null` image with a clear error status
2. **Send an admin notification email** via Resend directly within the function (no auth required since this is a system-level alert)
3. The frontend (`useCategoryImage`) already handles missing images by showing CSS gradient fallbacks -- no frontend changes needed

## Changes

### 1. `supabase/functions/fetch-category-images/index.ts`

- Remove all Pixabay URL fallback logic (lines 134-183 where `selfHosted` flag and fallback URLs are used)
- If image download or storage upload fails:
  - Send an email to admin (`noreply@mail.letterofdispute.com` sender, admin email hardcoded or from env) using Resend API directly in the function
  - Return `{ image: null, error: "Image hosting failed", notified: true }` with HTTP 200 (not 500, so the frontend handles it gracefully)
- Remove the 20-hour Pixabay cache expiry path -- all cached images will be self-hosted with 1-year expiry
- If caching to the `category_images` table also fails (DB timeout), skip caching and return the error with notification

### 2. Admin Email Content

- **From:** `Letter of Dispute <noreply@mail.letterofdispute.com>`
- **To:** Admin email (will need an `ADMIN_EMAIL` secret or hardcode it)
- **Subject:** `[Alert] Category image hosting failed: {categoryId}`
- **Body:** Details including category ID, context key, search query, and the specific error message

### 3. Frontend Behavior (no code changes needed)

The `useCategoryImage` hook already handles `data?.error` by setting the error state, and the `FALLBACK_GRADIENTS` map provides CSS gradient backgrounds for each category when no image is available. This means the UI will show colored gradient cards instead of broken images.

## Secret Needed

An `ADMIN_EMAIL` secret needs to be configured so the function knows where to send failure alerts. I will ask you to provide this before implementing.

## Technical Details

- Resend is imported directly in the edge function (same pattern as `send-admin-email`)
- The email sending is wrapped in try/catch so if even the email fails, the function still returns gracefully
- No changes to `useCategoryImage.ts` or any frontend code

