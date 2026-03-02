

# Fix: Serve unique SEO meta to crawlers using `netlify.toml` bot detection

## Why previous attempts failed

The `_redirects` file approach (per-route rewrite rules) is not working on Lovable hosting. Despite generating correct static HTML files and explicit rewrite rules, the hosting still serves the root `index.html` for all routes. The `_redirects` catch-all `/* /index.html 200` appears to win regardless of rule ordering.

Your other project that works uses a fundamentally different mechanism: **`netlify.toml` with User-Agent-based bot detection**. This is the proven pattern.

## What to implement

### 1. Create `netlify.toml` with bot-conditional redirects

Generate a `netlify.toml` file at build time (via `inject-page-meta.mjs`) that contains redirect rules with `User-Agent` conditions for all published slugs. Bots get the pre-rendered HTML; humans get the SPA.

Pattern per route:
```toml
[[redirects]]
  from = "/state-rights/california"
  to = "/state-rights/california.html"
  status = 200
  force = true
  conditions = {User-Agent = ["Googlebot", "bingbot", "Slurp", "DuckDuckBot", "facebookexternalhit", "Twitterbot", "LinkedInBot", "WhatsApp", "TelegramBot", "Discordbot"]}
```

Final fallback for humans (SPA):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Update `scripts/inject-page-meta.mjs`

- Add a `generateNetlifyToml(pages)` function that writes `dist/netlify.toml`
- Each published slug with `meta_title` gets a bot-conditional redirect entry
- Include trailing-slash strip rule
- SPA fallback as the last rule
- Keep existing static HTML generation (dual file output) as-is
- Keep existing `_redirects` generation as fallback
- Extend validation to check `netlify.toml` exists and contains key slug entries

### 3. Keep `public/_redirects` as-is (fallback)

No changes needed. The `netlify.toml` takes priority over `_redirects` on Netlify-compatible hosting.

## Files to change

- `scripts/inject-page-meta.mjs` — add `generateNetlifyToml()` function, call it in `main()`

## Technical note

`netlify.toml` is processed before `_redirects` by the hosting platform, and its `conditions` feature (User-Agent matching) is not available in `_redirects` format. This is why the other project works and this one doesn't — it's a hosting-level routing feature, not a file-generation problem.

