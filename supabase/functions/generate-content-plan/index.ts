import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePlanRequest {
  templateSlug: string;
  templateName: string;
  categoryId: string;
  subcategorySlug?: string;
  valueTier: 'high' | 'medium' | 'longtail';
}

// Article type definitions matching frontend
const ARTICLE_TYPES = [
  { id: 'how-to', name: 'How-To Guide', priority: 100 },
  { id: 'mistakes', name: 'Mistakes to Avoid', priority: 95 },
  { id: 'rights', name: 'Rights Explainer', priority: 90 },
  { id: 'sample', name: 'Sample/Example', priority: 85 },
  { id: 'faq', name: 'FAQ/Q&A', priority: 80 },
  { id: 'case-study', name: 'Case Study', priority: 75 },
  { id: 'comparison', name: 'Comparison', priority: 70 },
  { id: 'checklist', name: 'Checklist', priority: 65 },
];

const VALUE_TIER_CONFIGS = {
  high: {
    articleCount: 10,
    articleTypes: ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'],
  },
  medium: {
    articleCount: 7,
    articleTypes: ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'checklist', 'case-study'],
  },
  longtail: {
    articleCount: 5,
    articleTypes: ['how-to', 'mistakes', 'rights', 'sample', 'checklist'],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { templateSlug, templateName, categoryId, subcategorySlug, valueTier } = await req.json() as GeneratePlanRequest;

    if (!templateSlug || !templateName || !categoryId || !valueTier) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const tierConfig = VALUE_TIER_CONFIGS[valueTier];
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: 'Invalid value tier' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if plan already exists
    const { data: existingPlan } = await supabase
      .from('content_plans')
      .select('id')
      .eq('template_slug', templateSlug)
      .single();

    if (existingPlan) {
      return new Response(JSON.stringify({ 
        error: 'Plan already exists for this template',
        existingPlanId: existingPlan.id 
      }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Use AI to generate tailored titles and keywords
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const articleTypesToGenerate = ARTICLE_TYPES
      .filter(t => tierConfig.articleTypes.includes(t.id))
      .slice(0, tierConfig.articleCount);

    const systemPrompt = `You are an SEO content strategist. Generate article titles and keywords for a content cluster supporting a complaint letter template.

RULES:
1. Each title must be unique and SEO-optimized
2. Keywords should include long-tail variations
3. Titles should match the article type purpose
4. Focus on UK consumer rights context
5. Output valid JSON only`;

    const userPrompt = `Generate content cluster for this template:

Template: "${templateName}"
Category: ${categoryId}
${subcategorySlug ? `Subcategory: ${subcategorySlug}` : ''}

Generate ${articleTypesToGenerate.length} articles with these types:
${articleTypesToGenerate.map(t => `- ${t.id}: ${t.name}`).join('\n')}

Return JSON:
{
  "articles": [
    {
      "type": "article-type-id",
      "title": "SEO optimized title",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
    }
  ]
}`;

    console.log('Generating content plan for:', templateName);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content;
    
    // Parse JSON from response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const parsedContent = JSON.parse(cleanedContent);
    const generatedArticles = parsedContent.articles || [];

    // Create the content plan
    const { data: plan, error: planError } = await supabase
      .from('content_plans')
      .insert({
        template_slug: templateSlug,
        template_name: templateName,
        category_id: categoryId,
        subcategory_slug: subcategorySlug,
        value_tier: valueTier,
        target_article_count: tierConfig.articleCount,
      })
      .select()
      .single();

    if (planError) {
      throw new Error(`Failed to create plan: ${planError.message}`);
    }

    // Create queue items for each article
    const queueItems = generatedArticles.map((article: any, index: number) => {
      const articleType = ARTICLE_TYPES.find(t => t.id === article.type);
      return {
        plan_id: plan.id,
        article_type: article.type,
        suggested_title: article.title,
        suggested_keywords: article.keywords || [],
        priority: articleType?.priority || (100 - index * 5),
        status: 'queued',
      };
    });

    const { data: queuedItems, error: queueError } = await supabase
      .from('content_queue')
      .insert(queueItems)
      .select();

    if (queueError) {
      // Rollback plan if queue insert fails
      await supabase.from('content_plans').delete().eq('id', plan.id);
      throw new Error(`Failed to create queue items: ${queueError.message}`);
    }

    console.log(`Created plan ${plan.id} with ${queuedItems.length} queued articles`);

    return new Response(JSON.stringify({
      success: true,
      planId: plan.id,
      templateSlug,
      valueTier,
      queuedArticles: queuedItems.map(item => ({
        id: item.id,
        type: item.article_type,
        title: item.suggested_title,
        keywords: item.suggested_keywords,
        priority: item.priority,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content-plan:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
