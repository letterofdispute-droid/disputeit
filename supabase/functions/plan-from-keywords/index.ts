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

const VALID_ARTICLE_TYPES = ['how-to', 'mistakes', 'rights', 'sample', 'faq', 'case-study', 'comparison', 'checklist'] as const;

// Max keywords per AI call to stay within token limits
const MAX_KEYWORDS_PER_BATCH = 50;

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
      const { data: verticalData } = await supabase.rpc('get_unused_keyword_verticals');
      verticalsToProcess = (verticalData || []).map((d: any) => d.vertical);
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

// ============================================
// JOB CHAINING
// ============================================

async function processNextVertical(
  supabase: any,
  apiKey: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  jobId: string,
) {
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

// ============================================
// CORE: Process one vertical with smart intent clustering
// ============================================

interface VerticalResult {
  success: boolean;
  planned: number;
  pillars: number;
  clusters: number;
  error?: string;
}

async function processOneVertical(
  supabase: any,
  apiKey: string,
  jobId: string,
  vert: string,
): Promise<VerticalResult> {
  try {
    const categoryId = VERTICAL_TO_CATEGORY[vert.toLowerCase()] || vert.toLowerCase();

    // Fetch ALL unused keywords for this vertical (seeds + variations)
    const { data: allKeywords } = await supabase
      .from('keyword_targets')
      .select('*')
      .eq('vertical', vert)
      .is('used_in_queue_id', null)
      .order('priority', { ascending: false })
      .limit(2000);

    if (!allKeywords || allKeywords.length === 0) {
      console.log(`[PLAN] No unused keywords for ${vert}, skipping`);
      return { success: true, planned: 0, pillars: 0, clusters: 0 };
    }

    // Group keywords by column_group
    const groupedKeywords: Record<string, any[]> = {};
    for (const kw of allKeywords) {
      const group = kw.column_group || 'ungrouped';
      if (!groupedKeywords[group]) groupedKeywords[group] = [];
      groupedKeywords[group].push(kw);
    }

    const groupNames = Object.keys(groupedKeywords);
    console.log(`[PLAN] ${vert}: ${allKeywords.length} keywords across ${groupNames.length} groups`);

    let totalPillars = 0;
    let totalClusters = 0;

    // Process each column_group separately
    for (const groupName of groupNames) {
      const keywords = groupedKeywords[groupName];
      console.log(`[PLAN] Processing group "${groupName}" with ${keywords.length} keywords`);

      try {
        const result = await processColumnGroup(
          supabase, apiKey, vert, categoryId, groupName, keywords
        );
        totalPillars += result.pillars;
        totalClusters += result.clusters;
      } catch (err) {
        console.error(`[PLAN] Error processing group "${groupName}":`, err);
        // Continue with other groups
      }
    }

    console.log(`[PLAN] ${vert}: ${totalPillars} pillars, ${totalClusters} clusters`);
    return { success: true, planned: totalPillars + totalClusters, pillars: totalPillars, clusters: totalClusters };

  } catch (error) {
    console.error(`[PLAN] Error processing ${vert}:`, error);
    return { success: false, planned: 0, pillars: 0, clusters: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// Process a single column_group with AI intent clustering
// ============================================

async function processColumnGroup(
  supabase: any,
  apiKey: string,
  vert: string,
  categoryId: string,
  groupName: string,
  keywords: any[],
): Promise<{ pillars: number; clusters: number }> {
  // For large groups, batch keywords to stay within token limits
  // First batch always includes all keywords for pillar designation
  // But we cap at MAX_KEYWORDS_PER_BATCH per AI call
  const keywordTexts = keywords.map((kw: any) => kw.keyword);

  let pillarQueueId: string | null = null;
  let pillarTitle: string | null = null;
  let totalPillars = 0;
  let totalClusters = 0;

  // Split into batches if needed
  const batches: string[][] = [];
  for (let i = 0; i < keywordTexts.length; i += MAX_KEYWORDS_PER_BATCH) {
    batches.push(keywordTexts.slice(i, i + MAX_KEYWORDS_PER_BATCH));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const isFirstBatch = batchIdx === 0;

    const prompt = buildClusteringPrompt(vert, groupName, batch, isFirstBatch, pillarTitle);

    console.log(`[PLAN] AI call for "${groupName}" batch ${batchIdx + 1}/${batches.length} (${batch.length} keywords)`);

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
      console.error(`[PLAN] AI error for ${groupName}: ${response.status} - ${errText}`);
      continue;
    }

    const aiData = await response.json();
    let content = aiData.choices[0]?.message?.content || '';
    content = cleanJsonResponse(content);

    let plan;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        plan = JSON.parse(match[0]);
      } else {
        console.error(`[PLAN] Failed to parse AI response for ${groupName}`);
        continue;
      }
    }

    // Create content_plan for this group (once)
    const templateSlug = `${categoryId}-kw-${groupName.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`;

    const { data: contentPlan, error: planError } = await supabase
      .from('content_plans')
      .upsert({
        template_slug: templateSlug,
        template_name: groupName,
        category_id: categoryId,
        value_tier: 'high',
        target_article_count: (plan.pillar ? 1 : 0) + (plan.clusters?.length || 0),
      }, { onConflict: 'template_slug' })
      .select()
      .single();

    if (planError) {
      console.error(`[PLAN] Failed to create content plan: ${planError.message}`);
      continue;
    }

    // Insert pillar (only on first batch)
    if (isFirstBatch && plan.pillar) {
      const pillarType = VALID_ARTICLE_TYPES.includes(plan.pillar.article_type)
        ? plan.pillar.article_type : 'how-to';

      const { data: pillarItem, error: pillarError } = await supabase
        .from('content_queue')
        .insert({
          plan_id: contentPlan.id,
          article_type: pillarType,
          suggested_title: plan.pillar.title,
          suggested_keywords: plan.pillar.secondary_keywords || [],
          primary_keyword: plan.pillar.primary_keyword,
          secondary_keywords: plan.pillar.secondary_keywords || [],
          meta_title: plan.pillar.meta_title,
          meta_description: plan.pillar.meta_description,
          priority: 1,
          status: 'queued',
          parent_queue_id: null,
        })
        .select('id')
        .single();

      if (pillarError) {
        console.error(`[PLAN] Failed to create pillar: ${pillarError.message}`);
      } else {
        pillarQueueId = pillarItem.id;
        pillarTitle = plan.pillar.title;
        totalPillars++;

        // Mark all targeted keywords as used
        await markKeywordsUsed(supabase, vert, plan.pillar.all_targeted_keywords || [plan.pillar.primary_keyword], pillarItem.id);
      }
    }

    // Insert clusters
    for (const cluster of (plan.clusters || [])) {
      const clusterType = VALID_ARTICLE_TYPES.includes(cluster.article_type)
        ? cluster.article_type : 'faq';

      const { data: clusterItem, error: clusterError } = await supabase
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
          parent_queue_id: pillarQueueId,
          pillar_link_anchor: cluster.link_to_pillar_anchor || null,
        })
        .select('id')
        .single();

      if (clusterError) {
        console.error(`[PLAN] Failed to create cluster: ${clusterError.message}`);
        continue;
      }

      // Mark all targeted keywords as used
      await markKeywordsUsed(supabase, vert, cluster.all_targeted_keywords || [cluster.primary_keyword], clusterItem.id);
      totalClusters++;
    }
  }

  return { pillars: totalPillars, clusters: totalClusters };
}

