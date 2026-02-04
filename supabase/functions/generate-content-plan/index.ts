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

// Article type definitions with diversity patterns
const ARTICLE_TYPES = [
  { 
    id: 'how-to', 
    name: 'How-To Guide', 
    priority: 100,
    variations: [
      'How to {action} {topic}',
      '{topic}: A Complete Guide',
      'The Smart Way to Handle {topic}',
      'What to Do When {scenario}',
    ],
  },
  { 
    id: 'mistakes', 
    name: 'Mistakes to Avoid', 
    priority: 95,
    variations: [
      '{number} Costly {topic} Mistakes',
      'Why Your {topic} Keeps Getting Rejected',
      'Stop Making These {topic} Blunders',
      'The Hidden Traps in {topic}',
    ],
  },
  { 
    id: 'rights', 
    name: 'Rights Explainer', 
    priority: 90,
    variations: [
      'What {entity} Won\'t Tell You About {topic}',
      'Your {topic} Rights Explained',
      'The Consumer Rights You Didn\'t Know You Had',
      'UK {topic} Laws: What Protects You',
    ],
  },
  { 
    id: 'sample', 
    name: 'Sample/Example', 
    priority: 85,
    variations: [
      'Real {topic} Letters That Got Results',
      '{topic} Example: What Actually Worked',
      'Copy This: A {topic} Letter That Worked',
      'Before & After: {topic} Letters Compared',
    ],
  },
  { 
    id: 'faq', 
    name: 'FAQ/Q&A', 
    priority: 80,
    variations: [
      '{topic} Questions Everyone Asks',
      'Your {topic} Questions, Sorted',
      'The {topic} FAQ You Actually Need',
      'Everything About {topic}, Answered',
    ],
  },
  { 
    id: 'case-study', 
    name: 'Case Study', 
    priority: 75,
    variations: [
      'How {name} Won Their {topic} Battle',
      'From Rejected to Refunded: A {topic} Story',
      '{amount} Recovered: A Real {topic} Win',
      'The {topic} Fight That Paid Off',
    ],
  },
  { 
    id: 'comparison', 
    name: 'Comparison', 
    priority: 70,
    variations: [
      '{option1} vs {option2}: Which Works?',
      'Comparing Your {topic} Options',
      'The {topic} Approach That Wins',
      '{topic} Methods: What Gets Results',
    ],
  },
  { 
    id: 'checklist', 
    name: 'Checklist', 
    priority: 65,
    variations: [
      'Before You File: {topic} Checklist',
      'The Complete {topic} Prep List',
      'Don\'t Submit Until You\'ve Checked This',
      '{topic} Ready? Check This First',
    ],
  },
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

// Category-specific language for natural-sounding titles
const CATEGORY_LANGUAGE: Record<string, { terms: string[]; tone: string }> = {
  contractors: {
    terms: ['builder', 'tradesman', 'workmanship', 'job', 'quote', 'deposit'],
    tone: 'practical and no-nonsense',
  },
  financial: {
    terms: ['bank', 'lender', 'charges', 'account', 'statement', 'fees'],
    tone: 'authoritative but accessible',
  },
  travel: {
    terms: ['airline', 'carrier', 'booking', 'flight', 'delay', 'compensation'],
    tone: 'empathetic and action-oriented',
  },
  insurance: {
    terms: ['claim', 'policy', 'adjuster', 'denial', 'coverage', 'premium'],
    tone: 'confident and reassuring',
  },
  housing: {
    terms: ['landlord', 'tenant', 'letting agent', 'deposit', 'repairs', 'lease'],
    tone: 'supportive and empowering',
  },
  vehicle: {
    terms: ['dealer', 'garage', 'warranty', 'repair', 'defect', 'mechanic'],
    tone: 'straightforward and fair',
  },
  utilities: {
    terms: ['provider', 'bill', 'meter', 'overcharge', 'tariff', 'service'],
    tone: 'matter-of-fact and helpful',
  },
  ecommerce: {
    terms: ['seller', 'order', 'refund', 'delivery', 'faulty', 'return'],
    tone: 'consumer-focused and practical',
  },
  'damaged-goods': {
    terms: ['product', 'defect', 'quality', 'return', 'refund', 'warranty'],
    tone: 'assertive consumer advocacy',
  },
  refunds: {
    terms: ['refund', 'return', 'money back', 'policy', 'chargeback', 'dispute'],
    tone: 'determined and practical',
  },
  employment: {
    terms: ['employer', 'workplace', 'contract', 'wages', 'dismissal', 'HR'],
    tone: 'professional and supportive',
  },
  healthcare: {
    terms: ['NHS', 'treatment', 'appointment', 'referral', 'complaint', 'care'],
    tone: 'compassionate and clear',
  },
  hoa: {
    terms: ['HOA', 'association', 'fees', 'rules', 'board', 'violation'],
    tone: 'assertive homeowner advocacy',
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

    // Get category-specific context
    const categoryContext = CATEGORY_LANGUAGE[categoryId] || {
      terms: [],
      tone: 'helpful and professional',
    };

    const systemPrompt = `You are a UK-based SEO content strategist and journalist. Your job is to generate article titles that feel HANDCRAFTED and HUMAN—never templated or formulaic.

CRITICAL DIVERSITY RULES:
1. Each title must feel like it was written by a different person
2. NEVER start two titles the same way
3. Vary sentence structures dramatically:
   - Questions: "Why Does Your Claim Keep Failing?"
   - Numbers: "5 Costly Mistakes You're Making"
   - Statements: "What Companies Hope You Don't Know"
   - Action: "Getting Your Money Back After..."
   - Emotional: "Fed Up? Here's What Actually Works"
4. Mix title lengths: some punchy (5-7 words), some descriptive (10-12 words)
5. Use natural language people actually type into Google
6. Include UK-specific references where relevant (Consumer Rights Act, etc.)

ANTI-PATTERN RULES:
- Never repeat the exact template name in titles
- Avoid generic phrasing like "Complete Guide to X"
- Don't use the same power words repeatedly
- Each title should pass the "would a real journalist write this?" test

BAD EXAMPLES (too templated):
- "How to File a Poor Workmanship Complaint Step-by-Step"
- "7 Mistakes That Get Your Claim Rejected"
- "Your Rights: Poor Workmanship - What Contractors Won't Tell You"

GOOD EXAMPLES (diverse & human):
- "What to Do When Your Builder's Work Falls Apart"
- "The 7 Excuses Dodgy Builders Use (And How to Fight Back)"
- "UK Consumer Rights After Shoddy Construction Work"

Output valid JSON only.`;

    const userPrompt = `Generate a diverse content cluster for this complaint letter template:

TEMPLATE: "${templateName}"
CATEGORY: ${categoryId}
${subcategorySlug ? `SUBCATEGORY: ${subcategorySlug}` : ''}

CATEGORY CONTEXT:
- Typical terms: ${categoryContext.terms.join(', ')}
- Tone: ${categoryContext.tone}

Generate ${articleTypesToGenerate.length} unique articles. Each needs a DIFFERENT structure and feel:

${articleTypesToGenerate.map((t, i) => {
  const structureHints = ['question format', 'numbered list', 'bold statement', 'emotional hook', 'how-to style', 'case study angle', 'comparison frame', 'checklist style'];
  return `${i + 1}. ${t.name} (${t.id}) - Try: ${structureHints[i % structureHints.length]}
   Inspiration patterns (don't copy literally): ${t.variations.slice(0, 2).join(', ')}`;
}).join('\n')}

VALIDATION REQUIREMENTS:
- No two titles can share the same first 3 words
- No title can exactly match "${templateName}"
- At least 3 titles should NOT start with "How" or a number
- Include at least one question-format title
- Mix of short (5-7 words) and longer (10-12 words) titles

Return JSON:
{
  "articles": [
    {
      "type": "article-type-id",
      "title": "Unique, human-crafted SEO title",
      "keywords": ["long-tail keyword 1", "natural search phrase 2", "question keyword 3", "action keyword 4", "UK-specific term 5"]
    }
  ]
}`;

    console.log('Generating diverse content plan for:', templateName);

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
        temperature: 0.85, // Higher temperature for more creative variation
        max_tokens: 2500,
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
    let generatedArticles = parsedContent.articles || [];

    // Validate title diversity
    const titleStarts = new Set<string>();
    const validatedArticles = [];
    
    for (const article of generatedArticles) {
      const title = article.title || '';
      const firstThreeWords = title.split(' ').slice(0, 3).join(' ').toLowerCase();
      
      // Skip if duplicate start or matches template name exactly
      if (titleStarts.has(firstThreeWords) || title.toLowerCase() === templateName.toLowerCase()) {
        console.log('Skipping duplicate or template-matching title:', title);
        continue;
      }
      
      titleStarts.add(firstThreeWords);
      validatedArticles.push(article);
    }

    console.log(`Validated ${validatedArticles.length} unique titles from ${generatedArticles.length} generated`);

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
    const queueItems = validatedArticles.map((article: any, index: number) => {
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

    console.log(`Created plan ${plan.id} with ${queuedItems.length} diverse queued articles`);

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
