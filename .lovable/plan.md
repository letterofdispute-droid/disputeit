

# Fix Critical SEO Domain Mismatch and OG Image Support

## Problem Summary

The site has a **domain identity crisis**: the correct brand domain is `letterofdispute.com`, but `disputeletters.com` appears in 129 references across 7 files. This splits link equity and confuses search engines. Additionally, the homepage lacks a `<SEOHead>` component, and blog articles don't pass `og:image` for social sharing previews.

---

## Changes

### 1. Unify Domain in `SEOHead.tsx`

- Change `siteUrl` from `https://disputeletters.com` to `https://letterofdispute.com`
- Change all `"Dispute Letters"` brand references to `"Letter of Dispute"`
- Add `ogImage` optional prop to support `og:image` and `twitter:image` meta tags
- Default `og:image` to `https://letterofdispute.com/og-image.png` when not provided

### 2. Fix `index.html` Hardcoded References

- Replace all `disputeletters.com` URLs with `letterofdispute.com`
- Replace all `"Dispute Letters"` brand name occurrences with `"Letter of Dispute"`
- Ensure `og:image` and `twitter:image` point to `https://letterofdispute.com/og-image.png`

### 3. Fix `robots.txt`

- Change sitemap URL from `letterofdispute.com` (already correct) -- confirm no changes needed

### 4. Fix Breadcrumb Schemas in Page Files

Update all hardcoded `disputeletters.com` URLs to `letterofdispute.com` in:
- `src/pages/SubcategoryPage.tsx` (8 references)
- `src/pages/LetterPage.tsx` (6 references)
- `src/pages/AllTemplatesPage.tsx` (4 references)
- `src/pages/CategoryPage.tsx` (6 references)
- `src/pages/CategoryGuidePage.tsx` (2 references)

### 5. Add `SEOHead` to Homepage (`Index.tsx`)

- Import and add `<SEOHead>` with proper title, description, canonical path `/`, and type `website`
- This ensures the homepage gets correct canonical and OG tags via react-helmet-async, overriding the hardcoded fallbacks in `index.html`

### 6. Add `og:image` Support to Article Pages

- Pass `featured_image_url` from blog posts to the new `ogImage` prop on `<SEOHead>` in `ArticlePage.tsx`
- This ensures shared articles show the correct preview image on social platforms

### 7. Fix FAQ Component Brand Name

- Update `src/components/home/FAQ.tsx` schema to use `"Letter of Dispute"` instead of any old brand references (if present)

---

## Technical Details

### SEOHead.tsx Changes

```typescript
// New prop
ogImage?: string;

// Updated constant
const siteUrl = 'https://letterofdispute.com';
const defaultOgImage = `${siteUrl}/og-image.png`;

// New meta tags in Helmet
<meta property="og:image" content={ogImage || defaultOgImage} />
<meta name="twitter:image" content={ogImage || defaultOgImage} />

// All schema "name" fields: "Dispute Letters" -> "Letter of Dispute"
```

### ArticlePage.tsx Change

```tsx
<SEOHead
  title={post.meta_title || `${post.title} | Letter Of Dispute`}
  description={post.meta_description || post.excerpt || ""}
  canonicalPath={`/articles/${post.category_slug}/${post.slug}`}
  ogImage={post.featured_image_url || undefined}
/>
```

### Index.tsx Change

```tsx
import SEOHead from '@/components/SEOHead';

// Inside return, before <Hero />:
<SEOHead
  title="Letter of Dispute - Professional Complaint Letter Generator | 500+ Templates"
  description="Generate professional complaint letters for refunds, housing issues, travel compensation, insurance claims, and more. 500+ legally-referenced templates ready in minutes."
  canonicalPath="/"
  type="website"
/>
```

### Files Modified (8 total)

1. `src/components/SEOHead.tsx` -- domain fix + og:image prop
2. `index.html` -- domain + brand name fix
3. `src/pages/Index.tsx` -- add SEOHead
4. `src/pages/ArticlePage.tsx` -- pass ogImage
5. `src/pages/SubcategoryPage.tsx` -- breadcrumb domain fix
6. `src/pages/LetterPage.tsx` -- breadcrumb domain fix
7. `src/pages/AllTemplatesPage.tsx` -- breadcrumb domain fix
8. `src/pages/CategoryPage.tsx` -- breadcrumb domain fix
9. `src/pages/CategoryGuidePage.tsx` -- breadcrumb domain fix

### Impact

- Consolidates all SEO signals under `letterofdispute.com`
- Eliminates duplicate canonical conflicts that split ranking authority
- Blog articles will show proper preview images when shared on social media
- Homepage gets proper canonical tag and structured data via react-helmet-async
