

# Google reCAPTCHA Integration

## Domains to Add in Google reCAPTCHA Console

You need to add the following domains in the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin):

| Domain | Purpose |
|--------|---------|
| `disputeit.lovable.app` | Production/Published URL |
| `id-preview--ff184904-311c-4792-8699-deb3dd5fdbf1.lovable.app` | Lovable Preview URL |
| `localhost` | Local development (optional) |

**Important**: If you have a custom domain (e.g., `disputeletters.com`), add that as well.

---

## Implementation Overview

We will use **reCAPTCHA v3** (invisible, score-based) for a seamless user experience. This protects forms without requiring users to click checkboxes or solve puzzles.

### Forms to Protect

| Form | Page | Priority |
|------|------|----------|
| Login | `/login` | High |
| Signup | `/signup` | High |
| Forgot Password | `/forgot-password` | High |
| Contact Form | `/contact` | Medium |

---

## Technical Implementation

### 1. Install reCAPTCHA Package

```bash
npm install react-google-recaptcha-v3
```

### 2. Create reCAPTCHA Hook

Create a reusable hook `src/hooks/useRecaptcha.ts` to execute reCAPTCHA verification:

```typescript
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCallback } from 'react';

export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const verifyRecaptcha = useCallback(async (action: string) => {
    if (!executeRecaptcha) {
      console.warn('reCAPTCHA not ready');
      return null;
    }
    return await executeRecaptcha(action);
  }, [executeRecaptcha]);

  return { verifyRecaptcha };
};
```

### 3. Wrap App with Provider

Update `src/main.tsx` to include the reCAPTCHA provider:

```typescript
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

<GoogleReCaptchaProvider 
  reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
>
  <App />
</GoogleReCaptchaProvider>
```

### 4. Create Backend Verification Edge Function

Create `supabase/functions/verify-recaptcha/index.ts` to validate tokens server-side:

```typescript
// Calls Google's siteverify API
// Returns { success: boolean, score: number }
// Reject if score < 0.5 (likely bot)
```

### 5. Update Protected Forms

Each form will:
1. Get reCAPTCHA token before submission
2. Send token to edge function for verification
3. Only proceed if verification passes

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useRecaptcha.ts` | Reusable reCAPTCHA hook |
| `supabase/functions/verify-recaptcha/index.ts` | Server-side token verification |

## Files to Modify

| File | Changes |
|------|---------|
| `src/main.tsx` | Add GoogleReCaptchaProvider wrapper |
| `src/pages/LoginPage.tsx` | Add reCAPTCHA verification on submit |
| `src/pages/SignupPage.tsx` | Add reCAPTCHA verification on submit |
| `src/pages/ForgotPasswordPage.tsx` | Add reCAPTCHA verification on submit |
| `src/pages/ContactPage.tsx` | Add reCAPTCHA verification on submit |

---

## Secret Configuration

You will need to provide:

| Secret | Where to Store | Description |
|--------|----------------|-------------|
| `VITE_RECAPTCHA_SITE_KEY` | Frontend env | Public site key (safe to expose) |
| `RECAPTCHA_SECRET_KEY` | Backend secrets | Private key for server verification |

---

## reCAPTCHA Setup Steps (Google Console)

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin/create)
2. Register a new site:
   - **Label**: DisputeLetters
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: Add the domains listed above
3. Copy the **Site Key** (for frontend)
4. Copy the **Secret Key** (for backend)

---

## Flow Diagram

```text
User submits form
       |
       v
[Get reCAPTCHA token (frontend)]
       |
       v
[Send token + form data to Edge Function]
       |
       v
[Edge Function calls Google siteverify API]
       |
       +---> Score >= 0.5 --> Proceed with action
       |
       +---> Score < 0.5 --> Reject (likely bot)
```

---

## Security Notes

- reCAPTCHA v3 runs invisibly and assigns a score (0.0 to 1.0)
- Scores near 1.0 indicate human, near 0.0 indicate bot
- We'll use 0.5 as the threshold (adjustable)
- Server-side verification is mandatory - never trust frontend-only checks
- The site key is public; only the secret key must be protected

