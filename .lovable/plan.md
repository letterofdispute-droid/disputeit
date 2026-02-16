

# Add Link Counts to Admin Blog & Templates Lists

## Blog Posts List (`src/pages/admin/AdminBlog.tsx`)

### Data Source
The `article_embeddings` table already stores `inbound_count` and `outbound_count` per blog post (keyed by `content_id = blog_post.id`). We will fetch these counts for the current page of posts and display them inline.

### Changes
- After fetching the page of posts, run a secondary query: `SELECT content_id, inbound_count, outbound_count FROM article_embeddings WHERE content_id IN (...)` using the current page's post IDs
- Store the result as a `Record<string, { inbound: number; outbound: number }>` map
- Add a new "Links" table column between "Status" and "Date"
- Display as two small badges: an arrow-down icon with inbound count and an arrow-up icon with outbound count
- Color-code: inbound 0 gets a warning style (orphan article), outbound >= 8 gets a warning style (over-linked)

### Visual
```text
| Links          |
| IN: 3  OUT: 5  |
```

## Templates List (`src/pages/admin/AdminTemplates.tsx`)

### Data Source
The existing `get_template_article_counts()` RPC returns `{ template_slug, article_count }` -- the number of published blog articles that reference each template via `related_templates`. Additionally, we can query `link_suggestions` to count suggestions targeting template pages.

### Changes
- Fetch template article counts using the existing `get_template_article_counts()` RPC via `useQuery`
- Add an "Articles" column showing how many published blog posts reference each template
- Templates with 0 articles get a muted style; those with articles get a green badge

### Visual
```text
| Articles |
|    5     |
```

## Files to Modify

1. **`src/pages/admin/AdminBlog.tsx`**
   - Add `article_embeddings` query for current page post IDs
   - Add "Links" TableHead column
   - Add inbound/outbound badges in each row with color coding

2. **`src/pages/admin/AdminTemplates.tsx`**
   - Add `useQuery` calling `get_template_article_counts()` RPC
   - Add "Articles" TableHead column
   - Show article count per template with badge styling

No database changes needed -- all data sources already exist.

