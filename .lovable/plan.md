
# Fix Sitemaps: Write to dist/ Instead of public/

## Root Cause

The build process timing is wrong:

```text
1. Vite build starts
2. public/ contents copied to dist/  ← Sitemaps don't exist yet!
3. closeBundle() runs build-static.mjs
4. Sitemaps written to public/  ← Too late! Already copied!
5. Build ends
```

**Result:** Sitemaps exist in `public/` but not in `dist/` - so they're never deployed.

## The Fix

Change `build-static.mjs` to write directly to `dist/` instead of `public/`:

```javascript
// BEFORE (line 19)
const publicDir = path.join(__dirname, '..', 'public');

// AFTER
const distDir = path.join(__dirname, '..', 'dist');
```

That's it! One line change.

## Why This Works

Since `closeBundle()` runs AFTER the build completes:
- `dist/` already exists with all built files
- Writing sitemaps directly to `dist/` means they're included in deployment
- No timing issues

## Files to Modify

| File | Change |
|------|--------|
| `scripts/build-static.mjs` | Line 19: Change output from `public/` to `dist/` |

## Technical Details

### Before
```javascript
const publicDir = path.join(__dirname, '..', 'public');
```

### After  
```javascript
const distDir = path.join(__dirname, '..', 'dist');
```

Also update all references from `publicDir` to `distDir` in the file (variable rename for clarity).

## Result After Fix

After deployment:
- `/sitemap.xml` → Works
- `/sitemap-static.xml` → Works  
- `/sitemap-categories.xml` → Works
- `/sitemap-templates.xml` → Works
- `/sitemap-blog.xml` → Works

All 500+ URLs will be accessible to Google Search Console.

## Credit Cost

This is a **1-line fix** (plus variable rename). Minimal changes, maximum impact.
