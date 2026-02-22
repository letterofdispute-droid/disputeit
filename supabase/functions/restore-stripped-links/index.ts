import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Restore stripped links by triggering semantic scans on affected posts.
 * 
 * This function:
 * 1. Finds posts that were modified by the broken link scanner (low outbound count)
 * 2. Triggers semantic scan for each post to generate new link suggestions
 * 3. Auto-approves suggestions with relevance >= 70
 * 4. Self-chains for the next batch
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
      mode = 'scan', // 'scan' = find affected posts, 'restore' = trigger semantic scans
      batchSize = 100,
      offset = 0,
      autoApproveThreshold = 70,
      jobId,
    } = await req.json().catch(() => ({}));

    if (mode === 'scan') {
      // Find posts with low outbound link count (likely stripped)
      // These are posts where article_embeddings.outbound_count was high but actual links are low
      const { data: affectedPosts, error, count } = await supabase
        .from('article_embeddings')
        .select('content_id, slug, title, category_id, outbound_count', { count: 'exact' })
        .eq('embedding_status', 'completed')
        .not('content_id', 'is', null)
        .lte('outbound_count', 1) // Posts with 0-1 outbound links are likely stripped
        .order('slug')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;

      // For each, count actual <a> tags pointing to /articles/ in content
      const needsRestore: Array<{
        contentId: string;
        slug: string;
        title: string;
        category: string;
        currentOutbound: number;
      }> = [];

      for (const post of affectedPosts || []) {
        if (!post.content_id) continue;
        
        // Check actual link count in content
        const { data: blogPost } = await supabase
          .from('blog_posts')
          .select('content')
          .eq('id', post.content_id)
          .eq('status', 'published')
          .single();

        if (!blogPost?.content) continue;

        const linkCount = (blogPost.content.match(/href="\/articles\/[^"]+"/gi) || []).length;
        
        // If actual links < 3, this post likely needs restoration
        if (linkCount < 3) {
          needsRestore.push({
            contentId: post.content_id,
            slug: post.slug,
            title: post.title,
            category: post.category_id,
            currentOutbound: linkCount,
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'scan',
        totalChecked: affectedPosts?.length || 0,
        totalAffected: count || 0,
        needsRestore: needsRestore.length,
        posts: needsRestore.slice(0, 20), // Preview first 20
        pagination: { offset, batchSize, hasMore: (affectedPosts?.length || 0) === batchSize },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'restore') {
      // Step 1: Find posts needing restoration
      const { data: affectedPosts, error } = await supabase
        .from('article_embeddings')
        .select('content_id, slug, title, category_id')
        .eq('embedding_status', 'completed')
        .not('content_id', 'is', null)
        .not('embedding', 'is', null)
        .lte('outbound_count', 1)
        .order('slug')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!affectedPosts || affectedPosts.length === 0) {
        // All done - run reconcile
        console.log('[RESTORE] All batches processed, reconciling link counts...');
        await supabase.rpc('reconcile_link_counts');
        
        return new Response(JSON.stringify({
          success: true,
          mode: 'restore',
          message: 'All posts processed. Link counts reconciled.',
          processed: 0,
          offset,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let triggered = 0;
      let autoApproved = 0;

      for (const post of affectedPosts) {
        if (!post.content_id) continue;

        try {
          // Trigger semantic scan for this specific post
          const { data: scanResult, error: scanError } = await supabase.functions.invoke('scan-for-semantic-links', {
            body: { postId: post.content_id, maxLinksPerArticle: 6, includeBidirectional: false },
          });

          if (scanError) {
            console.error(`[RESTORE] Scan failed for ${post.slug}:`, scanError.message);
            continue;
          }

          triggered++;

          // Auto-approve high-relevance suggestions for this post
          const { data: suggestions } = await supabase
            .from('link_suggestions')
            .select('id, relevance_score')
            .eq('source_post_id', post.content_id)
            .eq('status', 'pending')
            .gte('relevance_score', autoApproveThreshold);

          if (suggestions && suggestions.length > 0) {
            const ids = suggestions.map((s: any) => s.id);
            await supabase
              .from('link_suggestions')
              .update({ status: 'approved' })
              .in('id', ids);
            autoApproved += ids.length;
          }
        } catch (err) {
          console.error(`[RESTORE] Error processing ${post.slug}:`, err);
        }
      }

      console.log(`[RESTORE] Batch complete: triggered=${triggered}, autoApproved=${autoApproved}, offset=${offset}`);

      // Self-chain for next batch
      const nextOffset = offset + batchSize;
      const hasMore = affectedPosts.length === batchSize;

      if (hasMore) {
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 10000);
          
          await fetch(`${supabaseUrl}/functions/v1/restore-stripped-links`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
            },
            body: JSON.stringify({ mode: 'restore', offset: nextOffset, batchSize, autoApproveThreshold }),
            signal: controller.signal,
          }).catch(() => {}); // Fire and forget
        } catch {
          // Expected - fire and forget
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'restore',
        triggered,
        autoApproved,
        offset,
        nextOffset: hasMore ? nextOffset : null,
        hasMore,
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
