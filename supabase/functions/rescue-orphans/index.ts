import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 10;
const RESCUE_MAX_OUTBOUND = 12;
const RESCUE_SIMILARITY = 0.55;
const RESCUE_MAX_RESULTS = 40;
const RESCUE_MAX_SUGGESTIONS_PER_ORPHAN = 5;
const SELF_CHAIN_TIMEOUT_MS = 10_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    let jobId: string | undefined = body.jobId;
    const maxLinksPerArticle = body.maxLinksPerArticle || RESCUE_MAX_OUTBOUND;

    // Step 1: Create or resume job
    if (!jobId) {
      // Reset cooldown for articles that are still orphans so explicit rescue always works
      await supabase
        .from('article_embeddings')
        .update({ next_scan_due_at: null })
        .eq('embedding_status', 'completed')
        .eq('content_type', 'article')
        .lte('inbound_count', 0)
        .not('embedding', 'is', null);

      // Count orphans
      const now = new Date().toISOString();
      const { count: orphanCount } = await supabase
        .from('article_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('embedding_status', 'completed')
        .eq('content_type', 'article')
        .lte('inbound_count', 0)
        .not('embedding', 'is', null)
        .or(`next_scan_due_at.is.null,next_scan_due_at.lte.${now}`);

      if (!orphanCount || orphanCount === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No orphan articles found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: job, error: jobErr } = await supabase
        .from('semantic_scan_jobs')
        .insert({
          status: 'processing',
          total_items: orphanCount,
          processed_items: 0,
          total_suggestions: 0,
          similarity_threshold: RESCUE_SIMILARITY,
          category_filter: '__rescue_orphans__',
        })
        .select('id')
        .single();

      if (jobErr) throw jobErr;
      jobId = job.id;
      console.log(`[RESCUE] Created job ${jobId} for ${orphanCount} orphans`);
    }

    // Step 2: Check if job is still active
    const { data: currentJob } = await supabase
      .from('semantic_scan_jobs')
      .select('status, processed_items')
      .eq('id', jobId)
      .single();

    if (!currentJob || currentJob.status !== 'processing') {
      return new Response(JSON.stringify({ success: true, message: 'Job no longer active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Fetch a batch of orphans with embeddings
    const nowStr = new Date().toISOString();
    const { data: orphans, error: orphErr } = await supabase
      .from('article_embeddings')
      .select('id, content_id, slug, title, category_id, article_role, embedding, anchor_variants, primary_keyword, secondary_keywords')
      .eq('embedding_status', 'completed')
      .eq('content_type', 'article')
      .lte('inbound_count', 0)
      .not('embedding', 'is', null)
      .or(`next_scan_due_at.is.null,next_scan_due_at.lte.${nowStr}`)
      .order('id')
      .limit(BATCH_SIZE);

    if (orphErr) throw orphErr;

    if (!orphans || orphans.length === 0) {
      await supabase
        .from('semantic_scan_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', jobId);

      console.log(`[RESCUE] Job ${jobId} completed - no more orphans`);
      return new Response(JSON.stringify({ success: true, message: 'All orphans processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let batchSuggestions = 0;
    let batchProcessed = 0;

    for (const orphan of orphans) {
      try {
        if (!orphan.embedding) continue;

        // Find candidate source articles that could link TO this orphan
        const { data: candidates, error: matchErr } = await supabase.rpc('match_semantic_links', {
          query_embedding: orphan.embedding,
          source_category: orphan.category_id,
          source_role: orphan.article_role || 'cluster',
          similarity_threshold: RESCUE_SIMILARITY,
          max_results: RESCUE_MAX_RESULTS,
          exclude_content_id: orphan.content_id,
        });

        if (matchErr) {
          console.error(`[RESCUE] Match error for ${orphan.slug}:`, matchErr.message);
          continue;
        }

        if (!candidates || candidates.length === 0) {
          await supabase
            .from('article_embeddings')
            .update({ next_scan_due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
            .eq('id', orphan.id);
          batchProcessed++;
          continue;
        }

        // Sort candidates by outbound_count ascending to prefer sources with room
        const sortedCandidates = [...candidates].sort(
          (a: any, b: any) => (a.outbound_count ?? 0) - (b.outbound_count ?? 0)
        );

        const suggestions: any[] = [];
        for (const candidate of sortedCandidates) {
          if (candidate.slug === orphan.slug) continue;

          // Use outbound_count from the RPC result directly (no N+1 query needed)
          if ((candidate.outbound_count ?? 0) >= maxLinksPerArticle) continue;

          // Check if suggestion already exists
          const { count: existingCount } = await supabase
            .from('link_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('source_post_id', candidate.id)
            .eq('target_slug', orphan.slug);

          if (existingCount && existingCount > 0) continue;

          // We need the source's content_id (blog post id) for source_post_id
          // candidate.id is article_embeddings.id; we need the blog_post id
          const { data: sourceEmbed } = await supabase
            .from('article_embeddings')
            .select('content_id')
            .eq('id', candidate.id)
            .single();

          if (!sourceEmbed?.content_id) continue;

          // Pick best anchor text
          const anchorText = (orphan.anchor_variants && orphan.anchor_variants.length > 0)
            ? orphan.anchor_variants[0]
            : orphan.primary_keyword || orphan.title.substring(0, 50);

          suggestions.push({
            source_post_id: sourceEmbed.content_id,
            target_slug: orphan.slug,
            target_title: orphan.title,
            target_type: 'article',
            target_embedding_id: orphan.id,
            anchor_text: anchorText,
            anchor_source: 'semantic-reverse',
            semantic_score: candidate.similarity,
            hierarchy_valid: candidate.hierarchy_valid,
            hierarchy_violation: candidate.hierarchy_note || null,
            status: 'approved',
            context_snippet: `Rescue scan: linking from "${candidate.title}" to orphan article`,
          });

          if (suggestions.length >= RESCUE_MAX_SUGGESTIONS_PER_ORPHAN) break;
        }

        // Insert suggestions
        if (suggestions.length > 0) {
          const { error: insertErr } = await supabase
            .from('link_suggestions')
            .insert(suggestions);

          if (insertErr) {
            console.error(`[RESCUE] Insert error for ${orphan.slug}:`, insertErr.message);
          } else {
            batchSuggestions += suggestions.length;
          }
        }

        // Update orphan's scan timestamp
        await supabase
          .from('article_embeddings')
          .update({ next_scan_due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
          .eq('id', orphan.id);

        batchProcessed++;
      } catch (err) {
        console.error(`[RESCUE] Error processing orphan ${orphan.slug}:`, err);
        batchProcessed++;
      }
    }

    // Update job progress atomically
    await supabase.rpc('increment_scan_progress', {
      p_job_id: jobId,
      p_processed: batchProcessed,
      p_suggestions: batchSuggestions,
    });

    console.log(`[RESCUE] Batch done: ${batchProcessed} orphans, ${batchSuggestions} suggestions. Self-chaining...`);

    // Self-chain
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SELF_CHAIN_TIMEOUT_MS);
    try {
      const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/rescue-orphans`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        },
        body: JSON.stringify({ jobId }),
        signal: controller.signal,
      });
    } catch {
      // Expected - fire and forget
    } finally {
      clearTimeout(timeout);
    }

    return new Response(JSON.stringify({
      success: true,
      jobId,
      processed: batchProcessed,
      suggestions: batchSuggestions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[RESCUE] Fatal error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
