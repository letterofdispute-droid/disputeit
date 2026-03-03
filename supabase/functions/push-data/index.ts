import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SMALL_BATCH_TABLES = ["blog_posts", "article_embeddings", "link_suggestions", "content_queue"];
const BATCH_SIZE = 500;
const SMALL_BATCH_SIZE = 50;
const NEW_PROJECT_URL = "https://penadwjjzszlzxipuptr.supabase.co";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const srcClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const dstClient = createClient(
      NEW_PROJECT_URL,
      Deno.env.get("NEW_SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const table = url.searchParams.get("table");
    if (!table) {
      return new Response(JSON.stringify({ error: "table param required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startOffset = parseInt(url.searchParams.get("offset") || "0");
    const maxBatches = parseInt(url.searchParams.get("max_batches") || "5");
    const batchSize = SMALL_BATCH_TABLES.includes(table) ? SMALL_BATCH_SIZE : BATCH_SIZE;

    let offset = startOffset;
    let migrated = 0;
    const errors: string[] = [];
    let nextOffset: number | null = null;

    for (let batch = 0; batch < maxBatches; batch++) {
      const { data, error: readErr, count } = await srcClient
        .from(table)
        .select("*", { count: "exact" })
        .range(offset, offset + batchSize - 1);

      if (readErr) {
        errors.push(`Read@${offset}: ${readErr.message}`);
        break;
      }

      if (!data || data.length === 0) break;

      const { error: writeErr } = await dstClient.from(table).insert(data);

      if (writeErr) {
        if (writeErr.message?.includes("duplicate key")) {
          migrated += data.length;
        } else {
          errors.push(`Write@${offset}: ${writeErr.message}`);
        }
      } else {
        migrated += data.length;
      }

      offset += batchSize;
      if (offset >= (count || 0)) break;
      if (batch === maxBatches - 1) {
        nextOffset = offset;
      }
    }

    return new Response(
      JSON.stringify({ table, migrated, errors, next_offset: nextOffset, offset }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
