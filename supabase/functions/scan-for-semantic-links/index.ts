import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

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
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { 
      jobId,
      postId, 
      categorySlug, 
      batchSize = 10,
      similarityThreshold = 0.75,
      maxLinksPerArticle = 5,
      includeBidirectional = true,
    } = await req.json() as ScanRequest;

    console.log('[SEMANTIC-SCAN] Starting scan', { jobId, postId, categorySlug, batchSize, similarityThreshold });

    // ---- JOB TRACKING ----
    // If no jobId, this is the initial invocation: count total and create a job row
    let currentJobId = jobId;
    if (!currentJobId) {
      // Count total articles that need scanning
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

      // For initial scan, count articles due for scanning
      if (!postId) {
        countQuery = countQuery.or('next_scan_due_at.is.null,next_scan_due_at.lte.now()');
      }

      const { count: totalCount } = await countQuery;

      // Create job row
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
        console.error('[SEMANTIC-SCAN] Failed to create job:', jobError);
        throw new Error(`Failed to create scan job: ${jobError.message}`);
      }

      currentJobId = newJob.id;
      console.log(`[SEMANTIC-SCAN] Created job ${currentJobId} with ${totalCount} items`);
    }

    // Check if job was cancelled
    const { data: jobRow } = await supabaseAdmin
      .from('semantic_scan_jobs')
      .select('status')
      .eq('id', currentJobId)
      .single();

    if (jobRow?.status === 'cancelled') {
      console.log('[SEMANTIC-SCAN] Job was cancelled, stopping');
      return new Response(JSON.stringify({ success: true, cancelled: true, jobId: currentJobId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build query to find articles with embeddings that need scanning
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

    // Prioritize articles that haven't been scanned recently
    query = query
      .or('next_scan_due_at.is.null,next_scan_due_at.lte.now()')
      .order('next_scan_due_at', { ascending: true, nullsFirst: true })
      .limit(batchSize);

    const { data: sourceArticles, error: articlesError } = await query;

    if (articlesError) {
      console.error('[SEMANTIC-SCAN] Failed to fetch articles:', articlesError);
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!sourceArticles || sourceArticles.length === 0) {
      // No more articles to scan — mark job complete
      await supabaseAdmin
        .from('semantic_scan_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', currentJobId);

      console.log('[SEMANTIC-SCAN] No more articles to scan, job complete');
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

    console.log(`[SEMANTIC-SCAN] Processing batch of ${sourceArticles.length} articles`);

    let batchSuggestions = 0;

    for (const source of sourceArticles as ArticleEmbedding[]) {
      try {
        // Call the match_semantic_links function to find similar articles
        const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_semantic_links', {
          query_embedding: source.embedding,
          source_category: source.category_id,
          source_role: source.article_role,
          similarity_threshold: similarityThreshold,
          max_results: 30,
        });

        if (matchError) {
          console.error(`[SEMANTIC-SCAN] Match error for ${source.title}:`, matchError);
          continue;
        }

        if (!matches || matches.length === 0) {
          await supabaseAdmin
            .from('article_embeddings')
            .update({ next_scan_due_at: getNextScanDate() })
            .eq('id', source.id);
          continue;
        }

        // Filter out self-links
        const validMatches = (matches as SemanticMatch[]).filter(m => 
          m.id !== source.id && m.slug !== source.slug
        );

        // Check for existing suggestions to avoid duplicates
        const { data: existingSuggestions } = await supabaseAdmin
          .from('link_suggestions')
          .select('target_slug')
          .eq('source_post_id', source.content_id || source.id);

        const existingSlugs = new Set(existingSuggestions?.map(s => s.target_slug) || []);

        // Generate link suggestions for top matches
        const newSuggestions = [];
        for (const match of validMatches.slice(0, maxLinksPerArticle)) {
          if (existingSlugs.has(match.slug)) continue;
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
            source.primary_keyword
          );

          const keywordOverlap = calculateKeywordOverlap(
            source.secondary_keywords || [],
            match.secondary_keywords || []
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
            batchSuggestions += newSuggestions.length;
          } else {
            console.error(`[SEMANTIC-SCAN] Insert error for ${source.title}:`, insertError);
          }
        }

        // BIDIRECTIONAL: Find existing articles that should link TO this source
        if (includeBidirectional && source.content_id) {
          const sourceEmbedding = typeof source.embedding === 'string' 
            ? JSON.parse(source.embedding) 
            : source.embedding;

          const { data: otherEmbeddings } = await supabaseAdmin
            .from('article_embeddings')
            .select('id, content_id, slug, title, embedding, category_id, primary_keyword, article_role')
            .eq('embedding_status', 'completed')
            .not('embedding', 'is', null)
            .neq('id', source.id);

          if (otherEmbeddings) {
            for (const candidate of otherEmbeddings) {
              if (!candidate.content_id || !candidate.embedding) continue;

              const { data: existingReverse } = await supabaseAdmin
                .from('link_suggestions')
                .select('id')
                .eq('source_post_id', candidate.content_id)
                .eq('target_slug', source.slug)
                .maybeSingle();

              if (existingReverse) continue;

              try {
                const candidateEmbedding = typeof candidate.embedding === 'string'
                  ? JSON.parse(candidate.embedding)
                  : candidate.embedding;

                const similarity = cosineSimilarity(candidateEmbedding, sourceEmbedding);

                if (similarity > similarityThreshold) {
                  const { error: reverseInsertError } = await supabaseAdmin
                    .from('link_suggestions')
                    .insert({
                      source_post_id: candidate.content_id,
                      target_type: 'article',
                      target_slug: source.slug,
                      target_title: source.title,
                      target_embedding_id: source.id,
                      anchor_text: source.primary_keyword || source.title.slice(0, 50),
                      anchor_source: 'semantic-reverse',
                      semantic_score: similarity,
                      relevance_score: Math.round(similarity * 100),
                      hierarchy_valid: true,
                      status: 'pending',
                    });

                  if (!reverseInsertError) {
                    batchSuggestions++;
                  }
                }
              } catch (_e) {
                // Skip invalid embeddings
              }
            }
          }
        }

        // Update the scan timestamp
        await supabaseAdmin
          .from('article_embeddings')
          .update({ next_scan_due_at: getNextScanDate() })
          .eq('id', source.id);

      } catch (error) {
        console.error(`[SEMANTIC-SCAN] Error processing ${source.title}:`, error);
      }
    }

    // Atomically update job progress
    await supabaseAdmin.rpc('increment_scan_progress', {
      p_job_id: currentJobId,
      p_processed: sourceArticles.length,
      p_suggestions: batchSuggestions,
    });

    console.log(`[SEMANTIC-SCAN] Batch done: ${sourceArticles.length} scanned, ${batchSuggestions} suggestions`);

    // ---- SELF-CHAIN: fire-and-forget next batch ----
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const selfUrl = `${supabaseUrl}/functions/v1/scan-for-semantic-links`;
      const chainResponse = await fetch(selfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          jobId: currentJobId,
          categorySlug,
          batchSize,
          similarityThreshold,
          maxLinksPerArticle,
          includeBidirectional,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[SEMANTIC-SCAN] Self-chain triggered, status: ${chainResponse.status}`);
    } catch (chainError) {
      // AbortError or network error — both are fine for fire-and-forget
      const errorName = chainError instanceof Error ? chainError.name : 'Unknown';
      console.log(`[SEMANTIC-SCAN] Self-chain fire-and-forget: ${errorName}`);
    }

    return new Response(JSON.stringify({
      success: true,
      jobId: currentJobId,
      scanned: sourceArticles.length,
      batchSuggestions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SEMANTIC-SCAN] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ---- Helper Functions ----

function selectAnchorText(
  anchorVariants: string[],
  primaryKeyword: string | null,
  title: string,
  sourceKeyword: string | null
): string {
  if (anchorVariants.length > 0 && sourceKeyword) {
    const sourceWords = new Set(sourceKeyword.toLowerCase().split(/\s+/));
    const nonOverlapping = anchorVariants.find(anchor => {
      const anchorWords = anchor.toLowerCase().split(/\s+/);
      return !anchorWords.some(word => sourceWords.has(word));
    });
    if (nonOverlapping) return nonOverlapping;
  }
  if (anchorVariants.length > 0) return anchorVariants[0];
  if (primaryKeyword) return primaryKeyword;
  const words = title.split(/\s+/);
  return words.length > 6 ? words.slice(0, 5).join(' ') + '...' : title;
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

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function getNextScanDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
