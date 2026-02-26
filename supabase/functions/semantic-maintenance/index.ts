import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

interface MaintenanceRequest {
  tasks?: ('process_queue' | 'rescan_stale' | 'reconcile_counts' | 'detect_orphans')[];
  categoryFilter?: string;
  dryRun?: boolean;
}

interface MaintenanceResult {
  queueProcessed: number;
  staleRescanned: number;
  orphansDetected: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const body: MaintenanceRequest = await req.json().catch(() => ({}));
    const tasks = body.tasks || ['process_queue', 'rescan_stale', 'reconcile_counts', 'detect_orphans'];
    const dryRun = body.dryRun || false;

    console.log(`[MAINTENANCE] Starting tasks: ${tasks.join(', ')}${dryRun ? ' (DRY RUN)' : ''}`);

    const result: MaintenanceResult = {
      queueProcessed: 0,
      staleRescanned: 0,
      orphansDetected: 0,
      errors: [],
    };

    // Task 1: Process embedding queue
    if (tasks.includes('process_queue')) {
      try {
        const { count } = await supabase
          .from('embedding_queue')
          .select('*', { count: 'exact', head: true })
          .is('processed_at', null);

        if (count && count > 0) {
          console.log(`[MAINTENANCE] Found ${count} pending queue items`);
          
          if (!dryRun) {
            // Trigger queue processor
            const response = await fetch(`${SUPABASE_URL}/functions/v1/process-embedding-queue`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ limit: 20 }),
            });
            
            if (response.ok) {
              const data = await response.json();
              result.queueProcessed = data.processed || 0;
            }
          } else {
            result.queueProcessed = count;
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Queue processing failed';
        result.errors.push(msg);
        console.error(`[MAINTENANCE] Queue error: ${msg}`);
      }
    }

    // Task 2: Re-scan stale articles (next_scan_due_at has passed)
    if (tasks.includes('rescan_stale')) {
      try {
        const { data: staleArticles, error } = await supabase
          .from('article_embeddings')
          .select('id, slug, content_id')
          .eq('embedding_status', 'completed')
          .lt('next_scan_due_at', new Date().toISOString())
          .limit(50);

        if (error) throw error;

        if (staleArticles && staleArticles.length > 0) {
          console.log(`[MAINTENANCE] Found ${staleArticles.length} stale articles to rescan`);
          
          if (!dryRun) {
            // Trigger semantic scan for these articles
            for (const article of staleArticles.slice(0, 10)) {
              if (!article.content_id) continue;
              
              const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-for-semantic-links`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: article.content_id, batchSize: 1 }),
              });
              
              if (response.ok) {
                result.staleRescanned++;
              }
              
              // Small delay
              await new Promise(r => setTimeout(r, 100));
            }
          } else {
            result.staleRescanned = staleArticles.length;
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Stale rescan failed';
        result.errors.push(msg);
        console.error(`[MAINTENANCE] Stale rescan error: ${msg}`);
      }
    }

    // Task 3: Reconcile link counters + detect orphan articles (0 inbound links)
    if (tasks.includes('reconcile_counts') || tasks.includes('detect_orphans')) {
      try {
        if (!dryRun && tasks.includes('reconcile_counts')) {
          const { data: reconcileResult, error: reconcileError } = await supabase.rpc('reconcile_link_counts');
          if (reconcileError) throw reconcileError;
          console.log('[MAINTENANCE] Reconciled link counters:', reconcileResult);
        }

        if (tasks.includes('detect_orphans')) {
          const { data: orphans, error } = await supabase.rpc('get_orphan_articles', {
            category_filter: body.categoryFilter || null,
          });

          if (error) throw error;

          if (orphans) {
            result.orphansDetected = orphans.length;
            console.log(`[MAINTENANCE] Detected ${orphans.length} orphan articles`);
            
            // Log the orphans for visibility
            if (orphans.length > 0 && orphans.length <= 20) {
              console.log('[MAINTENANCE] Orphan articles:', orphans.map((o: any) => o.slug).join(', '));
            }
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Orphan detection failed';
        result.errors.push(msg);
        console.error(`[MAINTENANCE] Orphan detection error: ${msg}`);
      }
    }

    // Clean up old processed queue items (older than 7 days)
    if (!dryRun) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await supabase
        .from('embedding_queue')
        .delete()
        .not('processed_at', 'is', null)
        .lt('processed_at', sevenDaysAgo.toISOString());
    }

    console.log(`[MAINTENANCE] Complete:`, result);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      ...result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[MAINTENANCE] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