// ============================================
// AI PROMPT BUILDER
// ============================================

function buildClusteringPrompt(
  vertical: string,
  groupName: string,
  keywords: string[],
  includePillar: boolean,
  existingPillarTitle: string | null,
): string {
  const keywordList = keywords.map((kw, i) => `${i + 1}. "${kw}"`).join('\n');

  const pillarInstruction = includePillar
    ? `Create ONE PILLAR article (the broadest, most comprehensive topic covering "${groupName}") and multiple CLUSTER articles.
The pillar should be "how-to" or "rights" type (2000-3000 word comprehensive guide).`
    : `The PILLAR article already exists: "${existingPillarTitle}". Create only CLUSTER articles from these keywords.
Each cluster should reference the pillar via link_to_pillar_anchor.`;

  return `You are an expert SEO content strategist. Given these ${keywords.length} keywords for the "${groupName}" topic in the "${vertical}" vertical, create a content cluster by grouping them by SEARCH INTENT.

KEYWORDS:
${keywordList}

RULES:
1. Group keywords by SEARCH INTENT — keywords asking the same question in different ways belong to the SAME article
2. ${pillarInstruction}
3. Each article should target 3-8 keywords (primary + secondaries). If a group has fewer keywords, 1-3 is acceptable.
4. EVERY keyword above must be assigned to exactly ONE article's all_targeted_keywords array. Do NOT skip any.
5. Clusters must link UP to the pillar. Use link_to_pillar_anchor for the suggested anchor text (2-6 natural words).
6. Article types: how-to, mistakes, rights, sample, faq, case-study, comparison, checklist
7. Titles must NOT start with: "Understanding", "Navigating", "Mastering", "Demystifying", "Unlocking"
8. Use American English

Respond with ONLY valid JSON:
{
  ${includePillar ? `"pillar": {
    "title": "Comprehensive pillar title",
    "article_type": "how-to",
    "primary_keyword": "broadest keyword from list",
    "secondary_keywords": ["kw1", "kw2", "kw3"],
    "all_targeted_keywords": ["every keyword this article targets"],
    "meta_title": "under 60 chars with primary keyword",
    "meta_description": "under 160 chars, compelling"
  },` : ''}
  "clusters": [
    {
      "title": "Specific cluster title",
      "article_type": "faq",
      "primary_keyword": "most specific keyword",
      "secondary_keywords": ["kw1", "kw2"],
      "all_targeted_keywords": ["every keyword this cluster targets"],
      "meta_title": "under 60 chars",
      "meta_description": "under 160 chars",
      "link_to_pillar_anchor": "2-6 word anchor text for pillar link"
    }
  ]
}`;
}

// ============================================
// HELPERS
// ============================================

function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

async function markKeywordsUsed(
  supabase: any,
  vertical: string,
  keywords: string[],
  queueItemId: string,
) {
  if (!keywords || keywords.length === 0) return;

  // Batch update in chunks of 20 to avoid URL length issues
  const normalizedKeywords = keywords.map(k => k.toLowerCase());
  for (let i = 0; i < normalizedKeywords.length; i += 20) {
    const chunk = normalizedKeywords.slice(i, i + 20);
    await supabase
      .from('keyword_targets')
      .update({ used_in_queue_id: queueItemId })
      .eq('vertical', vertical)
      .in('keyword', chunk)
      .is('used_in_queue_id', null);
  }
}
