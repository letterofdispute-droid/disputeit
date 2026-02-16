import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Constants ──
const BATCH_SIZE = 5; // Process 5 articles concurrently per invocation
const ARTICLE_TIMEOUT_MS = 45_000; // 45s per article (AI call takes longer)
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// ── Types ──
interface SmartScanRequest {
  jobId?: string;
  categorySlug?: string;
  maxLinksPerArticle?: number;
}

interface AISuggestion {
  anchor_text: string;
  target_index: number;
  section_heading: string;
  reasoning: string;
  confidence?: number;
  mode?: 'existing' | 'generated';
  generated_sentence?: string;
}

interface ParsedSection {
  heading: string | null;
  text: string;
  isIntro: boolean;
  isConclusion: boolean;
}

interface CandidateTarget {
  index: number;
  role: string; // pillar | template | article
  title: string;
  slug: string;
  embeddingId: string;
  contentType: string;
}

// ── Helpers ──

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

async function selfChainWithRetry(body: object): Promise<void> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scan-for-smart-links`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
      clearTimeout(timeout);
      console.log(`[SMART-CHAIN] Attempt ${attempt}: status ${res.status}`);
      try { await res.text(); } catch (_) { /* drain */ }
      if (res.ok || res.status === 504) return;
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('abort')) {
        console.log('[SMART-CHAIN] Fire-and-forget OK (AbortError)');
        return;
      }
      console.warn(`[SMART-CHAIN] Attempt ${attempt} failed:`, msg);
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('[SMART-CHAIN] Both attempts failed - pg_cron will recover');
}

async function verifyAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: claims, error } = await anonClient.auth.getClaims(token);
  if (error || !claims?.claims?.sub) return null;

  const userId = claims.claims.sub as string;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { check_user_id: userId });
  return isAdmin ? userId : null;
}

// ── Content parsing ──

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArticleIntoSections(htmlContent: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Split by H2 and H3 headings
  const parts = htmlContent.split(/<h[23][^>]*>(.*?)<\/h[23]>/gi);
  
  // First part is intro (before any heading)
  if (parts[0] && parts[0].trim()) {
    const text = stripHtml(parts[0]);
    if (text.length > 20) {
      sections.push({ heading: null, text, isIntro: true, isConclusion: false });
    }
  }
  
  // Process heading + content pairs
  for (let i = 1; i < parts.length; i += 2) {
    const heading = stripHtml(parts[i] || '');
    const content = parts[i + 1] ? stripHtml(parts[i + 1]) : '';
    
    if (!content || content.length < 20) continue;
    
    const isConclusion = /conclusion|summary|final\s+thoughts|wrapping\s+up|in\s+closing|key\s+takeaway/i.test(heading);
    
    sections.push({ heading, text: content, isIntro: false, isConclusion });
  }
  
  return sections;
}

function extractHeadings(htmlContent: string): string[] {
  const headings: string[] = [];
  const regex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    headings.push(stripHtml(match[1]));
  }
  return headings;
}

// ── AI call ──

async function callAI(
  articleTitle: string,
  articleRole: string,
  categorySlug: string,
  pillarInfo: { title: string; slug: string } | null,
  sections: ParsedSection[],
  candidates: CandidateTarget[],
): Promise<AISuggestion[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  // Build sections text (exclude intro and conclusion)
  const bodyText = sections
    .filter(s => !s.isIntro && !s.isConclusion)
    .map(s => {
      const label = s.heading ? `[Section: "${s.heading}"]` : '[Section]';
      return `${label}\n${s.text}`;
    })
    .join('\n\n');

  // Build candidate list
  const candidateList = candidates
    .map(c => `${c.index}. [${c.role}] "${c.title}" (slug: ${c.slug})`)
    .join('\n');

  const systemPrompt = `You are an internal linking specialist for a consumer rights blog. Analyze the article body text and find 12-15 link opportunities to the candidate targets below.

You have TWO strategies:

**Strategy A - Existing Phrase (preferred):**
Find a 2-6 word phrase that already exists VERBATIM in the article body text that naturally relates to a target article.

**Strategy B - Generated Sentence (fallback):**
When no good verbatim phrase exists for an important target, write ONE short natural sentence (15-30 words) that continues a relevant paragraph's topic. The sentence must contain a 2-5 word anchor phrase related to the target. The sentence must feel like the original author wrote it - same tone, same topic flow.

