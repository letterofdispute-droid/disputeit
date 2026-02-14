import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Constants ──
const ARTICLE_TIMEOUT_MS = 30_000; // 30s max per article
const BATCH_SIZE_DEFAULT = 10;

// ── Types ──
interface ScanRequest {
  jobId?: string;
  postId?: string;
  categorySlug?: string;
  batchSize?: number;
  similarityThreshold?: number;
  maxLinksPerArticle?: number;
  includeBidirectional?: boolean;
}

interface SemanticMatch {
  id: string;
  content_type: string;
  slug: string;
  title: string;
  category_id: string;
  subcategory_slug: string | null;
  article_role: string;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  inbound_count: number;
  max_inbound: number;
  similarity: number;
  hierarchy_valid: boolean;
  hierarchy_note: string | null;
}

interface ArticleEmbedding {
  id: string;
  content_id: string | null;
  slug: string;
  title: string;
  category_id: string;
  article_role: string;
  embedding: string;
  anchor_variants: string[] | null;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
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
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scan-for-semantic-links`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      console.log(`[SELF-CHAIN] Attempt ${attempt}: status ${res.status}`);
      await res.text(); // drain body to close connection
      if (res.ok || res.status === 504) return; // 504 = function IS running
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.warn(`[SELF-CHAIN] Attempt ${attempt} failed:`, err);
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('[SELF-CHAIN] Both attempts failed — pg_cron recovery will pick up the job');
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

const GENERIC_ANCHOR_STARTERS = [
  'how to handle','how to write','how to dispute','how to file',
  'how to get','how to deal','how to respond',
  'what to do about','what to do when','what to do if',
  'a guide to','your complete','the ultimate',
  'everything you need','a comprehensive',
  'understanding your','here is how','steps to',
];

function selectAnchorText(
  anchorVariants: string[],
  primaryKeyword: string | null,
  title: string,
  sourceKeyword: string | null,
): string {
  // Filter to quality variants only — never use full title
  const quality = (anchorVariants || []).filter(a => {
    if (a.length > 60) return false;
    if (a === title) return false;
    const lower = a.toLowerCase();
    if (GENERIC_ANCHOR_STARTERS.some(s => lower.startsWith(s))) return false;
    return true;
  });

  // Prefer non-overlapping with source keyword for diversity
  if (quality.length > 0 && sourceKeyword) {
    const sourceWords = new Set(sourceKeyword.toLowerCase().split(/\s+/));
    const nonOverlapping = quality.find(anchor => {
      const anchorWords = anchor.toLowerCase().split(/\s+/);
      return !anchorWords.some(word => sourceWords.has(word));
    });
    if (nonOverlapping) return nonOverlapping;
  }

  if (quality.length > 0) return quality[0];
  if (primaryKeyword && primaryKeyword.length <= 60) return primaryKeyword;

  // Last resort: extract best segment from title
  let cleaned = title;
  cleaned = cleaned.replace(/^From\s+['"].+?['"]\s+to\s+['"].+?['"]\s*[:–—-]\s*/i, '');
  for (const s of GENERIC_ANCHOR_STARTERS) {
    if (cleaned.toLowerCase().startsWith(s)) {
      cleaned = cleaned.slice(s.length).trim();
      break;
    }
  }
  const segments = cleaned.split(/[-–—:|,;]/).map(s => s.trim());
  const best = segments.find(s => {
    const words = s.split(/\s+/);
    return words.length >= 2 && words.length <= 5;
  });
  return best || cleaned.split(/\s+/).slice(0, 4).join(' ');
}

function calculateKeywordOverlap(keywordsA: string[], keywordsB: string[]): number {
  if (!keywordsA.length || !keywordsB.length) return 0;
  const setA = new Set(keywordsA.map(k => k.toLowerCase()));
  const setB = new Set(keywordsB.map(k => k.toLowerCase()));
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function getNextScanDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

// ── Process a single article (forward + reverse links) ──

async function processOneArticle(
  supabaseAdmin: ReturnType<typeof createClient>,
  source: ArticleEmbedding,
  similarityThreshold: number,
  maxLinksPerArticle: number,
  includeBidirectional: boolean,
): Promise<number> {
  let suggestions = 0;

  // ── CUMULATIVE OUTBOUND CAP: Check existing approved/applied links ──
  if (source.content_id) {
    const { count: existingOutbound } = await supabaseAdmin
      .from('link_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('source_post_id', source.content_id)
      .in('status', ['approved', 'applied']);

    const remainingSlots = maxLinksPerArticle - (existingOutbound || 0);
    if (remainingSlots <= 0) {
      console.log(`[SCAN] Skipping "${source.title}" — already at outbound cap (${existingOutbound}/${maxLinksPerArticle})`);
      return 0;
    }
    // Use remainingSlots as the effective limit for this article
    maxLinksPerArticle = remainingSlots;
  }

  // ── FORWARD: Find articles this source should link TO ──
  const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_semantic_links', {
    query_embedding: source.embedding,
    source_category: source.category_id,
    source_role: source.article_role,
    similarity_threshold: similarityThreshold,
    max_results: 30,
    exclude_content_id: source.content_id || undefined,
  });

  if (matchError) {
    console.error(`[SCAN] Match error for "${source.title}":`, matchError.message);
    return 0;
  }

  if (!matches || matches.length === 0) {
    return 0;
  }

  // Filter out self-links
  const validMatches = (matches as SemanticMatch[]).filter(m =>
    String(m.id) !== String(source.id) && m.slug !== source.slug,
  );

  // Delete existing pending suggestions for this source to prevent duplicates on re-runs
  const targetSlugs = validMatches.slice(0, maxLinksPerArticle).map(m => m.slug);
  if (targetSlugs.length > 0 && source.content_id) {
    await supabaseAdmin
      .from('link_suggestions')
      .delete()
      .eq('source_post_id', source.content_id)
      .eq('status', 'pending')
      .in('target_slug', targetSlugs);
  }

  // Generate link suggestions for top matches
  const newSuggestions = [];
  for (const match of validMatches.slice(0, maxLinksPerArticle)) {
    if (match.inbound_count >= match.max_inbound) continue;

    const { data: targetEmbedding } = await supabaseAdmin
      .from('article_embeddings')
      .select('anchor_variants, primary_keyword')
      .eq('id', match.id)
      .single();

    const anchorText = selectAnchorText(
      targetEmbedding?.anchor_variants || [],
      targetEmbedding?.primary_keyword || match.primary_keyword,
      match.title,
      source.primary_keyword,
    );

    const keywordOverlap = calculateKeywordOverlap(
      source.secondary_keywords || [],
      match.secondary_keywords || [],
    );

    newSuggestions.push({
      source_post_id: source.content_id || source.id,
      target_type: match.content_type,
      target_slug: match.slug,
      target_title: match.title,
      target_embedding_id: match.id,
      anchor_text: anchorText,
      anchor_source: 'semantic',
      semantic_score: match.similarity,
      keyword_overlap_score: keywordOverlap,
      relevance_score: Math.round((match.similarity * 0.7 + keywordOverlap * 0.3) * 100),
      hierarchy_valid: match.hierarchy_valid,
      hierarchy_violation: match.hierarchy_note,
      status: 'pending',
    });
  }

  if (newSuggestions.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('link_suggestions')
      .insert(newSuggestions);

    if (!insertError) {
      suggestions += newSuggestions.length;
    } else {
      console.error(`[SCAN] Insert error for "${source.title}":`, insertError.message);
    }
  }

  // ── REVERSE: Find articles that should link TO this source ──
  // Uses the same RPC but searches for what's similar to this article,
  // then creates suggestions where THOSE articles are the source.
  if (includeBidirectional && source.content_id) {
    const { data: reverseMatches, error: reverseError } = await supabaseAdmin.rpc('match_semantic_links', {
      query_embedding: source.embedding,
      source_category: source.category_id,
      source_role: source.article_role,
      similarity_threshold: similarityThreshold,
      max_results: 15,
      exclude_content_id: source.content_id || undefined,
    });

    if (!reverseError && reverseMatches) {
      const reverseValid = (reverseMatches as SemanticMatch[]).filter(m =>
        String(m.id) !== String(source.id) && m.slug !== source.slug,
      );

      for (const candidate of reverseValid.slice(0, maxLinksPerArticle)) {
        // Need the candidate's content_id to create a reverse suggestion
        const { data: candidateEmbed } = await supabaseAdmin
          .from('article_embeddings')
          .select('content_id')
          .eq('id', candidate.id)
          .single();

        if (!candidateEmbed?.content_id) continue;

        // Check candidate's outbound cap before creating reverse suggestion
        const { count: candidateOutbound } = await supabaseAdmin
          .from('link_suggestions')
          .select('id', { count: 'exact', head: true })
          .eq('source_post_id', candidateEmbed.content_id)
          .in('status', ['approved', 'applied', 'pending']);

        if ((candidateOutbound || 0) >= maxLinksPerArticle) continue;

        // Check if reverse suggestion already exists
        const { data: existing } = await supabaseAdmin
          .from('link_suggestions')
          .select('id')
          .eq('source_post_id', candidateEmbed.content_id)
          .eq('target_slug', source.slug)
          .maybeSingle();

        if (existing) continue;

        const { error: reverseInsertError } = await supabaseAdmin
          .from('link_suggestions')
          .insert({
            source_post_id: candidateEmbed.content_id,
            target_type: 'article',
            target_slug: source.slug,
            target_title: source.title,
            target_embedding_id: source.id,
            anchor_text: selectAnchorText(source.anchor_variants || [], source.primary_keyword, source.title, null),
            anchor_source: 'semantic-reverse',
            semantic_score: candidate.similarity,
            relevance_score: Math.round(candidate.similarity * 100),
            hierarchy_valid: true,
            status: 'pending',
          });

        if (!reverseInsertError) {
          suggestions++;
        }
      }
    }
  }

  return suggestions;
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      jobId,
      postId,
      categorySlug,
      batchSize = BATCH_SIZE_DEFAULT,
      similarityThreshold = 0.75,
      maxLinksPerArticle = 5,
      includeBidirectional = true,
    } = await req.json() as ScanRequest;

    // ── Auth: service-role self-chain skips admin check ──
    const isSelfChain = req.headers.get('Authorization')?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    if (!isSelfChain) {
      const adminId = await verifyAdmin(req);
      if (!adminId) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    console.log('[SCAN] Starting', { jobId, postId, categorySlug, batchSize, similarityThreshold });

    // ── Job tracking: create job on first invocation ──
    let currentJobId = jobId;
    if (!currentJobId) {
      let countQuery = supabaseAdmin
        .from('article_embeddings')
        .select('id', { count: 'exact', head: true })
        .eq('embedding_status', 'completed')
        .not('embedding', 'is', null);

      if (postId) {
        countQuery = countQuery.eq('content_id', postId);
      } else if (categorySlug) {
        countQuery = countQuery.eq('category_id', categorySlug);
      }
      if (!postId) {
        countQuery = countQuery.or('next_scan_due_at.is.null,next_scan_due_at.lte.now()');
      }

      const { count: totalCount } = await countQuery;

      const { data: newJob, error: jobError } = await supabaseAdmin
        .from('semantic_scan_jobs')
        .insert({
          total_items: totalCount || 0,
          similarity_threshold: similarityThreshold,
          category_filter: categorySlug || null,
        })
        .select('id')
        .single();

      if (jobError) {
        throw new Error(`Failed to create scan job: ${jobError.message}`);
      }

      currentJobId = newJob.id;
      console.log(`[SCAN] Created job ${currentJobId} with ${totalCount} items`);
    }

    // ── Check if job was cancelled ──
    const { data: jobRow } = await supabaseAdmin
      .from('semantic_scan_jobs')
      .select('status')
      .eq('id', currentJobId)
      .single();

    if (jobRow?.status === 'cancelled') {
      console.log('[SCAN] Job was cancelled, stopping');
      return new Response(JSON.stringify({ success: true, cancelled: true, jobId: currentJobId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch batch of articles to scan ──
    let query = supabaseAdmin
      .from('article_embeddings')
      .select('id, content_id, slug, title, category_id, article_role, embedding, anchor_variants, primary_keyword, secondary_keywords')
      .eq('embedding_status', 'completed')
      .not('embedding', 'is', null);

    if (postId) {
      query = query.eq('content_id', postId);
    } else if (categorySlug) {
      query = query.eq('category_id', categorySlug);
    }

    query = query
      .or('next_scan_due_at.is.null,next_scan_due_at.lte.now()')
      .order('next_scan_due_at', { ascending: true, nullsFirst: true })
      .limit(batchSize);

    const { data: sourceArticles, error: articlesError } = await query;

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    // ── No more articles → mark job complete ──
    if (!sourceArticles || sourceArticles.length === 0) {
      await supabaseAdmin
        .from('semantic_scan_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentJobId);

      console.log('[SCAN] No more articles to scan, job complete');
      return new Response(JSON.stringify({
        success: true,
        jobId: currentJobId,
        message: 'Scan complete',
        scanned: 0,
        suggestions: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[SCAN] Processing batch of ${sourceArticles.length} articles`);

    // ── Process batch with per-article timeout + try/finally for self-chain ──
    let batchSuggestions = 0;
    let batchProcessed = 0;

    try {
      for (const source of sourceArticles as ArticleEmbedding[]) {
        try {
          const articleSuggestions = await withTimeout(
            processOneArticle(supabaseAdmin, source, similarityThreshold, maxLinksPerArticle, includeBidirectional),
            ARTICLE_TIMEOUT_MS,
            source.title,
          );

          batchSuggestions += articleSuggestions;
          batchProcessed++;

          // Update scan timestamp so this article isn't picked up again
          await supabaseAdmin
            .from('article_embeddings')
            .update({ next_scan_due_at: getNextScanDate() })
            .eq('id', source.id);

        } catch (articleError) {
          const msg = articleError instanceof Error ? articleError.message : 'Unknown error';
          console.error(`[SCAN] Article failed "${source.title}": ${msg}`);
          batchProcessed++; // Count as processed even if failed, to avoid infinite retry
          // Still update scan date to prevent retrying a broken article forever
          await supabaseAdmin
            .from('article_embeddings')
            .update({ next_scan_due_at: getNextScanDate() })
            .eq('id', source.id);
        }
      }

      // Atomically update job progress
      await supabaseAdmin.rpc('increment_scan_progress', {
        p_job_id: currentJobId,
        p_processed: batchProcessed,
        p_suggestions: batchSuggestions,
      });

    } catch (batchError) {
      console.error('[SCAN] Batch-level error:', batchError);
      // Still try to record whatever progress we made
      try {
        await supabaseAdmin.rpc('increment_scan_progress', {
          p_job_id: currentJobId,
          p_processed: batchProcessed,
          p_suggestions: batchSuggestions,
        });
      } catch (_updateErr) {
        console.error('[SCAN] Failed to update progress after batch crash');
      }
    } finally {
      // ── ALWAYS self-chain if job is still active ──
      console.log(`[SCAN] Batch done: ${batchProcessed} scanned, ${batchSuggestions} suggestions`);

      try {
        const { data: freshJob } = await supabaseAdmin
          .from('semantic_scan_jobs')
          .select('status')
          .eq('id', currentJobId)
          .single();

        if (freshJob?.status === 'cancelled') {
          console.log('[SCAN] Job cancelled during batch, stopping chain');
        } else {
          await selfChainWithRetry({
            jobId: currentJobId,
            categorySlug,
            batchSize,
            similarityThreshold,
            maxLinksPerArticle,
            includeBidirectional,
          });
        }
      } catch (_chainErr) {
        // Last resort: try chain anyway, pg_cron will recover if this also fails
        await selfChainWithRetry({
          jobId: currentJobId,
          categorySlug,
          batchSize,
          similarityThreshold,
          maxLinksPerArticle,
          includeBidirectional,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      jobId: currentJobId,
      scanned: batchProcessed,
      batchSuggestions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SCAN] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
