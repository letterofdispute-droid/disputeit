import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map human-readable category paths to blog category slugs
const CATEGORY_PATH_TO_SLUG: Record<string, string> = {
  'financial-services': 'financial',
  'consumer-rights': 'consumer-rights',
  'insurance': 'insurance',
  'insurance-claims': 'insurance',
  'housing': 'housing',
  'landlord-housing': 'housing',
  'vehicle': 'vehicle',
  'vehicle-auto': 'vehicle',
  'employment': 'employment',
  'employment-workplace': 'employment',
  'utilities': 'utilities',
  'utilities-telecommunications': 'utilities',
  'ecommerce': 'ecommerce',
  'e-commerce-online-services': 'ecommerce',
  'hoa': 'hoa',
  'neighbor-hoa-disputes': 'hoa',
  'contractors': 'contractors',
  'contractors-home-improvement': 'contractors',
  'healthcare': 'healthcare',
  'healthcare-medical': 'healthcare',
  'healthcare-medical-billing': 'healthcare',
  'travel': 'travel',
  'travel-transportation': 'travel',
  'damaged-goods': 'damaged-goods',
  'refunds': 'refunds',
  'mortgage': 'mortgage',
};

// Map category paths to template category IDs
const CAT_TO_TEMPLATE: Record<string, string> = {
  'vehicle-auto': 'vehicle', 'vehicle': 'vehicle',
  'consumer-rights': 'damaged-goods', 'employment-workplace': 'employment',
  'financial-services': 'financial', 'landlord-housing': 'housing',
  'e-commerce-online-services': 'ecommerce', 'ecommerce': 'ecommerce',
  'insurance-claims': 'insurance', 'insurance': 'insurance',
  'utilities-telecommunications': 'utilities', 'utilities': 'utilities',
  'contractors-home-improvement': 'contractors', 'contractors': 'contractors',
  'healthcare-medical-billing': 'healthcare', 'healthcare-medical': 'healthcare', 'healthcare': 'healthcare',
  'travel-transportation': 'travel', 'travel': 'travel',
  'neighbor-hoa-disputes': 'hoa', 'hoa': 'hoa',
  'housing': 'housing', 'employment': 'employment',
  'financial': 'financial', 'mortgage': 'mortgage',
};

// Reserved paths that are NOT article slugs
const RESERVED_PATHS = new Set([
  'articles', 'templates', 'guides', 'admin', 'auth', 'dashboard',
  'login', 'signup', 'pricing', 'about', 'contact', 'faq', 'privacy',
  'terms', 'disclaimer', 'cookie-policy', 'how-it-works', 'settings',
  'state-rights', 'deadlines', 'consumer-news', 'analyze-letter',
  'sitemap.xml', 'robots.txt', 'small-claims', 'do-i-have-a-case',
]);

// Valid template category IDs
const VALID_TEMPLATE_CATEGORIES = new Set([
  'refunds', 'housing', 'travel', 'damaged-goods', 'utilities',
  'financial', 'insurance', 'vehicle', 'healthcare', 'employment',
  'ecommerce', 'hoa', 'contractors', 'mortgage',
]);

// Valid static routes
const VALID_STATIC_ROUTES = new Set([
  '/', '/templates', '/how-it-works', '/pricing', '/faq', '/about',
  '/contact', '/terms', '/privacy', '/disclaimer', '/guides',
  '/state-rights', '/deadlines', '/consumer-news', '/analyze-letter',
  '/small-claims', '/small-claims/cost-calculator', '/small-claims/demand-letter-cost',
  '/small-claims/escalation-guide', '/small-claims/statement-generator',
  '/do-i-have-a-case',
]);

const ALL_CATEGORY_PATHS = Object.keys(CATEGORY_PATH_TO_SLUG);
const CATEGORY_PATHS_PATTERN = ALL_CATEGORY_PATHS.join('|');
const ORIGIN = `(?:https?:\\/\\/(?:www\\.)?(?:letterofdispute\\.com|disputeit\\.lovable\\.app))?`;