STRICT RULES:
1. For "existing" mode: anchor MUST appear VERBATIM in the body text below
2. For "generated" mode: the generated_sentence MUST contain the anchor_text exactly as written
3. NEVER use text from H2/H3 headings or the first paragraph as anchors
4. Distribute links across different sections - max 2 links per section
5. Each target can only be linked once
6. Anchors must NOT be the target's exact title or start with the same first 4+ words
7. Prefer Strategy A when possible. Use Strategy B for important targets (pillars, templates) where no verbatim match exists
8. Anchors must be SPECIFIC - avoid vague 2-word phrases like "insurance coverage"
9. Return a "confidence" score (1-100) for how well the anchor matches the specific target
10. For "generated" mode, do NOT use generic phrases like "learn more", "check out", "see our guide", "explore our", "read about", "for more details"
11. Return ONLY valid JSON - no markdown, no explanation

Return a JSON array:
[
  {"anchor_text":"exact phrase from body","target_index":1,"section_heading":"section name","reasoning":"brief reason","confidence":85,"mode":"existing"},
  {"anchor_text":"specific anchor phrase","target_index":3,"section_heading":"section name","reasoning":"brief reason","confidence":80,"mode":"generated","generated_sentence":"One natural continuation sentence with the anchor phrase embedded naturally."}
]`;

  const userPrompt = `Article Title: "${articleTitle}"
Article Role: ${articleRole}
Category: ${categorySlug}
${pillarInfo ? `Pillar Article: "${pillarInfo.title}" (slug: ${pillarInfo.slug})` : 'No pillar article identified'}

--- ARTICLE BODY (sections, excluding intro & conclusion) ---
${bodyText}

--- CANDIDATE TARGETS (link to these) ---
${candidateList}

Find 12-15 link opportunities using BOTH strategies. Use "existing" mode when a good verbatim phrase exists, and "generated" mode when you need to create a sentence for an important target. ${articleRole === 'cluster' && pillarInfo ? 'IMPORTANT: You MUST include at least 1 link to the pillar article (marked above).' : ''}`;

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT: AI rate limited, will retry');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED: AI credits exhausted');
    throw new Error(`AI gateway error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed as AISuggestion[];
  } catch {
    console.error('[SMART-SCAN] Failed to parse AI response:', jsonStr.slice(0, 300));
    return [];
  }
}

// ── Validation ──

function validateSuggestion(
  suggestion: AISuggestion,
  bodyTextLower: string,
  headings: string[],
  introText: string,
  articleTitle: string,
  candidates: CandidateTarget[],
  usedTargets: Set<number>,
): boolean {
  const anchor = suggestion.anchor_text?.trim();
  if (!anchor) return false;

  const isGenerated = suggestion.mode === 'generated';

  // Word count check (2-6 words)
  const words = anchor.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;

  // Char length check (8-60)
  if (anchor.length < 8 || anchor.length > 60) return false;

  // Target index valid and not already used
  if (!suggestion.target_index || suggestion.target_index < 1 || suggestion.target_index > candidates.length) return false;
  if (usedTargets.has(suggestion.target_index)) return false;

  const target = candidates[suggestion.target_index - 1];

  // Not a title prefix
  const anchorLower = anchor.toLowerCase();
  if (target.title.toLowerCase().startsWith(anchorLower)) return false;
  if (articleTitle.toLowerCase().startsWith(anchorLower)) return false;

  if (isGenerated) {
    // For generated mode: validate that generated_sentence contains the anchor
    if (!suggestion.generated_sentence) return false;
    if (!suggestion.generated_sentence.includes(anchor)) return false;
    // generated_sentence should be reasonable length (15-80 words)
    const sentenceWords = suggestion.generated_sentence.split(/\s+/).length;
    if (sentenceWords < 8 || sentenceWords > 80) return false;
  } else {
    // For existing mode: anchor must exist in body text (not just in headings or intro)
    if (!bodyTextLower.includes(anchorLower)) return false;

    // Not in any heading
    const inHeading = headings.some(h => h.toLowerCase().includes(anchorLower));
    if (inHeading) return false;

    // Not in intro paragraph
    if (introText.toLowerCase().includes(anchorLower)) return false;
  }

  // Reject anchors composed entirely of generic/vague words
  const GENERIC_WORDS = new Set(['insurance','dispute','complaint','repair','service','services',
    'coverage','letter','rights','issue','issues','problem','problems','help','support',
    'claim','claims','process','policy','policies','damage','damages','contract','payment']);
  const STOP_WORDS = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','your','our','their','this','that','these','those','my','his','her','its','we','they','you','i','me','him','us','them','it','no','not','nor','so','too','very','just','about','more','most','some','any','all','each','every','both','few','many','much','own','other','another','such','what','which','who','whom','how','when','where','why','if','then','than','because','while','although','though','after','before','until','unless','since','during','into','through','between','against','above','below','over','under','out','up','down','off','only','also','still','already','even','now','here','there','well','back','also','robust','comprehensive','effective','strong','solid','proper','good','great','full','total','complete','general','basic','simple','common','standard','regular','normal','typical','usual','main','major','key','important','significant','critical','essential','necessary','relevant','appropriate','suitable','adequate']);
  const meaningfulWords = words.filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
  const allGeneric = meaningfulWords.length > 0 && meaningfulWords.every(w => GENERIC_WORDS.has(w.toLowerCase()));
  if (allGeneric && words.length <= 2) return false;

  return true;
}

