

# Fix: GTM Not Loading in Production Build

## Problem Identified

The GTM script is correctly placed in `index.html`, but the **production build at `letterofdispute.com`** is missing the GTM scripts entirely. The HTML source you shared shows:
- No GTM head script
- No GTM noscript fallback
- The page starts with meta tags instead of the GTM script

This indicates the build/deploy pipeline is not including the GTM scripts from `index.html` in the final output.

---

## Root Cause

The Lovable build system may be transforming or replacing the `index.html` content during deployment. The `scripts/inject-homepage-content.mjs` script modifies the built HTML, but the issue occurs earlier - the GTM scripts are never reaching the final build.

---

## Solution: Initialize GTM from React

Instead of relying solely on inline scripts in `index.html`, we will **inject GTM dynamically from JavaScript** when the app starts. This guarantees GTM loads regardless of how the HTML is processed.

---

## Implementation

### 1. Update `src/main.tsx`

Add GTM initialization before React renders:

```typescript
// Initialize GTM
const initGTM = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    // Create dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Inject GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WX8PKJXH';
    document.head.insertBefore(script, document.head.firstChild);

    // Inject noscript iframe
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-WX8PKJXH';
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }
};

// Initialize GTM immediately
initGTM();
```

### 2. Keep `index.html` Scripts (Belt and Suspenders)

Keep the existing GTM scripts in `index.html` as a fallback. If they work, great. If not, the JavaScript initialization will handle it.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/main.tsx` | Add GTM initialization function at the top, before React renders |

---

## Why This Works

1. **Guaranteed execution**: The script runs as part of the JavaScript bundle, which is definitely loaded
2. **No HTML parsing issues**: Bypasses any build-time HTML transformation
3. **Same functionality**: Creates `dataLayer` and loads GTM script exactly as the inline version would
4. **Idempotent**: Checks if `dataLayer` exists before initializing, preventing double-loading

---

## Verification Steps

After implementation:
1. Publish the site
2. Visit `letterofdispute.com`
3. Open browser console and type `window.dataLayer` - should show an array with `gtm.start`
4. Check Network tab for request to `googletagmanager.com`
5. GA4 should then detect the tag

