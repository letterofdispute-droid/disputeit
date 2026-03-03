import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// All tables to export, ordered by dependency (referenced tables first)
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
];

const BATCH_SIZE = 1000;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const table = url.searchParams.get("table");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // If no table specified, return table list with row counts
    if (!table) {
      const summary: Record<string, number> = {};
      for (const t of TABLES) {
        const { count } = await supabaseAdmin
          .from(t)
          .select("*", { count: "exact", head: true });
        summary[t] = count || 0;
      }
      return new Response(JSON.stringify({ tables: summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate table name
    if (!TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Invalid table: ${table}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch batch
    const { data, error, count } = await supabaseAdmin
      .from(table)
      .select("*", { count: "exact" })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;

    const total = count || 0;
    const hasMore = offset + BATCH_SIZE < total;

    return new Response(
      JSON.stringify({
        table,
        offset,
        batch_size: BATCH_SIZE,
        returned: (data || []).length,
        total,
        has_more: hasMore,
        next_offset: hasMore ? offset + BATCH_SIZE : null,
        data: data || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
