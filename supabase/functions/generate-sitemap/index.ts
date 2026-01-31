import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://disputeletters.com';

// Category definitions
const categories = [
  { id: 'refunds', name: 'Refunds & Purchases' },
  { id: 'housing', name: 'Landlord & Housing' },
  { id: 'travel', name: 'Travel & Transportation' },
  { id: 'damaged-goods', name: 'Damaged & Defective Goods' },
  { id: 'utilities', name: 'Utilities & Telecommunications' },
  { id: 'financial', name: 'Financial Services' },
  { id: 'insurance', name: 'Insurance Claims' },
  { id: 'vehicle', name: 'Vehicle & Auto' },
  { id: 'healthcare', name: 'Healthcare & Medical Billing' },
  { id: 'employment', name: 'Employment & Workplace' },
  { id: 'ecommerce', name: 'E-commerce & Online Services' },
  { id: 'hoa', name: 'Neighbor & HOA Disputes' },
  { id: 'contractors', name: 'Contractors & Home Improvement' },
];

// Blog categories
const blogCategories = [
  { slug: 'consumer-rights', name: 'Consumer Rights' },
  { slug: 'landlord-tenant', name: 'Landlord & Tenant' },
  { slug: 'travel-disputes', name: 'Travel Disputes' },
  { slug: 'financial-tips', name: 'Financial Tips' },
  { slug: 'legal-guides', name: 'Legal Guides' },
];

interface BlogPost {
  slug: string;
  category_slug: string;
  updated_at: string;
  published_at: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'index';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];
    let xml = '';

    switch (sitemapType) {
      case 'index':
        xml = generateSitemapIndex(today);
        break;
      
      case 'static':
        xml = generateStaticSitemap(today);
        break;
      
      case 'categories':
        xml = generateCategoriesSitemap(today);
        break;
      
      case 'blog':
        // Fetch published blog posts from database
        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('slug, category_slug, updated_at, published_at')
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching blog posts:', error);
          xml = generateBlogSitemap([], today);
        } else {
          xml = generateBlogSitemap(posts || [], today);
        }
        break;
      
      default:
        xml = generateSitemapIndex(today);
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
});

function generateSitemapIndex(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemaps/static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemaps/categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemaps/templates.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/api/sitemap?type=blog</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generateStaticSitemap(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/templates</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/articles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
}

function generateCategoriesSitemap(today: string): string {
  const categoryUrls = categories.map(cat => `  <url>
    <loc>${SITE_URL}/templates/${cat.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  const blogCategoryUrls = blogCategories.map(cat => `  <url>
    <loc>${SITE_URL}/articles/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls}
${blogCategoryUrls}
</urlset>`;
}

function generateBlogSitemap(posts: BlogPost[], today: string): string {
  const urls = posts.map(post => {
    const lastmod = post.updated_at?.split('T')[0] || post.published_at?.split('T')[0] || today;
    return `  <url>
    <loc>${SITE_URL}/articles/${post.category_slug}/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
