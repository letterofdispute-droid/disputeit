import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map keywords to our 13 categories
function inferCategoryTags(title: string, excerpt: string): string[] {
  const text = (title + ' ' + excerpt).toLowerCase();
  const tags: string[] = [];

  if (text.match(/credit|debt|loan|bank|fraud|scam|financial|fcra|fdcpa|collection|mortgage/)) tags.push('financial');
  if (text.match(/vehicle|car|auto|recall|safety|nhtsa|dealer|lemon/)) tags.push('vehicle');
  if (text.match(/health|medical|hospital|insurance claim|prescription/)) tags.push('healthcare');
  if (text.match(/landlord|tenant|rental|housing|evict|deposit/)) tags.push('housing');
  if (text.match(/refund|return|purchase|product|warranty|defect/)) tags.push('refunds');
  if (text.match(/online|ecommerce|amazon|marketplace|shipping|delivery/)) tags.push('ecommerce');
  if (text.match(/insur|claim|deny|premium|coverage/)) tags.push('insurance');
  if (text.match(/employ|wage|worker|labor|discrimination|harassment/)) tags.push('employment');
  if (text.match(/utility|electric|gas|water|telecom|phone|internet/)) tags.push('utilities');
  if (text.match(/contractor|home improvement|construction|repair|plumb|hvac/)) tags.push('contractors');
  if (text.match(/travel|flight|airline|hotel|vacation|cruise/)) tags.push('travel');

  return tags.slice(0, 3);
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseRSS(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Extract item blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];

    const getField = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };

    const title = getField('title');
    const link = getField('link') || getField('guid');
    const pubDate = getField('pubDate');
    const description = getField('description').replace(/<[^>]*>/g, '').slice(0, 500);

    if (title && link) {
      items.push({ title, link, pubDate, description });
    }
  }

  return items.slice(0, 20);
}

async function fetchFTC(): Promise<RSSItem[]> {
  try {
    const res = await fetch('https://www.ftc.gov/feeds/press-release.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConsumerRightsBot/1.0)' }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml);
  } catch {
    return [];
  }
}

async function fetchCFPB(): Promise<RSSItem[]> {
  try {
    const res = await fetch('https://www.consumerfinance.gov/about-us/newsroom/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConsumerRightsBot/1.0)' }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml);
  } catch {
    return [];
  }
}

async function fetchNHTSA(): Promise<RSSItem[]> {
  try {
    // NHTSA recall API - returns JSON
    const res = await fetch('https://api.nhtsa.gov/recalls/recallsByType?type=Vehicle', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConsumerRightsBot/1.0)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const recalls = (data.results || []).slice(0, 10);

    return recalls.map((r: Record<string, string>) => ({
      title: `Safety Recall: ${r.Manufacturer} ${r.ModelYear} ${r.Model} — ${r.Component || 'Component Issue'}`,
      link: `https://www.nhtsa.gov/vehicle/${encodeURIComponent(r.Manufacturer || '')}/${encodeURIComponent(r.Model || '')}/${encodeURIComponent(r.ModelYear || '')}/0`,
      pubDate: r.ReportReceivedDate || new Date().toISOString(),
      description: (r.Summary || r.Consequence || '').slice(0, 500),
    }));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const sourceFilter = body.source || 'all';

    // Fetch in parallel
    const [ftcItems, cfpbItems, nhtsaItems] = await Promise.all([
      sourceFilter === 'all' || sourceFilter === 'ftc' ? fetchFTC() : Promise.resolve([]),
      sourceFilter === 'all' || sourceFilter === 'cfpb' ? fetchCFPB() : Promise.resolve([]),
      sourceFilter === 'all' || sourceFilter === 'nhtsa' ? fetchNHTSA() : Promise.resolve([]),
    ]);

    // Build rows to upsert
    const rows: Record<string, unknown>[] = [
      ...ftcItems.map(item => ({
        source: 'ftc',
        title: item.title.slice(0, 500),
        excerpt: item.description || null,
        url: item.link,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        category_tags: inferCategoryTags(item.title, item.description),
        fetched_at: new Date().toISOString(),
      })),
      ...cfpbItems.map(item => ({
        source: 'cfpb',
        title: item.title.slice(0, 500),
        excerpt: item.description || null,
        url: item.link,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        category_tags: inferCategoryTags(item.title, item.description),
        fetched_at: new Date().toISOString(),
      })),
      ...nhtsaItems.map(item => ({
        source: 'nhtsa',
        title: item.title.slice(0, 500),
        excerpt: item.description || null,
        url: item.link,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        category_tags: ['vehicle'],
        fetched_at: new Date().toISOString(),
      })),
    ];

    if (rows.length > 0) {
      // Clear old cached items and insert fresh ones
      const sources = [...new Set(rows.map(r => r.source as string))];
      await supabase.from('consumer_news_cache').delete().in('source', sources);
      await supabase.from('consumer_news_cache').insert(rows);
    }

    // Return the items
    let query = supabase
      .from('consumer_news_cache')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(30);

    if (sourceFilter !== 'all') {
      query = query.eq('source', sourceFilter);
    }

    const { data: items, error: selectError } = await query;

    if (selectError) {
      return new Response(JSON.stringify({ error: selectError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ items: items || [], fetched: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-consumer-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
