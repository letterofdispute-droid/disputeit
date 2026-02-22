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
  'financial': 'financial',
};

// Reserved paths that are NOT article slugs
const RESERVED_PATHS = new Set([
  'articles', 'templates', 'guides', 'admin', 'auth', 'dashboard',
  'login', 'signup', 'pricing', 'about', 'contact', 'faq', 'privacy',
  'terms', 'disclaimer', 'cookie-policy', 'how-it-works', 'settings',
  'state-rights', 'deadlines', 'consumer-news', 'analyze-letter',
  'sitemap.xml', 'robots.txt',
]);

const ALL_CATEGORY_PATHS = Object.keys(CATEGORY_PATH_TO_SLUG);
const CATEGORY_PATHS_PATTERN = ALL_CATEGORY_PATHS.join('|');
const ORIGIN = `(?:https?:\\/\\/letterofdispute\\.com)?`;

// Valid blog category slugs (targets for /articles/CATEGORY)
const VALID_CATEGORIES = new Set([
  'financial', 'consumer-rights', 'insurance', 'housing', 'vehicle',
  'employment', 'utilities', 'ecommerce', 'hoa', 'contractors',
  'healthcare', 'travel', 'damaged-goods', 'refunds',
]);

/**
 * Load ALL published article slugs using paginated queries to avoid the 1000-row limit.
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
 * Strip an <a> tag but keep its visible text content.
 */
function stripAnchorTag(content: string, href: string): { content: string; count: number } {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagRegex = new RegExp(
    `<a\\s[^>]*href="${escapedHref}"[^>]*>(.*?)<\\/a>`,
    'gis'
  );
  let count = 0;
  const result = content.replace(tagRegex, (_match: string, innerText: string) => {
    count++;
    return innerText;
  });
  return { content: result, count };
}

/**
 * Find the best slug match for an orphan slug using word overlap scoring.
 * Returns the best match if score >= 60% overlap.
 */
