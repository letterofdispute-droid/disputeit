
You’re right to call this out. The base URL you pasted is not enough for CSV export.

What happened
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/system-health` is the health endpoint.
- For CSV export, you must add query params: `table`, `offset`, `limit`.

Use this exact URL (first chunk of `blog_posts`)
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/system-health?table=blog_posts&offset=0&limit=500`

Where to paste it
1. Open a new browser tab (not inside any import field).
2. Paste the full URL above in the address bar.
3. Save the response as `blog_posts-0.csv` (or it may auto-download).

Next chunks (same table)
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/system-health?table=blog_posts&offset=500&limit=500`
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/system-health?table=blog_posts&offset=1000&limit=500`
- Keep increasing offset by 500 until the file is empty or only has headers.

Template for any table
- `https://koulmtfnkuapzigcplov.supabase.co/functions/v1/system-health?table=TABLE_NAME&offset=OFFSET&limit=500`

Examples:
- `...table=article_embeddings&offset=0&limit=500`
- `...table=content_queue&offset=0&limit=500`
- `...table=keyword_targets&offset=0&limit=500`
- `...table=link_suggestions&offset=0&limit=500`

Import flow (destination project)
1. Open target table.
2. Import CSV.
3. Start with offset `0`, then `500`, `1000`, etc. for same table.
4. Repeat table-by-table.

If you want, next I can give you a clean copy-paste checklist in exact order (table + every offset) so you can execute without thinking.