interface TemplateRouteInfo {
  categoryId: string;
  subcategorySlug: string | null;
}

/**
 * Load ALL published article slugs using paginated queries.
 */
async function loadAllSlugs(supabase: any): Promise<Map<string, string>> {
  const slugToCategory = new Map<string, string>();
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, category_slug')
      .eq('status', 'published')
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const a of data) {
      slugToCategory.set(a.slug, a.category_slug);
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return slugToCategory;
}

/**
 * Load all template slugs from content_plans with routing info.
 */
async function loadTemplateSlugs(supabase: any): Promise<Map<string, TemplateRouteInfo>> {
  const slugMap = new Map<string, TemplateRouteInfo>();
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('content_plans')
      .select('template_slug, category_id, subcategory_slug')
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const t of data) {
      slugMap.set(t.template_slug, {
        categoryId: t.category_id,
        subcategorySlug: t.subcategory_slug,
      });
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return slugMap;
}

/**
 * Load all article_embeddings slugs with routing info.
 */
async function loadEmbeddingSlugs(supabase: any): Promise<Map<string, TemplateRouteInfo>> {
  const slugMap = new Map<string, TemplateRouteInfo>();
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('article_embeddings')
      .select('slug, category_id, subcategory_slug')
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const e of data) {
      slugMap.set(e.slug, {
        categoryId: e.category_id,
        subcategorySlug: e.subcategory_slug,
      });
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return slugMap;
}

// Helper to create a Set view of template/embedding maps for backward compat
function mapKeys(map: Map<string, any>): Set<string> {
  return new Set(map.keys());
}

interface BrokenLink {
  href: string;      // normalized/cleaned path (for validation logic)
  rawHref: string;   // exact href attribute value from HTML (for replacements)
  linkType: 'article' | 'template' | 'guide' | 'state-rights' | 'static' | 'unknown';
  reason: string;
}

/**
 * Validate ALL internal links in a post's HTML content.
 */
