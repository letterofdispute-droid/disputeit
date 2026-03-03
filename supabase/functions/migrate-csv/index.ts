import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Format a value for PostgreSQL-compatible CSV import
const formatValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (Array.isArray(val)) {
    // PostgreSQL array format: {a,b,c}
    const inner = val.map((v) => {
      if (v === null) return "NULL";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\\") || s.includes("{") || s.includes("}")) {
        return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
      }
      return s;
    }).join(",");
    return `{${inner}}`;
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

const escapeCSV = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

    const offset = parseInt(url.searchParams.get("offset") || "0");
    const limit = parseInt(url.searchParams.get("limit") || "500");

    // Get total count
    const { count: totalCount } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    // Fetch chunk
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      return new Response("", {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "X-Total-Count": String(totalCount || 0),
        },
      });
    }

    // Use actual column names from the first row
    const columns = Object.keys(data[0]);

    // Build CSV
    const headerLine = columns.map(escapeCSV).join(",");
    const rows = data.map((row) =>
      columns.map((col) => escapeCSV(formatValue(row[col]))).join(",")
    );
    const csv = [headerLine, ...rows].join("\n");

    const nextOffset = offset + data.length < (totalCount || 0) ? offset + data.length : null;

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${table}-${offset}.csv"`,
        "X-Total-Count": String(totalCount || 0),
        "X-Next-Offset": nextOffset !== null ? String(nextOffset) : "",
        "X-Row-Count": String(data.length),
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
