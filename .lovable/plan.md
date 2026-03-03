

# Plan: Complete Migration for Remaining Tables

Your new project's `blog_posts` table is correctly set up (primary key exists, table is empty). The previous failure was a timeout, not a schema issue.

## What needs migrating

These tables failed or were skipped last time:
- `blog_posts` (6,841 rows) — timed out
- `article_embeddings` (6,841 rows) — timed out
- `content_queue` (6,753 rows) — depends on blog_posts
- `keyword_targets` (4,276 rows) — depends on blog_posts
- `link_suggestions` (53,278 rows) — depends on blog_posts
- `user_roles` (1 row) — depends on auth.users

## Steps

1. **Call migrate-push one table at a time** with `max_batches=5` to prevent timeouts (500 rows per batch = 2,500 rows per call)
2. **Start with `blog_posts`** — call 3 times to cover all 6,841 rows
3. **Then `article_embeddings`** — 3 calls
4. **Then `content_queue`, `keyword_targets`** — 2-3 calls each
5. **Then `link_suggestions`** — this is the biggest (53K rows), will need ~22 calls with `max_batches=5`
6. **Skip `user_roles`** — depends on auth.users which can't be migrated; you'll need to recreate the user and role manually in the new project

All of this happens automatically by me calling the edge function — you don't need to do anything.

## Technical detail

I'll invoke the existing `migrate-push` function with URL parameters like:
```
?table=blog_posts&offset=0&max_batches=5
```
Then continue from where it left off using the `next_offset` value.