function validateInternalLinks(
  content: string,
  articleSlugs: Map<string, string>,
  templateSlugs: Set<string>,
  embeddingSlugs: Set<string>,
): BrokenLink[] {
  const broken: BrokenLink[] = [];
  // Match both quote styles and www. variant
  const hrefRegex = /href=["'](?:https?:\/\/(?:www\.)?(?:letterofdispute\.com|disputeit\.lovable\.app))?(\/[^"']*?)["']/gi;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const rawHref = match[1]; // exact value from HTML
    const path = rawHref.replace(/\/$/, '') || '/';

    if (path.startsWith('/#') || path === '#') continue;
    const cleanPath = path.split('?')[0].split('#')[0];

    if (VALID_STATIC_ROUTES.has(cleanPath)) continue;

    // /articles/{cat}/{slug}
    const articlesMatch = cleanPath.match(/^\/articles\/([^/]+)\/([^/]+)$/);
    if (articlesMatch) {
      const [, , slug] = articlesMatch;
      if (articleSlugs.has(slug) || embeddingSlugs.has(slug)) continue;
      broken.push({ href: cleanPath, rawHref, linkType: 'article', reason: `Article slug "${slug}" not found` });
      continue;
    }

    // /articles/{cat}
    const articlesCatMatch = cleanPath.match(/^\/articles\/([^/]+)$/);
    if (articlesCatMatch) {
      const cat = articlesCatMatch[1];
      if (CATEGORY_PATH_TO_SLUG[cat] || VALID_TEMPLATE_CATEGORIES.has(cat)) continue;
      broken.push({ href: cleanPath, rawHref, linkType: 'article', reason: `Article category "${cat}" not found` });
      continue;
    }

    // /templates/{catId}
    const templateCatMatch = cleanPath.match(/^\/templates\/([^/]+)$/);
    if (templateCatMatch) {
      if (VALID_TEMPLATE_CATEGORIES.has(templateCatMatch[1])) continue;
      broken.push({ href: cleanPath, rawHref, linkType: 'template', reason: `Template category "${templateCatMatch[1]}" not found` });
      continue;
    }

    // /templates/{catId}/{subcatOrSlug} or /templates/{catId}/{subcat}/{slug}
    const templateMatch = cleanPath.match(/^\/templates\/([^/]+)\/(.+)$/);
    if (templateMatch) {
      const catId = templateMatch[1];
      if (!VALID_TEMPLATE_CATEGORIES.has(catId)) {
        broken.push({ href: cleanPath, rawHref, linkType: 'template', reason: `Template category "${catId}" not found` });
        continue;
      }
      const segments = templateMatch[2].split('/');
      const lastSegment = segments[segments.length - 1];
      if (segments.length >= 2) {
        if (templateSlugs.has(lastSegment)) continue;
        broken.push({ href: cleanPath, rawHref, linkType: 'template', reason: `Template slug "${lastSegment}" not found` });
      }
      continue;
    }

    // /guides/{catId}
    const guidesMatch = cleanPath.match(/^\/guides\/([^/]+)$/);
    if (guidesMatch) {
      if (VALID_TEMPLATE_CATEGORIES.has(guidesMatch[1])) continue;
      broken.push({ href: cleanPath, rawHref, linkType: 'guide', reason: `Guide category "${guidesMatch[1]}" not found` });
      continue;
    }

    if (cleanPath.startsWith('/state-rights')) continue;
    if (cleanPath.startsWith('/small-claims')) continue;

    // /blog/* paths are always broken (legacy)
    if (cleanPath.startsWith('/blog/')) {
      broken.push({ href: cleanPath, rawHref, linkType: 'unknown', reason: `Legacy /blog/ path` });
      continue;
    }

    const topLevel = cleanPath.split('/')[1];
    if (topLevel && RESERVED_PATHS.has(topLevel)) continue;

    // Bare slug
    const bareSlugMatch = cleanPath.match(/^\/([a-z0-9][a-z0-9-]+)$/);
    if (bareSlugMatch) {
      const slug = bareSlugMatch[1];
      if (articleSlugs.has(slug) || CATEGORY_PATH_TO_SLUG[slug] || VALID_TEMPLATE_CATEGORIES.has(slug)) continue;
      broken.push({ href: cleanPath, rawHref, linkType: 'unknown', reason: `Path "/${slug}" doesn't match any known route` });
      continue;
    }

    // Multi-segment unknown path
    if (!cleanPath.startsWith('/articles') && !cleanPath.startsWith('/templates') && !cleanPath.startsWith('/guides')) {
      const parts = cleanPath.split('/').filter(Boolean);
      if (parts.length === 2) {
        const [catPath, slug] = parts;
        if (CATEGORY_PATH_TO_SLUG[catPath] && articleSlugs.has(slug)) continue;
      }
      broken.push({ href: cleanPath, rawHref, linkType: 'unknown', reason: `Unknown internal path` });
    }
  }

  return broken;
}

function findTruncatedMatch(
  partialSlug: string,
  slugMap: Map<string, string>
): { slug: string; cat: string } | null {
  if (partialSlug.length < 10) return null;
  
  for (const [fullSlug, cat] of slugMap) {
    if (fullSlug.startsWith(partialSlug) && fullSlug.length > partialSlug.length) {
      return { slug: fullSlug, cat };
    }
  }
  return null;
}

/**
 * Fuzzy match a broken slug against all known article slugs using Jaccard similarity.
 */
function findFuzzyMatch(
  brokenSlug: string,
  slugToCategory: Map<string, string>,
  minSimilarity = 0.55,
): { slug: string; cat: string; similarity: number } | null {
  const brokenTokens = new Set(brokenSlug.split('-').filter(t => t.length > 0));
  if (brokenTokens.size < 3) return null; // Too short for reliable fuzzy matching

  let bestMatch: { slug: string; cat: string; similarity: number } | null = null;

  for (const [slug, cat] of slugToCategory) {
    const slugTokens = new Set(slug.split('-').filter(t => t.length > 0));
    if (slugTokens.size < 3) continue;

    // Jaccard similarity
    let intersection = 0;
    for (const t of brokenTokens) {
      if (slugTokens.has(t)) intersection++;
    }
    const union = new Set([...brokenTokens, ...slugTokens]).size;
    const similarity = intersection / union;

    if (similarity >= minSimilarity && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { slug, cat, similarity };
    }
  }

  return bestMatch;
}