// ── Process one article ──

async function processOneArticle(
  supabaseAdmin: ReturnType<typeof createClient>,
  article: { id: string; slug: string; title: string; content: string; category_slug: string; related_templates: string[] | null; content_plan_id: string | null },
  embedding: { id: string; article_role: string; embedding: string; category_id: string; content_id: string | null; parent_pillar_id: string | null },
  maxLinksPerArticle: number,
): Promise<number> {
  // Check existing outbound cap
  const { count: existingOutbound } = await supabaseAdmin
    .from('link_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('source_post_id', article.id)
    .in('status', ['approved', 'applied']);

  const remainingSlots = maxLinksPerArticle - (existingOutbound || 0);
  if (remainingSlots <= 0) {
    console.log(`[SMART] Skipping "${article.title}" - at outbound cap`);
    return 0;
  }

  // Parse content
  const sections = parseArticleIntoSections(article.content);
  const headings = extractHeadings(article.content);
  const introText = sections.find(s => s.isIntro)?.text || '';
  const bodyTextLower = sections
    .filter(s => !s.isIntro && !s.isConclusion)
    .map(s => s.text)
    .join(' ')
    .toLowerCase();

  if (bodyTextLower.length < 100) {
    console.log(`[SMART] Skipping "${article.title}" - body too short`);
    return 0;
  }

  // Find pillar article for this cluster
  let pillarInfo: { title: string; slug: string } | null = null;
  if (embedding.article_role === 'cluster' && embedding.parent_pillar_id) {
    const { data: pillar } = await supabaseAdmin
      .from('article_embeddings')
      .select('title, slug')
      .eq('id', embedding.parent_pillar_id)
      .single();
    if (pillar) pillarInfo = pillar;
  }

  // Get semantic matches (top 15)
  const { data: matches } = await supabaseAdmin.rpc('match_semantic_links', {
    query_embedding: embedding.embedding,
    source_category: embedding.category_id,
    source_role: embedding.article_role,
    similarity_threshold: 0.70,
    max_results: 15,
    exclude_content_id: article.id,
  });

  if (!matches || matches.length === 0) {
    console.log(`[SMART] No semantic matches for "${article.title}"`);
    return 0;
  }

  // Build candidate list with roles
  const candidates: CandidateTarget[] = [];
  let idx = 1;

  // Add pillar first if cluster article
  if (pillarInfo && embedding.article_role === 'cluster') {
    const pillarMatch = (matches as any[]).find(m => m.slug === pillarInfo!.slug);
    if (pillarMatch) {
      candidates.push({
        index: idx++,
        role: 'pillar',
        title: pillarMatch.title,
        slug: pillarMatch.slug,
        embeddingId: pillarMatch.id,
        contentType: pillarMatch.content_type,
      });
    }
  }

  // Add related template if available
  if (article.related_templates?.length) {
    for (const templateSlug of article.related_templates.slice(0, 1)) {
      const templateMatch = (matches as any[]).find(m => m.slug === templateSlug || m.content_type === 'template');
      if (templateMatch && !candidates.find(c => c.slug === templateMatch.slug)) {
        candidates.push({
          index: idx++,
          role: 'template',
          title: templateMatch.title,
          slug: templateMatch.slug,
          embeddingId: templateMatch.id,
          contentType: templateMatch.content_type,
        });
      }
    }
  }

  // Add remaining matches
  for (const match of matches as any[]) {
    if (candidates.find(c => c.slug === match.slug)) continue;
    if (candidates.length >= 15) break;
    candidates.push({
      index: idx++,
      role: match.article_role || 'article',
      title: match.title,
      slug: match.slug,
      embeddingId: match.id,
      contentType: match.content_type,
    });
  }

  // Fix indices to match array position
  candidates.forEach((c, i) => { c.index = i + 1; });

  if (candidates.length < 2) {
    console.log(`[SMART] Too few candidates for "${article.title}"`);
    return 0;
  }

  // Call AI
  const aiSuggestions = await callAI(
    article.title,
    embedding.article_role,
    article.category_slug,
    pillarInfo,
    sections,
    candidates,
  );

  if (!aiSuggestions.length) {
    console.log(`[SMART] AI returned no suggestions for "${article.title}"`);
    return 0;
  }

  // Validate and deduplicate
  const usedTargets = new Set<number>();
  const validSuggestions: { candidate: CandidateTarget; anchor: string; confidence: number; generatedSentence: string | null }[] = [];

  for (const suggestion of aiSuggestions) {
    if (validSuggestions.length >= Math.min(remainingSlots, 10)) break;
    
    if (!validateSuggestion(suggestion, bodyTextLower, headings, introText, article.title, candidates, usedTargets)) {
      continue;
    }

    const target = candidates[suggestion.target_index - 1];
    usedTargets.add(suggestion.target_index);
    validSuggestions.push({
      candidate: target,
      anchor: suggestion.anchor_text.trim(),
      confidence: suggestion.confidence || 75,
      generatedSentence: suggestion.mode === 'generated' ? (suggestion.generated_sentence || null) : null,
    });
  }

  if (!validSuggestions.length) {
    console.log(`[SMART] No valid suggestions after validation for "${article.title}"`);
    return 0;
  }

  // Delete existing pending AI suggestions for this source to prevent duplicates
  await supabaseAdmin
    .from('link_suggestions')
    .delete()
    .eq('source_post_id', article.id)
    .eq('status', 'pending')
    .eq('anchor_source', 'ai_suggested');

  // Insert validated suggestions
  const rows = validSuggestions.map(({ candidate, anchor, confidence, generatedSentence }) => ({
    source_post_id: article.id,
    target_type: candidate.contentType,
    target_slug: candidate.slug,
    target_title: candidate.title,
    target_embedding_id: candidate.embeddingId,
    anchor_text: anchor,
    anchor_source: 'ai_suggested',
    relevance_score: Math.max(55, Math.min(95, confidence)),
    hierarchy_valid: true,
    status: 'pending',
    generated_sentence: generatedSentence,
  }));

  const { error: insertError } = await supabaseAdmin
    .from('link_suggestions')
    .insert(rows);

  if (insertError) {
    console.error(`[SMART] Insert error for "${article.title}":`, insertError.message);
    return 0;
  }

  const existingCount = validSuggestions.filter(s => !s.generatedSentence).length;
  const generatedCount = validSuggestions.filter(s => s.generatedSentence).length;
  console.log(`[SMART] "${article.title}": ${validSuggestions.length} AI links (${existingCount} existing, ${generatedCount} generated, ${aiSuggestions.length} raw)`);
  return validSuggestions.length;
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, categorySlug, maxLinksPerArticle = 10 } = await req.json() as SmartScanRequest;

    // Auth check
    const isSelfChain = req.headers.get('Authorization')?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!isSelfChain) {
      const adminId = await verifyAdmin(req);
      if (!adminId) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    console.log('[SMART] Starting', { jobId, categorySlug, maxLinksPerArticle });

    // ── Job tracking ──
    let currentJobId = jobId;
    if (!currentJobId) {
      // Count eligible articles
      let countQuery = supabaseAdmin
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      if (categorySlug) {
        countQuery = countQuery.eq('category_slug', categorySlug);
      }

      const { count: totalCount } = await countQuery;

      const { data: newJob, error: jobError } = await supabaseAdmin
        .from('semantic_scan_jobs')
        .insert({
          total_items: totalCount || 0,
          similarity_threshold: 0.70,
          category_filter: categorySlug || null,
        })
        .select('id')
        .single();

      if (jobError) throw new Error(`Failed to create scan job: ${jobError.message}`);
      currentJobId = newJob.id;
      console.log(`[SMART] Created job ${currentJobId} with ${totalCount} articles`);
    }

    // Check job status
    const { data: jobRow } = await supabaseAdmin
      .from('semantic_scan_jobs')
      .select('status, processed_items, total_items')
      .eq('id', currentJobId)
      .single();

    if (jobRow?.status === 'cancelled' || jobRow?.status === 'completed') {
      console.log(`[SMART] Job ${jobRow.status}, stopping`);
      return new Response(JSON.stringify({ success: true, cancelled: true, jobId: currentJobId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Completion guard
    if (jobRow && jobRow.processed_items >= jobRow.total_items) {
      await supabaseAdmin.from('semantic_scan_jobs').update({
        status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', currentJobId);
      return new Response(JSON.stringify({ success: true, jobId: currentJobId, message: 'Smart scan complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch batch of articles that haven't been smart-scanned yet ──
    let articleQuery = supabaseAdmin
      .from('article_embeddings')
      .select('id, content_id, slug, title, category_id, article_role, embedding, parent_pillar_id')
      .eq('embedding_status', 'completed')
      .not('embedding', 'is', null)
      .or('next_scan_due_at.is.null,next_scan_due_at.lte.now()');

    if (categorySlug) {
      articleQuery = articleQuery.eq('category_id', categorySlug);
    }

    articleQuery = articleQuery
      .order('next_scan_due_at', { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    const { data: embeddings, error: embError } = await articleQuery;

    if (embError) throw new Error(`Failed to fetch embeddings: ${embError.message}`);

    if (!embeddings || embeddings.length === 0) {
      await supabaseAdmin.from('semantic_scan_jobs').update({
        status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', currentJobId);
      console.log('[SMART] No more articles, job complete');
      return new Response(JSON.stringify({ success: true, jobId: currentJobId, message: 'Smart scan complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Atomic claim: mark these as scanned
    const embIds = embeddings.map((e: any) => e.id);
    const nextScan = new Date();
    nextScan.setDate(nextScan.getDate() + 14); // Smart scan interval: 14 days
    await supabaseAdmin
      .from('article_embeddings')
      .update({ next_scan_due_at: nextScan.toISOString() })
      .in('id', embIds);

    // Process batch
    let batchSuggestions = 0;
    let batchProcessed = 0;

    try {
      const processArticle = async (emb: any): Promise<{ suggestions: number; error?: string }> => {
        if (!emb.content_id) return { suggestions: 0 };

        const { data: article } = await supabaseAdmin
          .from('blog_posts')
          .select('id, slug, title, content, category_slug, related_templates, content_plan_id')
          .eq('id', emb.content_id)
          .single();

        if (!article) return { suggestions: 0 };

        const suggestions = await withTimeout(
          processOneArticle(supabaseAdmin, article, emb, maxLinksPerArticle),
          ARTICLE_TIMEOUT_MS,
          article.title,
        );
        return { suggestions };
      };

      const results = await Promise.allSettled(
        (embeddings as any[]).map(emb => processArticle(emb))
      );

      let rateLimited = false;
      let paymentRequired = false;

      for (const result of results) {
        batchProcessed++;
        if (result.status === 'fulfilled') {
          batchSuggestions += result.value.suggestions;
        } else {
          const msg = result.reason instanceof Error ? result.reason.message : 'Unknown';
          console.error(`[SMART] Article failed:`, msg);
          if (msg.includes('RATE_LIMIT')) rateLimited = true;
          if (msg.includes('PAYMENT_REQUIRED')) paymentRequired = true;
        }
      }

      if (paymentRequired) {
        await supabaseAdmin.from('semantic_scan_jobs').update({
          status: 'failed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq('id', currentJobId);
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted', jobId: currentJobId }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (rateLimited) {
        console.log('[SMART] Rate limited - pausing 30s before self-chain');
        await new Promise(r => setTimeout(r, 30_000));
      }

      // Update progress
      await supabaseAdmin.rpc('increment_scan_progress', {
        p_job_id: currentJobId,
        p_processed: batchProcessed,
        p_suggestions: batchSuggestions,
      });

    } catch (batchError) {
      console.error('[SMART] Batch error:', batchError);
      try {
        await supabaseAdmin.rpc('increment_scan_progress', {
          p_job_id: currentJobId, p_processed: batchProcessed, p_suggestions: batchSuggestions,
        });
      } catch (_) { /* best effort */ }
    } finally {
      console.log(`[SMART] Batch: ${batchProcessed} processed, ${batchSuggestions} suggestions`);

      try {
        const { data: freshJob } = await supabaseAdmin
          .from('semantic_scan_jobs')
          .select('status')
          .eq('id', currentJobId)
          .single();

        if (freshJob?.status === 'cancelled' || freshJob?.status === 'failed') {
          console.log(`[SMART] Job ${freshJob.status}, stopping chain`);
        } else {
          await selfChainWithRetry({ jobId: currentJobId, categorySlug, maxLinksPerArticle });
        }
      } catch (_) {
        await selfChainWithRetry({ jobId: currentJobId, categorySlug, maxLinksPerArticle });
      }
    }

    return new Response(JSON.stringify({
      success: true, jobId: currentJobId, scanned: batchProcessed, batchSuggestions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SMART] Fatal:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
