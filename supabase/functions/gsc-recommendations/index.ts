import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractJson(raw: string): unknown {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error('No JSON found in AI response');
  const bracket = cleaned[start];
  const close = bracket === '[' ? ']' : '}';
  let end = cleaned.lastIndexOf(close);
  if (end <= start) {
    cleaned = cleaned.substring(start).replace(/,\s*\{[^}]*$/, '').replace(/,\s*"[^"]*$/, '') + close;
  } else {
    cleaned = cleaned.substring(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(cleaned);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get latest GSC data (top 200 by impressions)
    const { data: gscData, error: gscErr } = await supabase
      .from('gsc_performance_cache')
      .select('query, page, clicks, impressions, ctr, position')
      .order('impressions', { ascending: false })
      .limit(200);

    if (gscErr) throw gscErr;
    if (!gscData || gscData.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        recommendations: [],
        message: 'No GSC data available. Fetch data from Search Console first.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get existing blog posts (slugs + categories)
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, category_slug, title, primary_keyword, meta_title')
      .eq('status', 'published')
      .limit(1000);

    // 3. Get existing keyword targets
    const { data: keywords } = await supabase
      .from('keyword_targets')
      .select('keyword, vertical, used_in_queue_id')
      .limit(500);

    // 4. Build AI prompt
    const systemPrompt = `You are a senior SEO analyst for a US consumer rights and dispute letter website. Analyze Google Search Console data to find actionable opportunities.

Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `GSC DATA (top 200 queries by impressions):
${JSON.stringify(gscData, null, 1)}

EXISTING BLOG POSTS (sample of ${(posts ?? []).length} published):
${JSON.stringify((posts ?? []).slice(0, 100).map(p => ({ slug: p.slug, cat: p.category_slug, kw: p.primary_keyword })), null, 1)}

EXISTING KEYWORDS (${(keywords ?? []).length} total):
${JSON.stringify((keywords ?? []).slice(0, 100).map(k => ({ kw: k.keyword, v: k.vertical, used: !!k.used_in_queue_id })), null, 1)}

TASK: Analyze and return a JSON object with exactly these 4 arrays:

{
  "uncoveredQueries": [
    {
      "query": "the search query",
      "impressions": 1500,
      "clicks": 20,
      "position": 15.3,
      "suggestedVertical": "housing",
      "suggestedArticleType": "how-to",
      "suggestedTitle": "Article title targeting this query",
      "rationale": "Why this is an opportunity"
    }
  ],
  "quickWins": [
    {
      "query": "the search query",
      "page": "/articles/existing-page",
      "impressions": 3000,
      "clicks": 30,
      "ctr": 0.01,
      "position": 8.5,
      "suggestedMetaTitle": "Improved meta title (under 60 chars)",
      "suggestedMetaDescription": "Improved description (under 160 chars)",
      "rationale": "Why improving meta will help"
    }
  ],
  "positionOpportunities": [
    {
      "query": "the search query",
      "page": "/articles/page",
      "position": 12.3,
      "impressions": 2000,
      "action": "Create supporting cluster article / add more content",
      "rationale": "Close to page 1, needs more depth"
    }
  ],
  "cannibalization": [
    {
      "query": "the search query",
      "pages": ["/page-1", "/page-2"],
      "action": "Merge or differentiate these pages",
      "rationale": "Both competing for same query"
    }
  ]
}

Rules:
- uncoveredQueries: queries with impressions but NO matching blog post (by slug or keyword)
- quickWins: queries with high impressions (>500) but CTR < 0.03 and position < 20
- positionOpportunities: queries with position 8-20 that could reach page 1
- cannibalization: same query appearing for multiple pages
- Return 5-10 items per category max
- Target US audiences, reference US consumer protection laws`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? '{}';
    const recommendations = extractJson(rawContent);

    return new Response(JSON.stringify({ success: true, recommendations, queryCount: gscData.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('gsc-recommendations error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
