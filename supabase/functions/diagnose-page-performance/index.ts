import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pagePath, viewCount, uniqueSessions, trend, period } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Detect page type from path
    const pageType = detectPageType(pagePath);

    // Gather contextual data in parallel
    const [blogData, contentPlanData, linkData, keywordData] = await Promise.all([
      // For article pages: look up related blog post
      pageType === "article"
        ? supabase.from("blog_posts")
            .select("title, article_type, status, meta_title, meta_description, primary_keyword, secondary_keywords, views")
            .or(`slug.eq.${slugFromPath(pagePath)},slug.ilike.%${slugFromPath(pagePath)}%`)
            .limit(1)
            .then(r => r.data?.[0] || null)
        : Promise.resolve(null),

      // For template pages: look up content plan
      pageType === "template"
        ? supabase.from("content_plans")
            .select("template_name, value_tier, target_article_count")
            .eq("template_slug", slugFromPath(pagePath))
            .limit(1)
            .then(r => r.data?.[0] || null)
        : Promise.resolve(null),

      // Count inbound links pointing to this page
      supabase.from("link_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("target_slug", slugFromPath(pagePath))
        .eq("status", "applied")
        .then(r => r.count || 0),

      // Check keyword budget for the vertical
      supabase.from("keyword_targets")
        .select("keyword, vertical, is_seed, used_in_queue_id")
        .is("used_in_queue_id", null)
        .limit(5)
        .then(r => r.data || []),
    ]);

    // Count content plan articles for template pages
    let articleCount = 0;
    let contentPlanCount = 0;
    if (pageType === "template") {
      const { count } = await supabase.from("content_queue")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", contentPlanData ? contentPlanData.id : "none")
        .eq("status", "published");
      articleCount = count || 0;

      const { count: planCount } = await supabase.from("content_plans")
        .select("id", { count: "exact", head: true })
        .eq("template_slug", slugFromPath(pagePath));
      contentPlanCount = planCount || 0;
    }

    // Build context for AI
    const contextLines: string[] = [
      `PAGE PATH: ${pagePath}`,
      `PAGE TYPE: ${pageType}`,
      `TRAFFIC (last ${period} days): ${viewCount} views, ${uniqueSessions} unique sessions`,
      `TREND: ${trend > 0 ? `+${trend}%` : `${trend}%`} vs previous period`,
      `INBOUND LINKS (applied): ${linkData}`,
      `AVAILABLE KEYWORD BUDGET: ${keywordData.length} unused keywords in system`,
    ];

    if (blogData) {
      contextLines.push(`ARTICLE STATUS: ${blogData.status}`);
      contextLines.push(`ARTICLE TYPE: ${blogData.article_type || "not set"}`);
      contextLines.push(`HAS META TITLE: ${!!blogData.meta_title}`);
      contextLines.push(`HAS META DESCRIPTION: ${!!blogData.meta_description}`);
      contextLines.push(`PRIMARY KEYWORD: ${blogData.primary_keyword || "none set"}`);
      contextLines.push(`DB VIEW COUNT: ${blogData.views}`);
    }

    if (contentPlanData) {
      contextLines.push(`CONTENT PLAN EXISTS: yes`);
      contextLines.push(`VALUE TIER: ${contentPlanData.value_tier}`);
      contextLines.push(`TARGET ARTICLES: ${contentPlanData.target_article_count}`);
      contextLines.push(`PUBLISHED ARTICLES: ${articleCount}`);
    } else if (pageType === "template") {
      contextLines.push(`CONTENT PLAN EXISTS: no`);
      contextLines.push(`PUBLISHED ARTICLES: 0`);
    }

    const systemPrompt = `You are an expert SEO content strategist specializing in legal and consumer rights websites. 
You analyze page performance data and provide specific, actionable recommendations to improve visibility and traffic.
Always respond with valid JSON matching the exact structure requested. Be specific and practical.`;

    const userPrompt = `Analyze this page's performance and diagnose why it may be underperforming.

${contextLines.join("\n")}

Respond with this exact JSON structure:
{
  "trafficSignal": "Red" | "Amber" | "Green",
  "rootCause": "1-2 sentence diagnosis of the main reason this page has low traffic",
  "recommendations": [
    {
      "title": "Short action title",
      "description": "Specific actionable description (mention actual keywords, article types, or page elements where possible)",
      "actionType": "create_content" | "add_keywords" | "fix_seo" | "build_links" | "other",
      "impact": "High" | "Medium" | "Low",
      "suggestedKeyword": "optional: a specific keyword to target"
    }
  ],
  "suggestedVertical": "The SEO vertical/category this page falls under (e.g. financial, housing, insurance)"
}

Rules:
- trafficSignal: Red = <5 views or invisible, Amber = cold/declining, Green = normal/hot
- Provide exactly 3 recommendations
- Make each recommendation very specific to this page, not generic advice
- If the page lacks a content plan, the first recommendation should be to create one
- If there are 0 inbound links, recommend adding internal links
- If meta description is missing, include that as a quick win`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const diagnosis = JSON.parse(content);

    return new Response(JSON.stringify({ diagnosis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("diagnose-page-performance error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectPageType(path: string): string {
  if (path.startsWith("/articles/") || path.startsWith("/guides/")) return "article";
  if (path.startsWith("/letters/") || path.startsWith("/templates/")) return "template";
  if (path.startsWith("/category/") || path.startsWith("/categories/")) return "category";
  if (path.startsWith("/state-rights")) return "state-rights";
  return "static";
}

function slugFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}
