import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_TABLES = [
  "blog_categories", "blog_tags", "site_settings", "profiles", "user_roles",
  "template_stats", "template_seo_overrides", "og_images", "content_plans",
  "pages", "letter_purchases", "refund_logs", "category_images",
  "consumer_news_cache", "dispute_outcomes", "user_credits", "letter_analyses",
  "bulk_planning_jobs", "daily_publish_jobs", "backfill_jobs",
  "semantic_scan_jobs", "embedding_jobs", "image_optimization_jobs",
  "keyword_planning_jobs", "gsc_index_status", "gsc_performance_cache",
  "gsc_recommendations_cache", "content_queue", "blog_posts",
  "article_embeddings", "keyword_targets", "embedding_queue",
  "analytics_events", "link_suggestions", "evidence_photos",
  "user_letters", "canonical_anchors", "generation_jobs",
];

const BATCH = 500;

const escapeSql = (val: any): string => {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    const inner = val.map((v) => {
      if (v === null) return "NULL";
      const s = String(v).replace(/'/g, "''").replace(/\\/g, "\\\\");
      return `"${s}"`;
    }).join(",");
    return `'{${inner}}'`;
  }
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
};

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
    const tablesParam = url.searchParams.get("tables");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "0"); // 0 = all rows

    // If "summary" mode — return row counts
    if (url.searchParams.get("mode") === "summary") {
      const summary: Record<string, number> = {};
      for (const t of ALL_TABLES) {
        const { count } = await supabaseAdmin
          .from(t)
          .select("*", { count: "exact", head: true });
        summary[t] = count || 0;
      }
      return new Response(JSON.stringify({ tables: summary }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tablesToExport = tablesParam
      ? tablesParam.split(",").map((t) => t.trim())
      : ALL_TABLES;

    // Validate
    for (const t of tablesToExport) {
      if (!ALL_TABLES.includes(t)) {
        return new Response(JSON.stringify({ error: `Invalid table: ${t}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sqlParts: string[] = [];
    sqlParts.push("-- SQL Dump generated at " + new Date().toISOString());
    sqlParts.push("-- Tables: " + tablesToExport.join(", "));
    sqlParts.push("");

    for (const table of tablesToExport) {
      const maxRows = limit > 0 ? limit : 999999;
      let currentOffset = offset;
      let allRows: any[] = [];

      while (allRows.length < maxRows) {
        const fetchSize = Math.min(BATCH, maxRows - allRows.length);
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .range(currentOffset, currentOffset + fetchSize - 1);

        if (error) {
          sqlParts.push(`-- ERROR exporting ${table}: ${error.message}`);
          break;
        }
        if (!data || data.length === 0) break;

        allRows = allRows.concat(data);
        currentOffset += data.length;

        if (data.length < fetchSize) break; // no more rows
      }

      if (allRows.length === 0) {
        sqlParts.push(`-- Table: ${table} (0 rows, skipped)`);
        sqlParts.push("");
        continue;
      }

      const columns = Object.keys(allRows[0]);
      const colList = columns.join(", ");

      sqlParts.push(`-- Table: ${table} (${allRows.length} rows)`);

      // Chunk INSERT statements at 100 rows each to avoid huge statements
      for (let i = 0; i < allRows.length; i += 100) {
        const chunk = allRows.slice(i, i + 100);
        const valueLines = chunk.map((row) => {
          const vals = columns.map((col) => escapeSql(row[col]));
          return `(${vals.join(", ")})`;
        });

        sqlParts.push(`INSERT INTO ${table} (${colList}) VALUES`);
        sqlParts.push(valueLines.join(",\n") + ";");
        sqlParts.push("");
      }
    }

    const sql = sqlParts.join("\n");

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="dump-${tablesToExport.length === 1 ? tablesToExport[0] : "all"}.sql"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
