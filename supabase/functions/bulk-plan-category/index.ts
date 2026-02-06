import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BANNED_TITLE_STARTERS, validateTitle } from "../_shared/contentValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkPlanRequest {
  categoryId: string;
  categoryName: string;
  valueTier: 'high' | 'medium' | 'longtail';
  templates: Array<{
    slug: string;
    name: string;
    subcategorySlug?: string;
  }>;
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
      'US {topic} Laws: Your Rights Under Federal and State Law',
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

const MAX_RETRIES = 2;
const BUFFER_MULTIPLIER = 2;

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
    terms: ['insurance', 'treatment', 'appointment', 'provider', 'complaint', 'care'],
    tone: 'compassionate and clear',
  },
  hoa: {
    terms: ['HOA', 'association', 'fees', 'rules', 'board', 'violation'],
    tone: 'assertive homeowner advocacy',
  },
};

/**
 * Generate content plan for a single template
 * This replicates the core logic from generate-content-plan edge function
 */
async function generatePlanForTemplate(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  template: { slug: string; name: string; subcategorySlug?: string },
  categoryId: string,
  valueTier: 'high' | 'medium' | 'longtail',
  existingTitles: string[],
  seenFirstWords: Set<string>
): Promise<{ success: boolean; error?: string; articlesCreated?: number }> {
  const tierConfig = VALUE_TIER_CONFIGS[valueTier];
  const targetCount = tierConfig.articleCount;
  
  // Check if plan already exists
  const { data: existingPlan } = await supabase
    .from('content_plans')
    .select('id')
    .eq('template_slug', template.slug)
    .single();

  if (existingPlan) {
    return { success: true, articlesCreated: 0 }; // Already exists, skip
  }

  const articleTypesToGenerate = ARTICLE_TYPES
    .filter(t => tierConfig.articleTypes.includes(t.id))
    .slice(0, targetCount);

  const categoryContext = CATEGORY_LANGUAGE[categoryId] || {
    terms: [],
    tone: 'helpful and professional',
  };

  const bannedStartersList = BANNED_TITLE_STARTERS.slice(0, 15).map(s => `- "${s}"`).join('\n');
  const existingTitlesSample = existingTitles.slice(0, 25).map(t => `- ${t}`).join('\n');

  const systemPrompt = `You are a US-based SEO content strategist and journalist. Your job is to generate article titles that feel HANDCRAFTED and HUMAN—never templated or formulaic.

ABSOLUTE BANS - NEVER START TITLES WITH:
${bannedStartersList}
- Any variation of "Fed Up" or "Tired of" or emotional hooks
- "The Ultimate" or "The Complete" or "Everything You Need"
- Questions like "Are you tired...?" or "Have you ever...?"

MANDATORY VARIETY RULES:
1. Each title must feel like it was written by a different person
2. NEVER start two titles with the same first word
3. Vary sentence structures dramatically
4. Mix title lengths: some punchy (5-7 words), some descriptive (10-12 words)
5. Use natural language people actually type into Google
6. Include US-specific references where relevant
7. Maximum 2 titles can end with question marks (?)
8. At least 2 titles must be declarative statements
9. At least 1 title should reference a specific law or regulation

${existingTitlesSample.length > 0 ? `EXISTING TITLES IN DATABASE (do NOT duplicate these patterns or first words):
${existingTitlesSample}
` : ''}
Output valid JSON only.`;

  let validatedArticles: Array<{ type: string; title: string; keywords: string[] }> = [];
  let retryCount = 0;
  const allRejections: { title: string; reason: string }[] = [];

  while (validatedArticles.length < targetCount && retryCount <= MAX_RETRIES) {
    const remaining = targetCount - validatedArticles.length;
    const toGenerate = retryCount === 0 
      ? targetCount * BUFFER_MULTIPLIER 
      : remaining * BUFFER_MULTIPLIER;

    const rejectionFeedback = retryCount > 0 && allRejections.length > 0
      ? `\n\nPREVIOUS REJECTED TITLES (do NOT repeat similar patterns):\n${allRejections.slice(-10).map(r => `- "${r.title}" - ${r.reason}`).join('\n')}\n`
      : '';

    const userPrompt = `Generate a diverse content cluster for this complaint letter template:

TEMPLATE: "${template.name}"
CATEGORY: ${categoryId}
${template.subcategorySlug ? `SUBCATEGORY: ${template.subcategorySlug}` : ''}

CATEGORY CONTEXT:
- Typical terms: ${categoryContext.terms.join(', ')}
- Tone: ${categoryContext.tone}
${rejectionFeedback}
Generate ${toGenerate} unique articles. Each needs a DIFFERENT structure and feel:

${articleTypesToGenerate.map((t, i) => {
    const structureHints = ['question format', 'numbered list', 'bold statement', 'emotional hook', 'how-to style', 'case study angle', 'comparison frame', 'checklist style'];
    return `${i + 1}. ${t.name} (${t.id}) - Try: ${structureHints[i % structureHints.length]}`;
  }).join('\n')}

Return JSON:
{
  "articles": [
    {
      "type": "article-type-id",
      "title": "Unique, human-crafted SEO title",
      "keywords": ["long-tail keyword 1", "natural search phrase 2", "question keyword 3", "action keyword 4", "US consumer rights term 5"]
    }
  ]
}`;

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
        temperature: 0.85 + (retryCount * 0.05),
        max_tokens: 3000,
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

    // Validate each generated article
    for (const article of generatedArticles) {
      if (validatedArticles.length >= targetCount) break;
      
      const title = article.title || '';
      
      // Check against banned starters and existing DB titles
      const validation = validateTitle(title, existingTitles);
      if (!validation.isValid) {
        allRejections.push({ title, reason: validation.reason || 'banned pattern' });
        continue;
      }
      
      // Check first 2 words against batch
      const titleWords = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 0);
      const firstTwo = titleWords.slice(0, 2).join(' ');
      
      if (seenFirstWords.has(firstTwo) && firstTwo.length > 3) {
        allRejections.push({ title, reason: 'duplicates first words of another title' });
        continue;
      }
      
      // Check if title matches template name exactly
      if (title.toLowerCase() === template.name.toLowerCase()) {
        allRejections.push({ title, reason: 'identical to template name' });
        continue;
      }
      
      // Valid! Add to results
      seenFirstWords.add(firstTwo);
      existingTitles.push(title);
      validatedArticles.push({
        type: article.type,
        title: title,
        keywords: article.keywords || [],
      });
    }
    
    retryCount++;
  }

  if (validatedArticles.length === 0) {
    throw new Error('Failed to generate any valid titles after retries');
  }

  // Create the content plan
  const { data: newPlan, error: planError } = await supabase
    .from('content_plans')
    .insert({
      template_slug: template.slug,
      template_name: template.name,
      category_id: categoryId,
      subcategory_slug: template.subcategorySlug || null,
      value_tier: valueTier,
      target_article_count: targetCount,
    })
    .select()
    .single();

  if (planError) {
    throw new Error(`Failed to create plan: ${planError.message}`);
  }

  // Create queue items
  const queueItems = validatedArticles.map((article, index) => ({
    plan_id: newPlan.id,
    article_type: article.type,
    suggested_title: article.title,
    suggested_keywords: article.keywords,
    priority: 50 - index,
    status: 'queued',
  }));

  const { error: queueError } = await supabase
    .from('content_queue')
    .insert(queueItems);

  if (queueError) {
    throw new Error(`Failed to create queue items: ${queueError.message}`);
  }

  return { success: true, articlesCreated: validatedArticles.length };
}

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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service role client for background updates
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { data: isAdmin } = await supabaseUser.rpc('is_admin', { check_user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { categoryId, categoryName, valueTier, templates } = await req.json() as BulkPlanRequest;

    if (!categoryId || !valueTier || !templates?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Create job record immediately
    const { data: job, error: jobError } = await supabaseAdmin
      .from('bulk_planning_jobs')
      .insert({
        category_id: categoryId,
        category_name: categoryName,
        value_tier: valueTier,
        total_templates: templates.length,
        completed_templates: 0,
        failed_templates: 0,
        status: 'processing',
        template_slugs: templates.map(t => t.slug),
        processed_slugs: [],
        failed_slugs: [],
        error_messages: {},
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    console.log(`[BULK-PLAN] Job ${job.id} created for ${templates.length} templates in ${categoryName}`);

    // Return immediately with job ID - processing continues in background
    const responsePromise = new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      status: 'processing',
      total: templates.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    // Start background processing using waitUntil pattern
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Background processing (runs after response is sent)
    (async () => {
      try {
        // Fetch existing blog post titles for deduplication
        const { data: existingPosts } = await supabaseAdmin
          .from('blog_posts')
          .select('title')
          .limit(500);

        const existingTitles = existingPosts?.map(p => p.title) || [];
        const seenFirstWords = new Set<string>();

        // Pre-populate seen first words
        for (const existing of existingTitles) {
          const words = existing.toLowerCase().split(/\s+/).filter((w: string) => w.length > 0);
          if (words.length >= 2) {
            seenFirstWords.add(words.slice(0, 2).join(' '));
          }
        }

        let completedCount = 0;
        let failedCount = 0;
        const processedSlugs: string[] = [];
        const failedSlugs: string[] = [];
        const errorMessages: Record<string, string> = {};

        for (const template of templates) {
          try {
            console.log(`[BULK-PLAN] Processing ${template.slug} (${completedCount + 1}/${templates.length})`);
            
            const result = await generatePlanForTemplate(
              supabaseAdmin,
              apiKey,
              template,
              categoryId,
              valueTier,
              existingTitles,
              seenFirstWords
            );

            if (result.success) {
              completedCount++;
              processedSlugs.push(template.slug);
              console.log(`[BULK-PLAN] ✓ ${template.slug} - ${result.articlesCreated} articles queued`);
            }
          } catch (error) {
            failedCount++;
            failedSlugs.push(template.slug);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errorMessages[template.slug] = errorMsg;
            console.error(`[BULK-PLAN] ✗ ${template.slug} - ${errorMsg}`);
          }

          // Update job progress after each template
          await supabaseAdmin
            .from('bulk_planning_jobs')
            .update({
              completed_templates: completedCount,
              failed_templates: failedCount,
              processed_slugs: processedSlugs,
              failed_slugs: failedSlugs,
              error_messages: errorMessages,
            })
            .eq('id', job.id);
        }

        // Mark job complete
        await supabaseAdmin
          .from('bulk_planning_jobs')
          .update({
            status: failedCount === templates.length ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            completed_templates: completedCount,
            failed_templates: failedCount,
            processed_slugs: processedSlugs,
            failed_slugs: failedSlugs,
            error_messages: errorMessages,
          })
          .eq('id', job.id);

        console.log(`[BULK-PLAN] Job ${job.id} completed: ${completedCount} success, ${failedCount} failed`);
      } catch (error) {
        console.error(`[BULK-PLAN] Job ${job.id} fatal error:`, error);
        await supabaseAdmin
          .from('bulk_planning_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_messages: { '_fatal': error instanceof Error ? error.message : 'Unknown error' },
          })
          .eq('id', job.id);
      }
    })();

    return responsePromise;
  } catch (error) {
    console.error('Error in bulk-plan-category:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
