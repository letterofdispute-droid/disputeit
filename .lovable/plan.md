

# Fix reCAPTCHA "Invalid domain" Error on Preview

## Root Cause

The reCAPTCHA Enterprise site key (`6Ld622AsAAAAAB0AAUWGc3Bl78A1YKxdM6Piu27-`) is registered for `letterofdispute.com` in Google's reCAPTCHA console, but NOT for the Lovable preview domain (`*.lovableproject.com`). When the reCAPTCHA script loads on the preview domain, it shows a visible "ERROR for site owner: Invalid domain" banner that blocks the login form.

The backend (`verify-recaptcha` edge function) already gracefully bypasses this — returning `success: true` with `reason: api_config_error`. So the actual login flow works, but the visual error overlay from the reCAPTCHA widget is covering the UI and confusing.

## Fix

**Skip loading reCAPTCHA on non-production domains entirely.** Since the backend already bypasses verification for dev/preview domains, there's no reason to load the script at all.

### `src/hooks/useRecaptcha.ts`

1. Add a domain check at the top of the `useEffect`: if hostname is NOT `letterofdispute.com` or `www.letterofdispute.com`, skip loading the script entirely and leave `isReady` as false.
2. The `verifyRecaptcha` function already handles `!window.grecaptcha?.enterprise` by returning `{ success: true }` — so skipping the script means login proceeds without reCAPTCHA on preview/dev, matching the backend behavior.

**Single file change, ~5 lines added.**

