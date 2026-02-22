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
 * SCAN-ONLY broken link scanner.
 * 
 * This function ONLY rewrites URL patterns (e.g. /blog/slug → /articles/cat/slug).
 * It NEVER strips or removes <a> tags. It NEVER deletes content.
 * 
 * Pattern 10 (orphan stripping) has been permanently removed.
 * The stripAnchorTag function has been permanently removed.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { mode = 'scan', limit = 50, offset = 0, postId } = await req.json().catch(() => ({}));

    // SAFETY: Fix mode is permanently disabled. Only scan (read-only preview) is allowed.
    if (mode === 'fix') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fix mode has been permanently disabled for safety. Use the semantic linking pipeline (scan-for-semantic-links + apply-links-bulk) to manage internal links.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

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
    }> = [];

    let totalFixed = 0;
    let totalBroken = 0;

    for (const post of posts || []) {
      let content = post.content;
      let fixCount = 0;
      const originalContent = content;

      // ── Pattern 1: /blog/slug → find real article ──
      const blogRegex = new RegExp(`href="${ORIGIN}\\/blog\\/([a-z0-9][a-z0-9-]+)\\/?\"`, 'gi');
      content = content.replace(blogRegex, (_match: string, slug: string) => {
        const cat = slugToCategory.get(slug);
        if (cat) { fixCount++; return `href="/articles/${cat}/${slug}"`; }
        const fuzzy = findTruncatedMatch(slug, slugToCategory);
        if (fuzzy) { fixCount++; return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`; }
        // No match — leave as-is (NEVER strip)
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
        // No match — leave as-is (NEVER strip)
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
          // Convert absolute to relative but don't strip
          fixCount++;
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

      // ── NO Pattern 10 — orphan detection/stripping has been PERMANENTLY REMOVED ──

      if (content !== originalContent && fixCount > 0) {
        totalBroken += fixCount;
        totalFixed += fixCount;

        results.push({
          postSlug: post.slug,
          broken: fixCount,
          fixed: fixCount,
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
      mode: 'scan',
      slugsLoaded: slugToCategory.size,
      pagination: { offset, limit, totalPosts },
      summary: {
        postsScanned: posts?.length || 0,
        postsWithIssues: results.length,
        totalBrokenLinks: totalBroken,
        totalFixed,
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
