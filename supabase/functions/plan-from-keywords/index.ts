import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VERTICAL_TO_CATEGORY: Record<string, string> = {
  'insurance': 'insurance',
  'healthcare': 'healthcare',
  'employment': 'employment',
  'financial': 'financial',
  'housing': 'housing',
  'hoa': 'hoa',
  'contractors': 'contractors',
  'vehicle': 'vehicle',
  'utilities': 'utilities',
  'travel': 'travel',
  'refunds': 'refunds',
  'damaged-goods': 'damaged-goods',
  'ecommerce': 'ecommerce',
  'consumer-rights': 'consumer-rights',
  'damaged goods': 'damaged-goods',
  'e-commerce': 'ecommerce',
};

const CATEGORY_TO_BLOG: Record<string, { slug: string; name: string }> = {
  'refunds': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'damaged-goods': { slug: 'consumer-rights', name: 'Consumer Rights' },
  'ecommerce': { slug: 'ecommerce', name: 'E-commerce & Online Services' },
  'housing': { slug: 'housing', name: 'Landlord & Housing' },
  'hoa': { slug: 'hoa', name: 'Neighbor & HOA Disputes' },
  'contractors': { slug: 'contractors', name: 'Contractors' },
  'financial': { slug: 'financial', name: 'Financial Services' },
  'insurance': { slug: 'insurance', name: 'Insurance Claims' },
  'employment': { slug: 'employment', name: 'Employment & Workplace' },
  'travel': { slug: 'travel', name: 'Travel & Transportation' },
  'vehicle': { slug: 'vehicle', name: 'Vehicle & Auto' },
  'utilities': { slug: 'utilities', name: 'Utilities & Telecommunications' },
  'healthcare': { slug: 'healthcare', name: 'Healthcare & Medical Billing' },
  'consumer-rights': { slug: 'consumer-rights', name: 'Consumer Rights' },
};

