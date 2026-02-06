

# Update to reCAPTCHA Enterprise

## Overview

Migrate from standard reCAPTCHA v3 to reCAPTCHA Enterprise, which is now managed through Google Cloud Console.

---

## What Changed

| Aspect | Standard v3 | Enterprise |
|--------|-------------|------------|
| Script URL | `recaptcha/api.js` | `recaptcha/enterprise.js` |
| API namespace | `grecaptcha.execute()` | `grecaptcha.enterprise.execute()` |
| Backend verification | `google.com/recaptcha/api/siteverify` | `recaptchaenterprise.googleapis.com` |
| Scoring | Simple score (0-1) | Risk analysis with detailed assessment |

---

## Implementation Plan

### 1. Replace React Library

The current `react-google-recaptcha-v3` package doesn't support Enterprise. Replace with manual script loading:

**Remove**: `react-google-recaptcha-v3` dependency
**Add**: Manual script injection in `index.html`

### 2. Update index.html

Add Enterprise script with your site key:

```html
<script src="https://www.google.com/recaptcha/enterprise.js?render=6Ld-wWIsAAAAAGfPm69e5zwDmr-8GbkOHDvStyOj"></script>
```

### 3. Create New useRecaptcha Hook

Replace the current hook with one that uses the Enterprise API:

```typescript
// Uses grecaptcha.enterprise.ready() and grecaptcha.enterprise.execute()
const executeRecaptcha = async (action: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.grecaptcha.enterprise.ready(async () => {
      try {
        const token = await window.grecaptcha.enterprise.execute(
          SITE_KEY,
          { action }
        );
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  });
};
```

### 4. Update main.tsx

Remove the `GoogleReCaptchaProvider` wrapper since we're loading the script manually:

```typescript
// Before
<GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
  <App />
</GoogleReCaptchaProvider>

// After
<App />
```

### 5. Update Backend Verification

The edge function needs to call the Enterprise API instead of siteverify:

**Option A: Use Enterprise API with API Key** (simpler)
```
POST https://recaptchaenterprise.googleapis.com/v1/projects/{PROJECT_ID}/assessments?key={API_KEY}
```

**Option B: Use siteverify endpoint** (still works for Enterprise score-based keys)
The standard siteverify endpoint continues to work with Enterprise keys for basic use cases.

---

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Remove `react-google-recaptcha-v3` dependency |
| `index.html` | Add Enterprise script tag with site key |
| `src/main.tsx` | Remove `GoogleReCaptchaProvider` wrapper |
| `src/hooks/useRecaptcha.ts` | Rewrite to use `grecaptcha.enterprise` API |
| `src/vite-env.d.ts` | Add type declarations for `window.grecaptcha.enterprise` |

---

## Type Declarations

Add to `src/vite-env.d.ts`:

```typescript
interface GrecaptchaEnterprise {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

interface Grecaptcha {
  enterprise: GrecaptchaEnterprise;
}

declare global {
  interface Window {
    grecaptcha: Grecaptcha;
  }
}
```

---

## Environment Variable

Update the site key secret:

| Secret | Current Value | New Value |
|--------|---------------|-----------|
| `VITE_RECAPTCHA_SITE_KEY` | (old key) | `6Ld-wWIsAAAAAGfPm69e5zwDmr-8GbkOHDvStyOj` |

Note: The secret key for backend verification (`RECAPTCHA_SECRET_KEY`) should still work with Enterprise for siteverify compatibility mode.

---

## Affected Pages

These pages use reCAPTCHA and will automatically work after the hook update:

- `/login` - Login form
- `/signup` - Signup form
- `/forgot-password` - Password reset
- `/contact` - Contact form

---

## Summary

This migration switches from the `react-google-recaptcha-v3` npm package to a manual implementation using Google's Enterprise script. The API calls change from `grecaptcha.execute()` to `grecaptcha.enterprise.execute()`, but the overall flow remains the same. The backend verification can continue using the siteverify endpoint in compatibility mode.