/**
 * Apply all rewrite patterns to content. Returns updated content and fix count.
 */
function applyRewrites(
  content: string,
  slugToCategory: Map<string, string>,
): { content: string; fixCount: number } {
  let fixCount = 0;

  // ── Pattern 1: /blog/slug → find real article ──
  const blogRegex = new RegExp(`href="${ORIGIN}\\/blog\\/([a-z0-9][a-z0-9-]+)\\/?\"`, 'gi');
  content = content.replace(blogRegex, (_match: string, slug: string) => {
    const cat = slugToCategory.get(slug);
    if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
    const fuzzy = findTruncatedMatch(slug, slugToCategory);
    if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
    return _match;
  });

  // ── Pattern 2: /category/ and /categories/ prefixed URLs ──
  const categoryPrefixRegex = new RegExp(`href="${ORIGIN}\\/(?:category|categories)\\/([^"]+)"`, 'gi');
  content = content.replace(categoryPrefixRegex, (_match: string, path: string) => {
    const cleanPath = path.replace(/\/$/, '');
    const slug = cleanPath.split('/')[0].toLowerCase();
    const templateCat = CAT_TO_TEMPLATE[slug] || slug;
    fixCount++;
    return `href="/templates/${templateCat}"`;
  });

  // ── Pattern 3: Category-only links ──
  const catOnlyRegex = new RegExp(`href="${ORIGIN}\\/(${CATEGORY_PATHS_PATTERN})\\/?\"`, 'gi');
  content = content.replace(catOnlyRegex, (_match: string, categoryPath: string) => {
    const blogCat = CATEGORY_PATH_TO_SLUG[categoryPath.toLowerCase()] || categoryPath;
    fixCount++;
    return `href="/articles/${blogCat}"`;
  });

  // ── Pattern 4: Category-path + article slug ──
  const catSlugRegex = new RegExp(`href="${ORIGIN}\\/(${CATEGORY_PATHS_PATTERN})\\/([a-z0-9][a-z0-9_-]+)\\/?\"`, 'gi');
  content = content.replace(catSlugRegex, (_match: string, categoryPath: string, slug: string) => {
    const normalizedSlug = slug.replace(/_/g, '-');
    const articleCat = slugToCategory.get(normalizedSlug) || slugToCategory.get(slug);
    if (articleCat) {
      fixCount++;
      return `href="/articles/${articleCat}/${normalizedSlug}"`;
    }
    const fuzzy = findTruncatedMatch(normalizedSlug, slugToCategory);
    if (fuzzy) {
      fixCount++;
      return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`;
    }
    const blogCat = CATEGORY_PATH_TO_SLUG[categoryPath.toLowerCase()] || categoryPath;
    fixCount++;
    return `href="/articles/${blogCat}"`;
  });

  // ── Pattern 5: /mistakes/ path pattern ──
  const mistakesRegex = new RegExp(`href="${ORIGIN}\\/mistakes\\/([a-z0-9][a-z0-9-]+)\\/?\"`, 'gi');
  content = content.replace(mistakesRegex, (_match: string, slug: string) => {
    const cat = slugToCategory.get(slug);
    if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
    const fuzzy = findTruncatedMatch(slug, slugToCategory);
    if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
    for (const [fullSlug, c] of slugToCategory) {
      if (fullSlug.includes(slug) || slug.includes(fullSlug.split('-').slice(0, 3).join('-'))) {
        fixCount++;
        return `href="/articles/${c}/${fullSlug}"`;
      }
    }
    return _match;
  });

  // ── Pattern 6: Bare slugs (absolute only) ──
  content = content.replace(
    /href="https?:\/\/(?:www\.)?letterofdispute\.com\/([a-z0-9][a-z0-9-]{5,})\/?"/gi,
    (_match: string, slug: string) => {
      if (RESERVED_PATHS.has(slug)) return _match;
      if (slug.startsWith('articles/') || slug.startsWith('templates/') || slug.startsWith('guides/')) return _match;
      if (CATEGORY_PATH_TO_SLUG[slug]) return _match;

      const cat = slugToCategory.get(slug);
      if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
      const fuzzy = findTruncatedMatch(slug, slugToCategory);
      if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
      fixCount++;
      return `href="/${slug}"`;
    }
  );

  // ── Pattern 7: Convert absolute /articles/ URLs to relative ──
  content = content.replace(
    /href="https?:\/\/(?:www\.)?letterofdispute\.com\/(articles\/[^"]+)"/gi,
    (_match: string, path: string) => {
      fixCount++;
      return `href="/${path.replace(/\/$/, '')}"`;
    }
  );

  // ── Pattern 8: Convert absolute /templates/ URLs to relative ──
  content = content.replace(
    /href="https?:\/\/(?:www\.)?letterofdispute\.com\/(templates\/[^"]+)"/gi,
    (_match: string, path: string) => {
      fixCount++;
      return `href="/${path.replace(/\/$/, '')}"`;
    }
  );

  // ── Pattern 9: Catch-all for remaining absolute URLs ──
  content = content.replace(
    /href="https?:\/\/(?:www\.)?letterofdispute\.com\/([^"]+)"/gi,
    (_match: string, path: string) => {
      const cleanPath = path.replace(/\/$/, '');
      if (RESERVED_PATHS.has(cleanPath)) {
        fixCount++;
        return `href="/${cleanPath}"`;
      }
      const cat = slugToCategory.get(cleanPath);
      if (cat) {
        fixCount++;
        return `href="/articles/${cat}/${cleanPath}"`;
      }
      fixCount++;
      return `href="/${cleanPath}"`;
    }
  );

  // ── Pattern 10: Fix relative bare slugs → /articles/{cat}/{slug} ──
  content = content.replace(
    /href="\/([a-z0-9][a-z0-9-]{5,})\/?"/gi,
    (_match: string, slug: string) => {
      if (RESERVED_PATHS.has(slug)) return _match;
      if (CATEGORY_PATH_TO_SLUG[slug]) return _match;
      if (VALID_TEMPLATE_CATEGORIES.has(slug)) return _match;

      const cat = slugToCategory.get(slug);
      if (cat) {
        fixCount++;
        return `href="/articles/${cat}/${slug}"`;
      }
      const fuzzy = findTruncatedMatch(slug, slugToCategory);
      if (fuzzy) {
        fixCount++;
        return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`;
      }
      return _match;
    }
  );

  // ── Pattern 11: Fix /template/ (singular) → /templates/ ──
  content = content.replace(
    /href="\/template\/(.*?)"/gi,
    (_match: string, rest: string) => {
      fixCount++;
      return `href="/templates/${rest}"`;
    }
  );

  // ── Pattern 12: Fix /templates/{bad-cat}/... → remap via CAT_TO_TEMPLATE ──
  // Also handles legacy display-name categories with spaces/ampersands/title-case
  content = content.replace(
    /href="\/templates\/([^/"]+)(\/[^"]*)?"/gi,
    (_match: string, catId: string, rest: string = '') => {
      if (VALID_TEMPLATE_CATEGORIES.has(catId)) return _match;
      // Normalize: lowercase, replace spaces/& with hyphens, collapse
      const normalized = catId.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const mapped = CAT_TO_TEMPLATE[normalized] || CAT_TO_TEMPLATE[catId];
      if (mapped) {
        fixCount++;
        return `href="/templates/${mapped}${rest}"`;
      }
      // Check if the normalized form is itself a valid category
      if (VALID_TEMPLATE_CATEGORIES.has(normalized)) {
        fixCount++;
        return `href="/templates/${normalized}${rest}"`;
      }
      return _match;
    }
  );

  return { content, fixCount };
}

/**
 * Slugify a noisy string (handles punctuation, apostrophes, colons, spaces).
 */
function slugifyNoisy(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')           // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanum → hyphen
    .replace(/-+/g, '-')            // collapse hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing
}

/**
 * Build a regex that matches <a ...href="rawHref"...>innerText</a>
 * using the exact rawHref from the HTML. Handles multiline anchors.
 */
function buildAnchorStripRegex(rawHref: string): RegExp {
  const escaped = rawHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match both quote styles, multiline inner content
  return new RegExp(
    `<a\\s[^>]*href=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/a>`,
    'gi'
  );
}

/**
 * Build a regex that matches href="rawHref" for rewriting.
 */
function buildHrefReplaceRegex(rawHref: string): RegExp {
  const escaped = rawHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`href=["']${escaped}["']`, 'g');
}

/**
 * Deep fix: resolve remaining broken links using fuzzy matching, template lookup, and stripping.
 * Uses rawHref (exact HTML attribute value) for all replacements.
 */
function applyDeepFix(
  content: string,
  brokenLinks: BrokenLink[],
  slugToCategory: Map<string, string>,
  templateSlugMap: Map<string, TemplateRouteInfo>,
  embeddingSlugMap: Map<string, TemplateRouteInfo>,
): { content: string; fuzzyFixed: number; stripped: number } {
  let fuzzyFixed = 0;
  let stripped = 0;

  for (const bl of brokenLinks) {
    const hrefRegex = buildHrefReplaceRegex(bl.rawHref);

    // ── Legacy /blog/* paths ──
    if (bl.href.startsWith('/blog/')) {
      const blogSlugRaw = bl.href.replace(/^\/blog\//, '');
      const blogSlug = slugifyNoisy(blogSlugRaw);
      const cat = slugToCategory.get(blogSlug);
      if (cat) {
        content = content.replace(hrefRegex, `href="/articles/${cat}/${blogSlug}"`);
        fuzzyFixed++;
        continue;
      }
      const fuzzy = findFuzzyMatch(blogSlug, slugToCategory);
      if (fuzzy) {
        content = content.replace(hrefRegex, `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`);
        fuzzyFixed++;
        continue;
      }
      // Strip unresolvable /blog/ links
      const before = content;
      content = content.replace(buildAnchorStripRegex(bl.rawHref), '$1');
      if (content !== before) { stripped++; }
      continue;
    }

    if (bl.linkType === 'unknown') {
      // Extract the bare slug from /{slug} (use normalized href)
      const bareMatch = bl.href.match(/^\/([a-z0-9][a-z0-9-]+)$/);
      if (bareMatch) {
        const brokenSlug = bareMatch[1];
        // Also try slugified version for punctuation variants
        const normalizedSlug = slugifyNoisy(brokenSlug);

        // Try exact match in templates
        const templateInfo = templateSlugMap.get(brokenSlug) || templateSlugMap.get(normalizedSlug);
        if (templateInfo) {
          const newHref = templateInfo.subcategorySlug
            ? `/templates/${templateInfo.categoryId}/${templateInfo.subcategorySlug}/${brokenSlug}`
            : `/templates/${templateInfo.categoryId}/${brokenSlug}`;
          content = content.replace(hrefRegex, `href="${newHref}"`);
          fuzzyFixed++;
          continue;
        }

        // Try exact article match (also try normalized)
        const exactCat = slugToCategory.get(brokenSlug) || slugToCategory.get(normalizedSlug);
        if (exactCat) {
          const resolvedSlug = slugToCategory.has(brokenSlug) ? brokenSlug : normalizedSlug;
          content = content.replace(hrefRegex, `href="/articles/${exactCat}/${resolvedSlug}"`);
          fuzzyFixed++;
          continue;
        }

        // Try fuzzy match against articles
        const fuzzy = findFuzzyMatch(normalizedSlug, slugToCategory) || findFuzzyMatch(brokenSlug, slugToCategory);
        if (fuzzy) {
          content = content.replace(hrefRegex, `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`);
          fuzzyFixed++;
          continue;
        }
      }

      // Multi-segment unknown - try to extract slug from last segment
      const multiMatch = bl.href.match(/\/([a-z0-9][a-z0-9-]+)$/);
      if (multiMatch && !bareMatch) {
        const lastSlug = multiMatch[1];
        const normalizedLast = slugifyNoisy(lastSlug);
        const cat = slugToCategory.get(lastSlug) || slugToCategory.get(normalizedLast);
        if (cat) {
          const resolvedSlug = slugToCategory.has(lastSlug) ? lastSlug : normalizedLast;
          content = content.replace(hrefRegex, `href="/articles/${cat}/${resolvedSlug}"`);
          fuzzyFixed++;
          continue;
        }
      }
    }

    if (bl.linkType === 'template') {
      const templatePathMatch = bl.href.match(/^\/templates\/([^/]+)(\/.*)?$/);
      if (templatePathMatch) {
        const firstSegment = templatePathMatch[1];
        const restPath = templatePathMatch[2] || '';

        const info = templateSlugMap.get(firstSegment);
        if (info) {
          const newHref = info.subcategorySlug
            ? `/templates/${info.categoryId}/${info.subcategorySlug}/${firstSegment}`
            : `/templates/${info.categoryId}/${firstSegment}`;
          content = content.replace(hrefRegex, `href="${newHref}"`);
          fuzzyFixed++;
          continue;
        }

        if (restPath) {
          const segments = restPath.split('/').filter(Boolean);
          const lastSeg = segments[segments.length - 1];
          const lastInfo = templateSlugMap.get(lastSeg);
          if (lastInfo) {
            const newHref = lastInfo.subcategorySlug
              ? `/templates/${lastInfo.categoryId}/${lastInfo.subcategorySlug}/${lastSeg}`
              : `/templates/${lastInfo.categoryId}/${lastSeg}`;
            content = content.replace(hrefRegex, `href="${newHref}"`);
            fuzzyFixed++;
            continue;
          }
        }

        if (!VALID_TEMPLATE_CATEGORIES.has(firstSegment)) {
          const articleCat = slugToCategory.get(firstSegment);
          if (articleCat) {
            content = content.replace(hrefRegex, `href="/articles/${articleCat}/${firstSegment}"`);
            fuzzyFixed++;
            continue;
          }
        }
      }
    }

    if (bl.linkType === 'article') {
      const artMatch = bl.href.match(/^\/articles\/([^/]+)\/([^/]+)$/);
      if (artMatch) {
        const slug = artMatch[2];
        const normalizedSlug = slugifyNoisy(slug);
        const correctCat = slugToCategory.get(slug) || slugToCategory.get(normalizedSlug);
        if (correctCat) {
          const resolvedSlug = slugToCategory.has(slug) ? slug : normalizedSlug;
          content = content.replace(hrefRegex, `href="/articles/${correctCat}/${resolvedSlug}"`);
          fuzzyFixed++;
          continue;
        }
        const fuzzy = findFuzzyMatch(normalizedSlug, slugToCategory) || findFuzzyMatch(slug, slugToCategory);
        if (fuzzy) {
          content = content.replace(hrefRegex, `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`);
          fuzzyFixed++;
          continue;
        }
      }
    }

    // ── DESTRUCTIVE FALLBACK: strip <a> tag, keep inner text ──
    // No match found → no unresolved internal href survives deep-fix
    const stripRegex = buildAnchorStripRegex(bl.rawHref);
    const before = content;
    content = content.replace(stripRegex, '$1');
    if (content !== before) {
      stripped++;
    } else {
      // If anchor strip didn't match (e.g. unusual HTML), try removing just the href to deactivate
      console.log(`[deep-fix] Could not strip anchor for rawHref: ${bl.rawHref}`);
    }
  }

  return { content, fuzzyFixed, stripped };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { mode = 'scan', limit = 50, offset = 0, postId } = await req.json().catch(() => ({}));

    // Load all valid targets in parallel
    const [slugToCategory, templateSlugMap, embeddingSlugMap] = await Promise.all([
      loadAllSlugs(supabase),
      loadTemplateSlugs(supabase),
      loadEmbeddingSlugs(supabase),
    ]);

    // Create Set views for backward compatibility with validateInternalLinks
    const templateSlugsSet = mapKeys(templateSlugMap);
    const embeddingSlugsSet = mapKeys(embeddingSlugMap);

    const totalTargets = slugToCategory.size + templateSlugMap.size + embeddingSlugMap.size;
    console.log(`[fix-broken-links] Loaded ${slugToCategory.size} articles, ${templateSlugMap.size} templates, ${embeddingSlugMap.size} embeddings = ${totalTargets} total targets`);

    // Fetch posts to process
    let query = supabase
      .from('blog_posts')
      .select('id, slug, content, category_slug')
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (postId) {
      query = query.eq('id', postId);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: posts, error: postsErr } = await query;
    if (postsErr) throw postsErr;

    const results: Array<{
      postSlug: string;
      broken: number;
      fixed: number;
      brokenLinks: BrokenLink[];
      saved?: boolean;
      fuzzyFixed?: number;
      stripped?: number;
    }> = [];

    let totalFixed = 0;
    let totalBroken = 0;
    let totalSaved = 0;
    let totalFuzzyFixed = 0;
    let totalStripped = 0;

    for (const post of posts || []) {
      const originalContent = post.content;

      // Apply all rewrite patterns
      const { content: rewrittenContent, fixCount } = applyRewrites(post.content, slugToCategory);

      // Validate remaining internal links
      let brokenLinks = validateInternalLinks(rewrittenContent, slugToCategory, templateSlugsSet, embeddingSlugsSet);

      let finalContent = rewrittenContent;
      let postFuzzyFixed = 0;
      let postStripped = 0;

      // In deep-fix mode, apply fuzzy matching and stripping to remaining broken links
      if (mode === 'deep-fix' && brokenLinks.length > 0) {
        const deepResult = applyDeepFix(
          rewrittenContent,
          brokenLinks,
          slugToCategory,
          templateSlugMap,
          embeddingSlugMap,
        );
        finalContent = deepResult.content;
        postFuzzyFixed = deepResult.fuzzyFixed;
        postStripped = deepResult.stripped;
        totalFuzzyFixed += postFuzzyFixed;
        totalStripped += postStripped;

        // Re-validate after deep fix to get accurate remaining broken count
        brokenLinks = validateInternalLinks(finalContent, slugToCategory, templateSlugsSet, embeddingSlugsSet);
      }

      const hasChanges = finalContent !== originalContent;
      const hasBrokenLinks = brokenLinks.length > 0;

      // In fix or deep-fix mode, save changed content back to DB
      if ((mode === 'fix' || mode === 'deep-fix') && hasChanges) {
        const { error: updateErr } = await supabase
          .from('blog_posts')
          .update({ content: finalContent, updated_at: new Date().toISOString() })
          .eq('id', post.id);

        if (updateErr) {
          console.error(`[fix-broken-links] Failed to save ${post.slug}:`, updateErr.message);
        } else {
          totalSaved++;
        }
      }

      if (hasChanges || hasBrokenLinks || fixCount > 0) {
        totalBroken += brokenLinks.length;
        totalFixed += fixCount;

        results.push({
          postSlug: post.slug,
          broken: brokenLinks.length,
          fixed: fixCount,
          brokenLinks,
          saved: (mode === 'fix' || mode === 'deep-fix') && hasChanges,
          ...(mode === 'deep-fix' ? { fuzzyFixed: postFuzzyFixed, stripped: postStripped } : {}),
        });
      }
    }

    // Get total count for pagination
    const { count: totalPosts } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    return new Response(JSON.stringify({
      success: true,
      mode,
      slugsLoaded: totalTargets,
      pagination: { offset, limit, totalPosts },
      summary: {
        postsScanned: posts?.length || 0,
        postsWithIssues: results.length,
        totalBrokenLinks: totalBroken,
        totalFixed,
        ...((mode === 'fix' || mode === 'deep-fix') ? { totalSaved } : {}),
        ...(mode === 'deep-fix' ? { totalFuzzyFixed, totalStripped } : {}),
      },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[fix-broken-links] Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
