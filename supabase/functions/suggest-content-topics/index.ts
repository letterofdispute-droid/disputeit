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
  cleaned = cleaned.substring(start);

  try { return JSON.parse(cleaned); } catch { /* continue */ }

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const lastClose = Math.max(lastBrace, lastBracket);
  if (lastClose > 0) {
    const trimmed = cleaned.substring(0, lastClose + 1);
    try { return JSON.parse(trimmed); } catch { /* continue */ }
  }

  let inString = false;
  let escaped = false;
  let validEnd = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; validEnd = i + 1; continue; }
    if (inString) continue;
    if ('{[}]:,'.includes(ch)) validEnd = i + 1;
  }

  let repaired = cleaned.substring(0, validEnd);
  repaired = repaired.replace(/,\s*(\{[^}]*)?$/, '').replace(/,\s*"[^"]*$/, '').replace(/,\s*$/, '');
  const remaining: string[] = [];
  let s2 = false, e2 = false;
  for (let i = 0; i < repaired.length; i++) {
    const c = repaired[i];
    if (e2) { e2 = false; continue; }
    if (c === '\\' && s2) { e2 = true; continue; }
    if (c === '"') { s2 = !s2; continue; }
    if (s2) continue;
    if (c === '{' || c === '[') remaining.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') remaining.pop();
  }
  repaired += remaining.reverse().join('');
  repaired = repaired.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, '');
  return JSON.parse(repaired);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // ── 1. Article counts by category_slug ──────────────────────────────
    const { data: articleRows } = await supabase
      .from('blog_posts')
      .select('category_slug')
      .eq('status', 'published');

    const articleCounts: Record<string, number> = {};
    for (const row of (articleRows ?? [])) {
      articleCounts[row.category_slug] = (articleCounts[row.category_slug] ?? 0) + 1;
    }

    // ── 2. Keyword saturation per vertical (server-side RPC) ─────────────
    const { data: kwStats } = await supabase.rpc('get_keyword_stats' as any);

    // ── 3. Content plan coverage per category ────────────────────────────
    const { data: planRows } = await supabase
      .from('content_plans')
      .select('category_id, template_slug, value_tier');

    const plansByCat: Record<string, { total: number; tiers: Record<string, number> }> = {};
    for (const row of (planRows ?? [])) {
      if (!plansByCat[row.category_id]) plansByCat[row.category_id] = { total: 0, tiers: {} };
      plansByCat[row.category_id].total++;
      plansByCat[row.category_id].tiers[row.value_tier] = (plansByCat[row.category_id].tiers[row.value_tier] ?? 0) + 1;
    }

    // ── 4. Content queue health ──────────────────────────────────────────
    const { data: queueRows } = await supabase
      .from('content_queue')
      .select('article_type, status, plan_id');

    const queueByType: Record<string, number> = {};
    let totalQueued = 0;
    let totalPublished = 0;
    for (const row of (queueRows ?? [])) {
      queueByType[row.article_type] = (queueByType[row.article_type] ?? 0) + 1;
      if (row.status === 'published') totalPublished++;
      if (row.status === 'queued' || row.status === 'generating') totalQueued++;
    }

    // ── 5. Existing seed keywords already in pipeline ────────────────────
    const { data: seedRows } = await supabase
      .from('keyword_targets')
      .select('vertical, keyword')
      .eq('is_seed', true)
      .limit(500);

    const existingSeeds: Record<string, string[]> = {};
    for (const row of (seedRows ?? [])) {
      if (!existingSeeds[row.vertical]) existingSeeds[row.vertical] = [];
      existingSeeds[row.vertical].push(row.keyword);
    }

    // ── 6b. Optional: GSC query data for data-driven suggestions ─────────
    let gscTopQueries: any[] = [];
    const { data: gscRows } = await supabase
      .from('gsc_performance_cache')
      .select('query, clicks, impressions, ctr, position')
      .order('impressions', { ascending: false })
      .limit(100);
    if (gscRows && gscRows.length > 0) {
      gscTopQueries = gscRows;
    }

    // ── 7. Build context for AI ──────────────────────────────────────────
    const kwSaturation = ((kwStats as any[]) ?? []).map((s: any) => ({
      vertical: s.vertical,
      total: Number(s.total),
      used: Number(s.used),
      unused: Number(s.unused),
      saturationPct: s.total > 0 ? Math.round((s.used / s.total) * 100) : 0,
    }));

    const contextData = {
      totalPublishedArticles: Object.values(articleCounts).reduce((a, b) => a + b, 0),
      articlesByCategory: articleCounts,
      keywordSaturation: kwSaturation,
      contentPlansByCat: plansByCat,
      queueStats: { byType: queueByType, totalQueued, totalPublished },
      existingSeedSample: Object.fromEntries(
        Object.entries(existingSeeds).map(([v, kws]) => [v, kws.slice(0, 5)])
      ),
      ...(gscTopQueries.length > 0 ? { gscTopQueries } : {}),
    };

    // ── 8. Call Gemini 2.5 Pro ───────────────────────────────────────────
    const hasGscData = gscTopQueries.length > 0;
    const systemPrompt = `You are a senior SEO content strategist specializing in US consumer rights, dispute letters, and legal self-help content.

Your job: analyze site data${hasGscData ? ' and real Google Search Console performance data' : ''} to identify the 3 highest-opportunity content topics that will drive the most organic traffic growth.

Focus on topics where:
1. Commercial intent is high (people need help resolving disputes, claiming refunds, writing formal letters)
2. Current article density is low relative to that vertical's template count or commercial potential
3. Keyword pipeline has room (low saturation) or existing seeds are thin
4. A strong pillar + cluster structure will fill a real search-intent gap
${hasGscData ? '5. GSC data shows real search queries with impressions where you lack dedicated content or have low CTR\n6. Queries at positions 8-20 where additional content could push to page 1' : ''}

Return ONLY valid JSON. No markdown, no explanation, just the JSON array.`;

    const userPrompt = `SITE DATA:
${JSON.stringify(contextData, null, 2)}

TASK: Return 3-5 topic suggestions as a JSON array with this exact structure:
[
  {
    "vertical": "insurance",
    "categoryName": "Insurance Claims & Disputes",
    "opportunityScore": 82,
    "rationale": "2-3 sentence explanation of why this topic now",
    "pillar": {
      "title": "The Complete Guide to Disputing Insurance Claim Denials",
      "primaryKeyword": "dispute insurance claim denial"
    },
    "clusters": [
      { "articleType": "how-to", "title": "How to Write a Formal Insurance Complaint Letter", "keyword": "insurance complaint letter" },
      { "articleType": "rights", "title": "Your Rights When an Insurance Claim is Rejected", "keyword": "insurance claim rejected rights" },
      { "articleType": "mistakes", "title": "5 Mistakes That Get Insurance Claims Denied", "keyword": "why insurance claims get denied" },
      { "articleType": "sample", "title": "Insurance Dispute Letter Examples That Actually Work", "keyword": "insurance dispute letter example" },
      { "articleType": "faq", "title": "Insurance Claim FAQs: Everything You Need to Know", "keyword": "insurance claim faq" }
    ],
    "seedKeywords": [
      "dispute insurance claim denial",
      "insurance complaint letter template",
      "how to appeal insurance decision",
      "how to appeal insurance decision",
      "insurance claim rejected letter"
    ]
  }
]

Produce exactly 3 items. Prioritize verticals with low article counts, low keyword saturation, or high commercial intent gaps. Target US audiences only and use American English throughout. Reference US federal and state laws (e.g., FTC, CFPB, FDCPA, state consumer protection statutes). Do NOT reference any UK bodies, UK laws, or UK terminology (no Ombudsman, no Trading Standards, no Citizens Advice, no FCA, no UK-specific agencies).`;

    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI request failed: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? '[]';

    // Robust JSON extraction — handles truncation, markdown fences, trailing commas
    const suggestions = extractJson(rawContent);

    return new Response(JSON.stringify({ success: true, suggestions, contextData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('suggest-content-topics error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
