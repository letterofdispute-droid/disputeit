

# Problem

The `migrate-export` function crashes with **"Memory limit exceeded"** because it loads ALL rows into memory (`allRows` array) before building the SQL string. Tables like `link_suggestions` (53k rows with HTML content) and `blog_posts` (6.8k rows with full article HTML) easily blow past the ~150MB Edge Function memory limit.

# Solution: Streaming Response

Rewrite the function to use a **ReadableStream** that fetches and writes SQL one batch at a time, never holding more than 500 rows in memory.

## Key changes

1. **Replace array accumulation with streaming** — Use `ReadableStream` to write SQL chunks directly to the response as each batch is fetched, then discard the batch immediately
2. **Require single-table mode** — When called without `tables` param, only export small tables (< 1000 rows). Large tables must be called individually with `?tables=blog_posts`
3. **Enforce a default limit** — Default `limit=5000` instead of "all rows" to prevent timeouts on huge tables. User increments offset across multiple calls
4. **Add `ON CONFLICT DO NOTHING`** — Makes re-running safe if a chunk was already imported

## How you'll use it

**Small tables (all at once):**
```
/migrate-export?tables=profiles,blog_categories,blog_tags,site_settings,user_roles
```

**Large tables (chunked, 5000 rows per call):**
```
/migrate-export?tables=blog_posts&offset=0&limit=5000
/migrate-export?tables=blog_posts&offset=5000&limit=5000
/migrate-export?tables=link_suggestions&offset=0&limit=5000
/migrate-export?tables=link_suggestions&offset=5000&limit=5000
... etc
```

Each URL returns a `.sql` file you paste into the new Supabase SQL Editor.

## Implementation

One file change: `supabase/functions/migrate-export/index.ts`

- Stream rows in batches of 200 (fetch 200 → write SQL → discard → fetch next 200)
- Default limit = 5000 rows per call
- `ON CONFLICT DO NOTHING` on all INSERT statements
- Response header `X-Total-Rows` and `X-Exported-Rows` so you know if more chunks are needed
- `mode=summary` still returns JSON row counts (unchanged)

