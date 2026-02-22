import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SITE = 'https://letterofdispute.com';

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
};

// Reserved paths that are NOT article slugs
const RESERVED_PATHS = new Set([
  'articles', 'templates', 'guides', 'admin', 'auth', 'dashboard',
  'login', 'signup', 'pricing', 'about', 'contact', 'faq', 'privacy',
  'terms', 'disclaimer', 'cookie-policy', 'how-it-works', 'settings',
  'state-rights', 'deadlines', 'consumer-news', 'analyze-letter',
  'vehicle-auto', 'contractor', 'sitemap.xml', 'robots.txt',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { mode = 'scan', limit = 50, offset = 0, postId } = await req.json().catch(() => ({}));

    // Build a lookup: slug → category_slug for all published articles
    const { data: allArticles, error: articlesErr } = await supabase
      .from('blog_posts')
      .select('slug, category_slug')
      .eq('status', 'published');

    if (articlesErr) throw articlesErr;

    const slugToCategory = new Map<string, string>();
    for (const a of allArticles || []) {
      slugToCategory.set(a.slug, a.category_slug);
    }

    // Fetch posts - either specific post or batch
    let query = supabase
      .from('blog_posts')
      .select('id, slug, content, category_slug')
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (postId) {
      query = query.eq('id', postId);
    } else {
      // Only scan posts that actually contain absolute links
      query = query.like('content', '%letterofdispute.com%').range(offset, offset + limit - 1);
    }

    const { data: posts, error: postsErr } = await query;
    if (postsErr) throw postsErr;

    const results: Array<{
      postSlug: string;
      broken: number;
      fixed: number;
      unfixable: Array<{ url: string; reason: string }>;
    }> = [];

    let totalFixed = 0;
    let totalBroken = 0;
    let totalUnfixable = 0;

    for (const post of posts || []) {
      let content = post.content;
      let fixCount = 0;
      const unfixable: Array<{ url: string; reason: string }> = [];
      const originalContent = content;

      // Pattern 1: Full URL with /blog/ prefix
      // e.g. https://letterofdispute.com/blog/some-article-slug
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/blog\/([a-z0-9][a-z0-9-]+)\/?"/gi,
        (_match: string, slug: string) => {
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
          unfixable.push({ url: `/blog/${slug}`, reason: 'No matching article found' });
          return `href="/articles/${post.category_slug}/${slug}"`;
        }
      );

      // Pattern 2: Full URL with category-name path (not /articles/)
      // e.g. https://letterofdispute.com/financial-services/loan-holiday-dispute-letter
      const categoryRegex = /href="https?:\/\/letterofdispute\.com\/(financial-services|consumer-rights|insurance|housing|vehicle|vehicle-auto|employment|utilities|ecommerce|e-commerce-online-services|hoa|contractors|healthcare|healthcare-medical|healthcare-medical-billing|travel|travel-transportation|employment-workplace|landlord-housing|insurance-claims|utilities-telecommunications|contractors-home-improvement|neighbor-hoa-disputes)\/([a-z0-9][a-z0-9_-]+)\/?"/gi;
      content = content.replace(
        categoryRegex,
        (_match: string, categoryPath: string, slug: string) => {
          const normalizedSlug = slug.replace(/_/g, '-');
          const articleCat = slugToCategory.get(normalizedSlug) || slugToCategory.get(slug);
          if (articleCat) {
            fixCount++;
            return `href="/articles/${articleCat}/${normalizedSlug}"`;
          }
          const blogCat = CATEGORY_PATH_TO_SLUG[categoryPath] || categoryPath;
          const fuzzy = findTruncatedMatch(normalizedSlug, slugToCategory);
          if (fuzzy) {
            fixCount++;
            return `href="/articles/${fuzzy.cat}/${fuzzy.slug}"`;
          }
          unfixable.push({ url: `/${categoryPath}/${slug}`, reason: 'No matching article or template' });
          fixCount++;
          return `href="/articles/${blogCat}"`;
        }
      );

      // Pattern 3: Full URL bare slugs (not /blog/, not /articles/, not /templates/, not reserved)
      // e.g. https://letterofdispute.com/some-article-slug
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/([a-z0-9][a-z0-9-]{5,})\/?"/gi,
        (_match: string, slug: string) => {
          if (RESERVED_PATHS.has(slug)) return _match;
          if (slug.startsWith('articles/') || slug.startsWith('templates/') || slug.startsWith('guides/')) return _match;
          
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
          unfixable.push({ url: `/${slug}`, reason: 'No matching article' });
          return _match;
        }
      );

      // Pattern 4: /category/ and /categories/ prefixed URLs → /templates/categoryId
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/(?:category|categories)\/([^"]+)"/gi,
        (_match: string, path: string) => {
          const cleanPath = path.replace(/\/$/, '');
          fixCount++;
          // Map to templates category page
          const slug = cleanPath.split('/')[0].toLowerCase();
          const catMap: Record<string, string> = {
            'vehicle-auto': 'vehicle', 'vehicle': 'vehicle',
            'consumer-rights': 'damaged-goods', 'employment-workplace': 'employment',
            'financial-services': 'financial', 'landlord-housing': 'housing',
            'e-commerce-online-services': 'ecommerce', 'ecommerce': 'ecommerce',
            'insurance-claims': 'insurance', 'insurance': 'insurance',
            'utilities-telecommunications': 'utilities', 'utilities': 'utilities',
            'contractors-home-improvement': 'contractors', 'contractors': 'contractors',
            'healthcare-medical-billing': 'healthcare', 'healthcare': 'healthcare',
            'travel-transportation': 'travel', 'travel': 'travel',
            'neighbor-hoa-disputes': 'hoa', 'hoa': 'hoa',
            'housing': 'housing',
          };
          const templateCat = catMap[slug] || slug;
          return `href="/templates/${templateCat}"`;
        }
      );

      // Pattern 5: Category-only links (no sub-slug) — /healthcare, /travel etc.
      const catOnlyPattern = Object.keys(CATEGORY_PATH_TO_SLUG).join('|');
      const catOnlyRegex = new RegExp(`href="https?:\\/\\/letterofdispute\\.com\\/(${catOnlyPattern})\\/?\"`, 'gi');
      content = content.replace(
        catOnlyRegex,
        (_match: string, categoryPath: string) => {
          const blogCat = CATEGORY_PATH_TO_SLUG[categoryPath.toLowerCase()] || categoryPath;
          fixCount++;
          return `href="/articles/${blogCat}"`;
        }
      );

      // Pattern 6: Convert absolute letterofdispute.com/articles/ URLs to relative
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/(articles\/[^"]+)"/gi,
        (_match: string, path: string) => {
          fixCount++;
          return `href="/${path.replace(/\/$/, '')}"`;
        }
      );

      // Pattern 7: Convert remaining absolute letterofdispute.com/templates/ URLs to relative
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/(templates\/[^"]+)"/gi,
        (_match: string, path: string) => {
          fixCount++;
          return `href="/${path.replace(/\/$/, '')}"`;
        }
      );

      // Pattern 8: Catch-all for any remaining absolute URLs to make relative
      content = content.replace(
        /href="https?:\/\/letterofdispute\.com\/([^"]+)"/gi,
        (_match: string, path: string) => {
          const cleanPath = path.replace(/\/$/, '');
          if (RESERVED_PATHS.has(cleanPath)) {
            fixCount++;
            return `href="/${cleanPath}"`;
          }
          // Check if it matches a known article
          const cat = slugToCategory.get(cleanPath);
          if (cat) {
            fixCount++;
            return `href="/articles/${cat}/${cleanPath}"`;
          }
          fixCount++;
          return `href="/${cleanPath}"`;
        }
      );

      if (content !== originalContent) {
        totalBroken += fixCount + unfixable.length;
        totalFixed += fixCount;
        totalUnfixable += unfixable.length;

        if (mode === 'fix') {
          const { error: updateErr } = await supabase
            .from('blog_posts')
            .update({ content })
            .eq('id', post.id);

          if (updateErr) {
            unfixable.push({ url: 'UPDATE_FAILED', reason: updateErr.message });
          }
        }

        results.push({
          postSlug: post.slug,
          broken: fixCount + unfixable.length,
          fixed: fixCount,
          unfixable,
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
      pagination: { offset, limit, totalPosts },
      summary: {
        postsScanned: posts?.length || 0,
        postsWithIssues: results.length,
        totalBrokenLinks: totalBroken,
        totalFixed: mode === 'fix' ? totalFixed : 0,
        totalUnfixable,
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

function findTruncatedMatch(
  partialSlug: string,
  slugMap: Map<string, string>
): { slug: string; cat: string } | null {
  // If slug is short, skip fuzzy
  if (partialSlug.length < 10) return null;
  
  for (const [fullSlug, cat] of slugMap) {
    // Check if the full slug starts with the partial (truncated case)
    if (fullSlug.startsWith(partialSlug) && fullSlug.length > partialSlug.length) {
      return { slug: fullSlug, cat };
    }
  }
  return null;
}
