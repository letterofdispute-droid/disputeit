

# Fix: Per-Route Meta Tags Not Appearing on Live Site

## Root Cause

The `inject-page-meta.mjs` script reads Supabase credentials from `process.env.VITE_SUPABASE_URL` and `process.env.VITE_SUPABASE_PUBLISHABLE_KEY`. At build time, these environment variables are likely **not available** to the child process spawned by `exec()`, causing the script to hit the early-return guard:

```
⚠️  Missing SUPABASE env vars, skipping page meta injection
```

Meanwhile, `build-static.mjs` (which works correctly) **hardcodes** the same credentials directly in the file.

## Fix

**File: `scripts/inject-page-meta.mjs`** (lines 19-20)

Replace the env-var lookups with hardcoded values matching `build-static.mjs`:

```javascript
const SUPABASE_URL = 'https://koulmtfnkuapzigcplov.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWxtdGZua3VhcHppZ2NwbG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI5NTcsImV4cCI6MjA4MzgxODk1N30.6BkDwzeApLBvQOiY60xsH0aVu7GFxWRp1GRebWtph4Y';
```

Also add a SPA fallback rule to `public/_redirects` so routes without static files still work:

```
# Strip trailing slashes (301 permanent redirect)
/*/  /:splat  301

# SPA fallback — serve per-route index.html if it exists, otherwise root
/* /index.html 200
```

After publishing, `/state-rights/california` will serve `dist/state-rights/california/index.html` with the correct unique meta tags from the database.

