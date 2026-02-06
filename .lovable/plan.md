
# Checkout Terms Agreement + Human Moderation Badge + Sitemap Pagination

## Overview

Three features to implement:
1. **Checkout Terms Agreement**: Require users to agree to Terms of Service and Privacy Policy before purchasing, with clear "as is" disclaimers
2. **Human Moderation Badge**: Subtle indicator on blog posts and letter forms that content is moderated by humans
3. **Sitemap Pagination**: Split large sitemaps into pages (max 50,000 URLs per Google guidelines)

---

## 1. Checkout Terms Agreement

### Current State
The `PricingModal.tsx` component currently allows direct purchase without any agreement checkbox.

### Changes

**File: `src/components/letter/PricingModal.tsx`**

Add a required checkbox before the purchase buttons:
- Checkbox with text: "I agree to the Terms of Service and Privacy Policy. I understand that templates are provided 'as is' for informational purposes only and should be used at my own discretion and risk."
- Links to /terms and /privacy pages
- Disable purchase buttons until checkbox is checked
- Add state: `const [agreedToTerms, setAgreedToTerms] = useState(false);`

**File: `src/pages/TermsPage.tsx`**

Strengthen the existing disclaimer section (Section 4) with additional "as is" language:
- Add explicit statement that templates are guidelines only
- Clarify the user assumes all responsibility for use
- Add statement that outcomes are not guaranteed and no liability is accepted

The current Terms already has good foundation (Section 4 "Important Legal Disclaimer" and Section 11 "Disclaimer of Warranties"), but will add more explicit risk language.

---

## 2. Human Moderation Badge

### Locations
1. **Blog posts** (`ArticlePage.tsx`) - subtle badge in the article metadata area
2. **Letter forms** (`LetterGenerator.tsx`) - already has `HumanCraftedBadge` component, will extend

### Changes

**File: `src/pages/ArticlePage.tsx`**

Add a subtle "Human Moderated" indicator in the article metadata section (around line 389-415), near the author/date info:
- Small badge or text: "Content reviewed by humans"
- Subtle styling (muted text, small icon)

**File: `src/components/letter/HumanCraftedBadge.tsx`**

Review existing component - it already mentions "Human-Crafted Templates". Will verify it conveys moderation appropriately or add "Content reviewed by editorial team" subtext.

**File: `src/components/layout/Footer.tsx`**

Add a subtle line in the footer disclaimer area:
- "All content on this site is reviewed and moderated by our editorial team."

---

## 3. Sitemap Pagination

### Current State
The sitemap Edge Function generates 4 sub-sitemaps:
- static (12 URLs)
- categories (~130 URLs)
- templates (~500 URLs)
- blog (~300 URLs currently, will grow to thousands)

### Google Guidelines
- Maximum 50,000 URLs per sitemap
- Maximum 50MB uncompressed per sitemap
- Use sitemap index for multiple sitemaps

### Changes

**File: `supabase/functions/generate-sitemap/index.ts`**

Implement pagination for the blog sitemap:
- Add `page` query parameter support
- Split blog posts into pages of ~1000 URLs each (well under 50,000 limit)
- Update sitemap index to list all blog sitemap pages dynamically
- Add logic: `const URLS_PER_PAGE = 1000;`

Example URLs after implementation:
- `/generate-sitemap?type=blog&page=1`
- `/generate-sitemap?type=blog&page=2`
- etc.

The sitemap index will dynamically include all blog pages based on total post count.

### Verification
All current sitemap links are working:
- `?type=index` - Returns sitemap index
- `?type=static` - Returns 12 static page URLs
- `?type=categories` - Returns 130+ category/subcategory URLs
- `?type=templates` - Returns 500+ template URLs
- `?type=blog` - Returns 300+ blog post URLs

---

## Technical Details

### Terms Checkbox Component

```text
// New checkbox in PricingModal.tsx (before security note, after pricing cards)
<div className="mt-6 p-4 bg-muted/50 rounded-lg">
  <label className="flex items-start gap-3 cursor-pointer">
    <Checkbox 
      checked={agreedToTerms} 
      onCheckedChange={setAgreedToTerms}
      className="mt-0.5"
    />
    <span className="text-sm text-muted-foreground">
      I agree to the <Link to="/terms">Terms of Service</Link> and 
      <Link to="/privacy">Privacy Policy</Link>. I understand that 
      templates are provided "as is" for informational purposes only 
      and should be used at my own discretion and risk.
    </span>
  </label>
</div>
```

Purchase buttons will be disabled until `agreedToTerms === true`.

### Human Moderation Badge Styling

Subtle, non-intrusive design:
- Small shield or checkmark icon
- Muted gray text
- Positioned near existing metadata (author, date)
- Example: "Reviewed by humans" with a small icon

### Sitemap Pagination Logic

```text
// Pagination parameters
const page = parseInt(url.searchParams.get('page') || '1');
const URLS_PER_PAGE = 1000;

// Calculate offset
const offset = (page - 1) * URLS_PER_PAGE;

// Query with pagination
const { data: posts, count } = await supabase
  .from('blog_posts')
  .select('slug, category_slug, updated_at, published_at', { count: 'exact' })
  .eq('status', 'published')
  .range(offset, offset + URLS_PER_PAGE - 1)
  .order('published_at', { ascending: false });

// Total pages
const totalPages = Math.ceil((count || 0) / URLS_PER_PAGE);
```

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/components/letter/PricingModal.tsx` | Add terms agreement checkbox + disable buttons until agreed |
| `src/pages/TermsPage.tsx` | Strengthen "as is" disclaimers in Section 4 and 11 |
| `src/pages/ArticlePage.tsx` | Add subtle "Human Moderated" badge in article metadata |
| `src/components/layout/Footer.tsx` | Add human moderation statement to footer |
| `supabase/functions/generate-sitemap/index.ts` | Implement pagination for blog sitemap with dynamic index |

---

## Sitemap Verification Results

All current sitemaps are functioning correctly:
- Index sitemap returns 4 child sitemaps
- Static sitemap: 12 URLs (homepage, templates, articles, etc.)
- Categories sitemap: 130+ URLs (all categories, subcategories, guides, blog categories)
- Templates sitemap: 500+ URLs (all letter templates)
- Blog sitemap: 300+ URLs (all published blog posts)

After implementing pagination, the blog sitemap will scale to handle thousands of posts efficiently.
