

# Deep Fix Mode: Fuzzy Match + Template Slug Resolution + Strip Dead Links

## The Data We Already Have

The database contains everything needed to resolve these links:

- **`blog_posts`**: 6,538 articles with `slug` and `category_slug` -- already loaded as `slugToCategory` map
- **`content_plans`**: Every template with `template_slug`, `category_id`, and `subcategory_slug` -- currently loaded but only as a flat `Set<string>`, losing the routing info
- **`article_embeddings`**: All content slugs with `category_id` and `subcategory_slug` -- also loaded as flat set

The problem: we load template and embedding data but throw away the category/subcategory routing info. With that info, we can resolve nearly everything.

## Plan (2 files)

### 1. Edge Function: `supabase/functions/fix-broken-links/index.ts`

**Enhance data loading** to preserve routing info:

- Change `loadTemplateSlugs` to return `Map<string, {categoryId, subcategorySlug}>` instead of `Set<string>` -- maps each template_slug to its full route
- Change `loadEmbeddingSlugs` to return `Map<string, {categoryId, subcategorySlug}>` instead of `Set<string>` -- same for embeddings

**Add `findFuzzyMatch` function**:
- Splits broken slug and all article slugs into word tokens (split on `-`)
- Computes Jaccard similarity: `|intersection| / |union|`
- Returns best match if similarity >= 0.55 (allows partial matches like `contractor-no-show-what-do` vs `contractor-no-show-what-to-do`)
- Skips slugs shorter than 3 tokens to avoid false positives

**Add `mode: 'deep-fix'`** processing:
- First runs all existing rewrite patterns (1-12)
- Then runs `validateInternalLinks` to find remaining broken links
- For each broken link found in the HTML:
  - **Unknown bare slugs** (`/some-slug`): Try fuzzy match against all article slugs. If match found → rewrite href to `/articles/{cat}/{matched-slug}`
  - **Template with slug-as-category** (`/templates/some-template-slug/...`): Look up `some-template-slug` in the template slug map → rewrite to `/templates/{real-cat}/{subcat}/{template-slug}`
  - **Article with wrong category** (`/articles/bad-cat/slug`): If slug exists in articles, rewrite to correct category
  - **No match found**: Strip the `<a>` tag, keep inner text only (e.g., `<a href="/dead">Click here</a>` → `Click here`)
- Save updated content to DB
- Track: `totalFuzzyFixed`, `totalStripped`

**Response additions**:
- `summary.totalFuzzyFixed` -- links rewritten via fuzzy/lookup match
- `summary.totalStripped` -- dead links converted to plain text

### 2. UI: `src/components/admin/seo/BrokenLinkScanner.tsx`

- Add **"Deep Fix"** button after scan/fix completes with remaining broken links
- Warning banner: "Deep Fix uses fuzzy matching and strips unfixable links. This is destructive."
- Calls `fix-broken-links` with `mode: 'deep-fix'`, uses same batch loop and stop button
- Shows results: "Fuzzy-matched X links, stripped Y dead links"
- Summary grid gets 2 extra cells for fuzzy-fixed and stripped counts
- `ScanSummary` interface updated with `totalFuzzyFixed` and `totalStripped` fields

```text
Workflow:
  Scan → shows broken links
  Fix  → rewrites exact-match patterns (patterns 1-12)
  Deep Fix → fuzzy matches remaining unknowns + resolves template slugs + strips truly dead links
```

