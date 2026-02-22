import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Restore stripped links - simplified version.
 * 
 * Modes:
 * - 'scan': Paginated check of article_embeddings.outbound_count to find low-link posts
 * - 'restore': Reconcile counters + reset next_scan_due_at for affected posts
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const {
      mode = 'scan',
      batchSize = 1000,
      offset = 0,
      threshold = 2, // posts with outbound_count <= threshold need restoration
    } = await req.json().catch(() => ({}));

    if (mode === 'scan') {
      // Query article_embeddings directly for outbound_count - fast, no content parsing
      const { data: posts, error, count } = await supabase
        .from('article_embeddings')
        .select('id, slug, title, category_id, outbound_count', { count: 'exact' })
        .eq('embedding_status', 'completed')
        .not('content_id', 'is', null)
        .order('slug')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;

      const needsRestore = (posts || []).filter((p: any) => (p.outbound_count ?? 0) <= threshold);
      const healthy = (posts || []).filter((p: any) => (p.outbound_count ?? 0) > threshold);

      return new Response(JSON.stringify({
        success: true,
        mode: 'scan',
        batchChecked: posts?.length || 0,
        totalPosts: count || 0,
        needsRestore: needsRestore.length,
        healthy: healthy.length,
        pagination: {
          offset,
          batchSize,
          hasMore: (posts?.length || 0) === batchSize,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'restore') {
      // Step 1: Reconcile link counters to get accurate outbound_count
      console.log('[RESTORE] Step 1: Reconciling link counters...');
      const { data: reconcileResult, error: reconcileError } = await supabase.rpc('reconcile_link_counts');
      if (reconcileError) {
        console.error('[RESTORE] Reconcile failed:', reconcileError.message);
        // Continue anyway - we can still reset scan timestamps
      }
      console.log('[RESTORE] Reconcile result:', reconcileResult);

      // Step 2: Count affected posts (outbound_count <= threshold after reconcile)
      const { count: affectedCount, error: countError } = await supabase
        .from('article_embeddings')
        .select('id', { count: 'exact', head: true })
        .eq('embedding_status', 'completed')
        .not('content_id', 'is', null)
        .not('embedding', 'is', null)
        .lte('outbound_count', threshold);

      if (countError) throw countError;

      // Step 3: Reset next_scan_due_at for all low-link posts so semantic scan picks them up
      console.log(`[RESTORE] Step 2: Resetting scan timestamps for ${affectedCount} posts...`);
      const { error: resetError } = await supabase
        .from('article_embeddings')
        .update({ next_scan_due_at: null })
        .eq('embedding_status', 'completed')
        .not('content_id', 'is', null)
        .not('embedding', 'is', null)
        .lte('outbound_count', threshold);

      if (resetError) throw resetError;

      return new Response(JSON.stringify({
        success: true,
        mode: 'restore',
        reconcileResult: reconcileResult || null,
        affectedPosts: affectedCount || 0,
        message: `Counters reconciled and ${affectedCount} posts flagged for re-scanning. Run a full semantic scan from the Links panel to restore links.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid mode. Use "scan" or "restore".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[restore-stripped-links] Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