const VALID_ARTICLE_TYPES = ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'] as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const { vertical, allVerticals, jobId } = await req.json() as {
      vertical?: string;
      allVerticals?: boolean;
      jobId?: string;
    };

    // If resuming an existing job, load it
    if (jobId) {
      return await processNextVertical(supabase, apiKey, supabaseUrl, serviceRoleKey, jobId);
    }

    // Determine verticals to process
    let verticalsToProcess: string[] = [];

    if (allVerticals) {
      const { data: verticalData } = await supabase
        .from('keyword_targets')
        .select('vertical')
        .is('used_in_queue_id', null);

      if (verticalData) {
        verticalsToProcess = [...new Set(verticalData.map((d: any) => d.vertical))].sort();
      }
    } else if (vertical) {
      verticalsToProcess = [vertical];
    } else {
      throw new Error('Must specify vertical or allVerticals');
    }

    if (verticalsToProcess.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No unused keywords found', totalPlanned: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a planning job for tracking
    const { data: job, error: jobError } = await supabase
      .from('keyword_planning_jobs')
      .insert({
        verticals: verticalsToProcess,
        current_vertical_index: 0,
        status: 'processing',
      })
      .select()
      .single();

    if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

    // Process the first vertical inline
    const result = await processOneVertical(supabase, apiKey, job.id, verticalsToProcess[0]);

    // Update job progress
    const nextIndex = 1;
    const isComplete = nextIndex >= verticalsToProcess.length;

    await supabase
      .from('keyword_planning_jobs')
      .update({
        current_vertical_index: nextIndex,
        completed_verticals: result.success ? [verticalsToProcess[0]] : [],
        failed_verticals: result.success ? [] : [verticalsToProcess[0]],
        total_planned: result.planned,
        vertical_results: { [verticalsToProcess[0]]: result },
        status: isComplete ? 'completed' : 'processing',
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Self-chain for next vertical
    if (!isComplete) {
      chainNext(supabaseUrl, serviceRoleKey, job.id);
    }

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      totalPlanned: result.planned,
      message: isComplete
        ? `Completed planning for all verticals`
        : `Processing vertical 1/${verticalsToProcess.length}. Job will continue in background.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plan-from-keywords:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processNextVertical(
  supabase: any,
  apiKey: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  jobId: string,
) {
  // Load job
  const { data: job, error: jobError } = await supabase
    .from('keyword_planning_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ success: false, error: 'Job not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (job.status !== 'processing') {
    return new Response(JSON.stringify({ success: true, message: 'Job already completed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const idx = job.current_vertical_index;
  if (idx >= job.verticals.length) {
    await supabase
      .from('keyword_planning_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', jobId);
    return new Response(JSON.stringify({ success: true, message: 'All verticals completed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const vert = job.verticals[idx];
  console.log(`[PLAN] Processing vertical ${idx + 1}/${job.verticals.length}: ${vert}`);

  const result = await processOneVertical(supabase, apiKey, jobId, vert);

  const nextIndex = idx + 1;
  const isComplete = nextIndex >= job.verticals.length;
  const completedVerticals = [...(job.completed_verticals || [])];
  const failedVerticals = [...(job.failed_verticals || [])];
  if (result.success) completedVerticals.push(vert);
  else failedVerticals.push(vert);

  const verticalResults = { ...(job.vertical_results || {}), [vert]: result };

  await supabase
    .from('keyword_planning_jobs')
    .update({
      current_vertical_index: nextIndex,
      completed_verticals: completedVerticals,
      failed_verticals: failedVerticals,
      total_planned: (job.total_planned || 0) + result.planned,
      vertical_results: verticalResults,
      status: isComplete ? 'completed' : 'processing',
      completed_at: isComplete ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (!isComplete) {
    chainNext(supabaseUrl, serviceRoleKey, jobId);
  }

  return new Response(JSON.stringify({
    success: true,
    jobId,
    vertical: vert,
    planned: result.planned,
    progress: `${nextIndex}/${job.verticals.length}`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function chainNext(supabaseUrl: string, serviceRoleKey: string, jobId: string) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000);

  fetch(`${supabaseUrl}/functions/v1/plan-from-keywords`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId }),
    signal: controller.signal,
  }).catch(() => {
    // Fire-and-forget: timeout or abort is expected
  });
}

async function processOneVertical(
  supabase: any,
  apiKey: string,
  jobId: string,
  vert: string,
): Promise<{ success: boolean; planned: number; pillars: number; clusters: number; error?: string }> {
  try {
    const categoryId = VERTICAL_TO_CATEGORY[vert.toLowerCase()] || vert.toLowerCase();

    const { data: seedKeywords } = await supabase
      .from('keyword_targets')
      .select('*')
      .eq('vertical', vert)
      .eq('is_seed', true)
      .is('used_in_queue_id', null)
      .order('priority', { ascending: false });

    if (!seedKeywords || seedKeywords.length === 0) {
      console.log(`[PLAN] No unused seeds for ${vert}, skipping`);
      return { success: true, planned: 0, pillars: 0, clusters: 0 };
    }

    const { data: variationKeywords } = await supabase
      .from('keyword_targets')
      .select('*')
      .eq('vertical', vert)
      .eq('is_seed', false)
      .is('used_in_queue_id', null)
      .order('priority', { ascending: false });

    const variationsByGroup: Record<string, any[]> = {};
    for (const v of (variationKeywords || [])) {
      const group = v.column_group || 'ungrouped';
      if (!variationsByGroup[group]) variationsByGroup[group] = [];
      variationsByGroup[group].push(v);
    }

    const keywordContext = seedKeywords.map((seed: any) => {
      const variations = variationsByGroup[seed.column_group || seed.keyword] || [];
      return `SEED: "${seed.keyword}" (${seed.column_group || 'standalone'})\n  Variations: ${variations.map((v: any) => `"${v.keyword}"`).join(', ') || 'none'}`;
    }).join('\n\n');

    const prompt = `You are an SEO content strategist. Given the following seed keywords and their variations for the "${vert}" vertical, create a content plan with pillar and cluster articles.

SEED KEYWORDS AND VARIATIONS:
${keywordContext}

RULES:
1. Each seed keyword becomes a PILLAR article - a comprehensive guide (2000-3000 words)
2. For each pillar, create 3-6 CLUSTER articles from its variations (long-tail focused)
3. Each article needs:
   - title: Compelling, SEO-optimized title targeting the keyword
   - article_type: One of: ${VALID_ARTICLE_TYPES.join(', ')}
   - primary_keyword: The main keyword to target (must be from the provided list)
   - secondary_keywords: 3-5 related keywords from the variations list
   - meta_title: 50-60 characters, include primary keyword
   - meta_description: 150-160 characters, compelling with keyword
4. Pillar titles should be comprehensive ("Complete Guide to...", "Everything About...")
5. Cluster titles should be specific and long-tail focused
6. Use American English
7. Titles must NOT start with: "Understanding", "Navigating", "Mastering", "Demystifying", "Unlocking"

Respond with ONLY valid JSON:
{
  "pillars": [
    {
      "seed_keyword": "the original seed keyword",
      "title": "Pillar article title",
      "article_type": "how-to",
      "primary_keyword": "main keyword",
      "secondary_keywords": ["kw1", "kw2", "kw3"],
      "meta_title": "SEO title under 60 chars",
      "meta_description": "Meta description under 160 chars",
      "clusters": [
        {
          "variation_keyword": "the variation keyword used",
          "title": "Cluster article title",
          "article_type": "faq",
          "primary_keyword": "variation keyword",
          "secondary_keywords": ["kw1", "kw2"],
          "meta_title": "SEO title",
          "meta_description": "Meta description"
        }
      ]
    }
  ]
}`;

    console.log(`[PLAN] Calling AI for ${vert} with ${seedKeywords.length} seeds, ${variationKeywords?.length || 0} variations`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[PLAN] AI error for ${vert}: ${response.status} - ${errText}`);
      return { success: false, planned: 0, pillars: 0, clusters: 0, error: `AI error: ${response.status}` };
    }

    const aiData = await response.json();
    let content = aiData.choices[0]?.message?.content || '';

    content = content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    content = content.trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        plan = JSON.parse(match[0]);
      } else {
        console.error(`[PLAN] Failed to parse AI response for ${vert}`);
        return { success: false, planned: 0, pillars: 0, clusters: 0, error: 'Failed to parse AI response' };
      }
    }

    if (!plan.pillars || !Array.isArray(plan.pillars)) {
      return { success: false, planned: 0, pillars: 0, clusters: 0, error: 'Invalid plan structure' };
    }

    let pillarCount = 0;
    let clusterCount = 0;

    for (const pillar of plan.pillars) {
      const templateSlug = `${categoryId}-keyword-${pillar.seed_keyword?.replace(/\s+/g, '-').toLowerCase().slice(0, 40) || 'unknown'}`;

      const { data: contentPlan, error: planError } = await supabase
        .from('content_plans')
        .insert({
          template_slug: templateSlug,
          template_name: pillar.seed_keyword || templateSlug,
          category_id: categoryId,
          value_tier: 'high',
          target_article_count: 1 + (pillar.clusters?.length || 0),
        })
        .select()
        .single();

      if (planError) {
        console.error(`[PLAN] Failed to create content plan: ${planError.message}`);
        continue;
      }

      const { data: pillarQueueItem, error: pillarError } = await supabase
        .from('content_queue')
        .insert({
          plan_id: contentPlan.id,
          article_type: 'pillar',
          suggested_title: pillar.title,
          suggested_keywords: pillar.secondary_keywords || [],
          primary_keyword: pillar.primary_keyword,
          secondary_keywords: pillar.secondary_keywords || [],
          meta_title: pillar.meta_title,
          meta_description: pillar.meta_description,
          priority: 1,
          status: 'queued',
        })
        .select('id')
        .single();

      if (pillarError) {
        console.error(`[PLAN] Failed to create pillar queue item: ${pillarError.message}`);
        continue;
      }

      if (pillar.seed_keyword) {
        await supabase
          .from('keyword_targets')
          .update({ used_in_queue_id: pillarQueueItem.id })
          .eq('vertical', vert)
          .eq('keyword', pillar.seed_keyword.toLowerCase());
      }

      pillarCount++;

      for (const cluster of (pillar.clusters || [])) {
        const clusterType = VALID_ARTICLE_TYPES.includes(cluster.article_type) ? cluster.article_type : 'faq';

        const { data: clusterQueueItem, error: clusterError } = await supabase
          .from('content_queue')
          .insert({
            plan_id: contentPlan.id,
            article_type: clusterType,
            suggested_title: cluster.title,
            suggested_keywords: cluster.secondary_keywords || [],
            primary_keyword: cluster.primary_keyword,
            secondary_keywords: cluster.secondary_keywords || [],
            meta_title: cluster.meta_title,
            meta_description: cluster.meta_description,
            priority: 50,
            status: 'queued',
          })
          .select('id')
          .single();

        if (clusterError) {
          console.error(`[PLAN] Failed to create cluster: ${clusterError.message}`);
          continue;
        }

        if (cluster.variation_keyword) {
          await supabase
            .from('keyword_targets')
            .update({ used_in_queue_id: clusterQueueItem.id })
            .eq('vertical', vert)
            .eq('keyword', cluster.variation_keyword.toLowerCase());
        }

        clusterCount++;
      }
    }

    console.log(`[PLAN] ${vert}: ${pillarCount} pillars, ${clusterCount} clusters`);
    return { success: true, planned: pillarCount + clusterCount, pillars: pillarCount, clusters: clusterCount };

  } catch (error) {
    console.error(`[PLAN] Error processing ${vert}:`, error);
    return { success: false, planned: 0, pillars: 0, clusters: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