function findSmartReplacement(
  orphanSlug: string,
  category: string,
  slugToCategory: Map<string, string>
): { slug: string; cat: string } | null {
  const orphanWords = new Set(orphanSlug.split('-').filter(w => w.length > 2));
  if (orphanWords.size < 2) return null;

  let bestMatch: { slug: string; cat: string; score: number } | null = null;

  for (const [realSlug, realCat] of slugToCategory) {
    // Prefer same category, but allow cross-category
    if (realCat !== category) continue;

    const realWords = new Set(realSlug.split('-').filter(w => w.length > 2));
    if (realWords.size < 2) continue;

    // Calculate Jaccard-like overlap
    let intersection = 0;
    for (const w of orphanWords) {
      if (realWords.has(w)) intersection++;
    }
    const union = new Set([...orphanWords, ...realWords]).size;
    const score = union > 0 ? intersection / union : 0;

    if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { slug: realSlug, cat: realCat, score };
    }
  }

  // If no same-category match, try cross-category with higher threshold
  if (!bestMatch) {
    for (const [realSlug, realCat] of slugToCategory) {
      if (realCat === category) continue;

      const realWords = new Set(realSlug.split('-').filter(w => w.length > 2));
      if (realWords.size < 2) continue;

      let intersection = 0;
      for (const w of orphanWords) {
        if (realWords.has(w)) intersection++;
      }
      const union = new Set([...orphanWords, ...realWords]).size;
      const score = union > 0 ? intersection / union : 0;

      if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { slug: realSlug, cat: realCat, score };
      }
    }
  }

  return bestMatch ? { slug: bestMatch.slug, cat: bestMatch.cat } : null;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { mode = 'scan', limit = 50, offset = 0, postId } = await req.json().catch(() => ({}));

    // Load ALL published slugs (paginated to avoid 1000-row limit)
    const slugToCategory = await loadAllSlugs(supabase);
    const validSlugs = new Set(slugToCategory.keys());

    console.log(`[fix-broken-links] Loaded ${slugToCategory.size} published article slugs`);

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
      replaced: number;
      stripped: number;
    }> = [];

    let totalFixed = 0;
    let totalBroken = 0;
    let totalStripped = 0;
    let totalReplaced = 0;

    for (const post of posts || []) {
      let content = post.content;
      let fixCount = 0;
      let stripCount = 0;
      let replaceCount = 0;
      const originalContent = content;
      const hrefsToStrip: string[] = [];

      // ── Pattern 1: /blog/slug → find real article or mark for stripping ──
      const blogRegex = new RegExp(`href="${ORIGIN}\\/blog\\/([a-z0-9][a-z0-9-]+)\\/?\"`, 'gi');
      content = content.replace(blogRegex, (_match: string, slug: string) => {
        const cat = slugToCategory.get(slug);
        if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
        const fuzzy = findTruncatedMatch(slug, slugToCategory);
        if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
        // No match — mark for stripping (don't guess a path)
        hrefsToStrip.push(`/blog/${slug}`);
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
        hrefsToStrip.push(_match.slice(6, -1));
        return _match;
      });

      // ── Pattern 6: Bare slugs (absolute only) ──
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/([a-z0-9][a-z0-9-]{5,})\/?"/gi,
        (_match: string, slug: string) => {
          if (RESERVED_PATHS.has(slug)) return _match;
          if (slug.startsWith('articles/') || slug.startsWith('templates/') || slug.startsWith('guides/')) return _match;
          if (CATEGORY_PATH_TO_SLUG[slug]) return _match;

          const cat = slugToCategory.get(slug);
          if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
          const fuzzy = findTruncatedMatch(slug, slugToCategory);
          if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
          hrefsToStrip.push(`/${slug}`);
          return `href="/${slug}"`;
        }
      );

      // ── Pattern 7: Convert absolute /articles/ URLs to relative ──
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/(articles\/[^"]+)"/gi,
        (_match: string, path: string) => {
          fixCount++;
          return `href="/${path.replace(/\/$/, '')}"`;
        }
      );

      // ── Pattern 8: Convert absolute /templates/ URLs to relative ──
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/(templates\/[^"]+)"/gi,
        (_match: string, path: string) => {
          fixCount++;
          return `href="/${path.replace(/\/$/, '')}"`;
        }
      );

      // ── Pattern 9: Catch-all for remaining absolute URLs ──
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/([^"]+)"/gi,
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

      // ── Pattern 10: Validate all /articles/category/slug links (orphan detection) ──
      const articleLinkRegex = /href="\/articles\/([a-z0-9-]+)\/([a-z0-9][a-z0-9-]+)"/gi;
      const orphanHrefs: Array<{ href: string; cat: string; slug: string }> = [];
      
      let articleMatch: RegExpExecArray | null;
      while ((articleMatch = articleLinkRegex.exec(content)) !== null) {
        const [, cat, slug] = articleMatch;
        if (!validSlugs.has(slug)) {
          if (!VALID_CATEGORIES.has(cat)) continue;
          
          // Try fuzzy match first
          const fuzzy = findTruncatedMatch(slug, slugToCategory);
          if (fuzzy) continue; // will be fixed in replace pass
          
          orphanHrefs.push({ href: `/articles/${cat}/${slug}`, cat, slug });
        }
      }

      // Fix or replace orphans
      if (orphanHrefs.length > 0) {
        for (const orphan of orphanHrefs) {
          // Try truncated match
          const fuzzy = findTruncatedMatch(orphan.slug, slugToCategory);
          if (fuzzy) {
            const oldHref = `href="${orphan.href}"`;
            const newHref = `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`;
            content = content.split(oldHref).join(newHref);
            fixCount++;
            continue;
          }

          // Try smart slug-based replacement (word overlap)
          const replacement = findSmartReplacement(orphan.slug, orphan.cat, slugToCategory);
          if (replacement) {
            const oldHref = `href="${orphan.href}"`;
            const newHref = `href="/articles/${replacement.cat}/${replacement.slug}"`;
            content = content.split(oldHref).join(newHref);
            replaceCount++;
            continue;
          }

          // Last resort: strip the <a> tag, keep visible text
          const result = stripAnchorTag(content, orphan.href);
          if (result.count > 0) {
            content = result.content;
            stripCount += result.count;
          }
        }
      }

      // Strip any links collected from patterns 1, 5, 6 that had no match
      for (const href of hrefsToStrip) {
        const result = stripAnchorTag(content, href);
        if (result.count > 0) {
          content = result.content;
          stripCount += result.count;
        }
      }

      const totalIssues = fixCount + replaceCount + stripCount;
      if (content !== originalContent && totalIssues > 0) {
        totalBroken += totalIssues;
        totalFixed += fixCount;
        totalReplaced += replaceCount;
        totalStripped += stripCount;

        if (mode === 'fix') {
          const { error: updateErr } = await supabase
            .from('blog_posts')
            .update({ content })
            .eq('id', post.id);

          if (updateErr) {
            console.error(`Failed to update post ${post.slug}: ${updateErr.message}`);
          }
        }

        results.push({
          postSlug: post.slug,
          broken: totalIssues,
          fixed: fixCount,
          replaced: replaceCount,
          stripped: stripCount,
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
      slugsLoaded: slugToCategory.size,
      pagination: { offset, limit, totalPosts },
      summary: {
        postsScanned: posts?.length || 0,
        postsWithIssues: results.length,
        totalBrokenLinks: totalBroken,
        totalFixed: mode === 'fix' ? totalFixed : totalFixed,
        totalReplaced: mode === 'fix' ? totalReplaced : totalReplaced,
        totalStripped: mode === 'fix' ? totalStripped : totalStripped,
      },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
