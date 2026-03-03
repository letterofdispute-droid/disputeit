import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// All tables ordered by dependency (parents first)
const TABLES = [
  "blog_categories",
  "site_settings",
  "profiles",
  "user_roles",
  "content_plans",
  "blog_posts",
  "article_embeddings",
  "content_queue",
  "keyword_targets",
  "link_suggestions",
  "template_stats",
  "letter_purchases",
  "analytics_events",
  "embedding_queue",
  "gsc_performance_cache",
  "semantic_scan_jobs",
  "category_images",
  "consumer_news_cache",
  "bulk_planning_jobs",
  "og_images",
  "image_optimization_jobs",
  "user_credits",
  "embedding_jobs",
  "backfill_jobs",
  "keyword_planning_jobs",
  "dispute_outcomes",
  "gsc_index_status",
  "gsc_recommendations_cache",
  "generation_jobs",
  "pages",
  "blog_tags",
  "template_seo_overrides",
  "canonical_anchors",
  "user_letters",
  "letter_analyses",
  "evidence_photos",
  "refund_logs",
  "daily_publish_jobs",
];

// Smaller batch for content-heavy tables
const SMALL_BATCH_TABLES = ["blog_posts", "article_embeddings", "link_suggestions", "content_queue"];
const BATCH_SIZE = 500;
const SMALL_BATCH_SIZE = 50;
const NEW_PROJECT_URL = "https://penadwjjzszlzxipuptr.supabase.co";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Source (this project)
    const srcClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Destination (new project)
    const dstClient = createClient(
      NEW_PROJECT_URL,
      Deno.env.get("NEW_SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const singleTable = url.searchParams.get("table");
    const startOffset = parseInt(url.searchParams.get("offset") || "0");
    const maxBatches = parseInt(url.searchParams.get("max_batches") || "999");
    const tablesToMigrate = singleTable ? [singleTable] : TABLES;

    const results: Record<string, { migrated: number; errors: string[]; next_offset: number | null }> = {};

    for (const table of tablesToMigrate) {
      const tableResult = { migrated: 0, errors: [] as string[], next_offset: null as number | null };
      let offset = singleTable ? startOffset : 0;
      let batchCount = 0;

      const batchSize = SMALL_BATCH_TABLES.includes(table) ? SMALL_BATCH_SIZE : BATCH_SIZE;

      while (true) {
        const { data, error: readErr, count } = await srcClient
          .from(table)
          .select("*", { count: "exact" })
          .range(offset, offset + batchSize - 1);

        if (readErr) {
          tableResult.errors.push(`Read error at offset ${offset}: ${readErr.message}`);
          break;
        }

        if (!data || data.length === 0) break;

        // Write batch to destination (upsert to handle retries)
        const { error: writeErr } = await dstClient
          .from(table)
          .upsert(data, { onConflict: 'id', ignoreDuplicates: true });

        if (writeErr) {
          const errMsg = `Write error at offset ${offset}: ${writeErr.message}`;
          tableResult.errors.push(errMsg);
          console.error(errMsg);
        } else {
          tableResult.migrated += data.length;
        }

        const total = count || 0;
        offset += batchSize;
        batchCount++;
        if (offset >= total) break;
        if (batchCount >= maxBatches) {
          tableResult.next_offset = offset;
          break;
        }
      }

      results[table] = tableResult;
      console.log(`✅ ${table}: ${tableResult.migrated} rows migrated${tableResult.errors.length ? `, ${tableResult.errors.length} errors` : ""}`);
    }

    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0);

    return new Response(
      JSON.stringify({
        summary: { total_migrated: totalMigrated, total_errors: totalErrors, tables_processed: tablesToMigrate.length },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
