
# Sitemap Gaps — 3 Categories of Missing URLs

The current sitemap is missing URLs in three areas. Here is the full audit.

## Gap 1 — Static Pages (4 missing routes)

The `generateStaticSitemap()` function in `scripts/build-static.mjs` lists 12 pages. Comparing against `App.tsx`, four public indexable routes are absent:

| Route | Priority | Why it matters |
|---|---|---|
| `/deadlines` | 0.7 | Statute of limitations hub — high search value |
| `/consumer-news` | 0.6 | Fresh content page, signals crawl frequency |
| `/analyze-letter` | 0.7 | Free tool — search intent for "analyze dispute letter" |
| `/cookie-policy` | 0.3 | Legal page — low value but complete for crawlers |

**Fix**: Add these 4 entries to `staticPages` array in `generateStaticSitemap()`.

## Gap 2 — Blog Article Category Pages (9 missing slugs)

The build script hardcodes `blogCategories` as 5 old slugs that no longer match the live data:

**Script has (5 stale entries):**
`consumer-rights`, `landlord-tenant`, `travel-disputes`, `financial-tips`, `legal-guides`

**Actual categories in `src/data/blogPosts.ts` (14 entries):**
`consumer-rights`, `insurance`, `healthcare`, `utilities`, `vehicle`, `employment`, `housing`, `travel`, `financial`, `ecommerce`, `hoa`, `contractors`, `complaint-guides`, `legal-tips`

9 category index pages (e.g. `/articles/insurance`, `/articles/healthcare`) are generating broken 404 URLs in the blog sitemap and missing real ones. Google may be crawling the old 5 stale URLs and hitting 404s.

**Fix**: Replace the hardcoded `blogCategories` array in the build script with the correct 14 slugs.

## Gap 3 — `sitemap-categories.xml` Missing Article Category Pages

The `generateCategoriesSitemap()` function covers `/templates/:id` + `/guides/:id` but the blog category hub pages (`/articles/:category`) are only included inside `sitemap-blog-1.xml`. This is structurally fine (they live in the blog sitemap), but the issue is Gap 2 means the wrong slugs are being written there right now.

## What Does NOT Need Changing

- `sitemap-state-rights.xml` — 715 URLs, correct structure ✅
- `sitemap-templates.xml` — all template routes correctly inferred ✅
- `sitemap-categories.xml` — all 13 template categories + subcategories + guide pages ✅
- Blog post URLs — fetched live from the database, paginated correctly ✅
- Sitemap index structure — all sub-sitemaps referenced ✅

## Implementation

**Single file changed: `scripts/build-static.mjs`**

### Change 1 — `generateStaticSitemap()` (lines 346–359)
Add 4 missing static routes to the `staticPages` array:
```
{ loc: '/deadlines',      priority: '0.7', changefreq: 'weekly'  },
{ loc: '/consumer-news',  priority: '0.6', changefreq: 'daily'   },
{ loc: '/analyze-letter', priority: '0.7', changefreq: 'monthly' },
{ loc: '/cookie-policy',  priority: '0.3', changefreq: 'monthly' },
```

### Change 2 — `blogCategories` constant (lines 66–72)
Replace the 5 stale slugs with all 14 correct slugs matching `src/data/blogPosts.ts`:
```
consumer-rights, insurance, healthcare, utilities, vehicle,
employment, housing, travel, financial, ecommerce,
hoa, contractors, complaint-guides, legal-tips
```

After these two changes, the sitemap will cover all publicly indexable URLs in the application. The sitemap index structure (`sitemap.xml`) does not need any changes — the same sub-sitemap files are referenced, they will simply contain the correct URLs.

**Total new URLs added: ~17** (4 static + 9 blog category index pages + correcting 5 stale ones that would 404).
