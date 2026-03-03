import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExportRequest {
  type: 'users' | 'orders' | 'analytics' | 'blog_posts';
  dateFrom?: string;
  dateTo?: string;
}

const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const arrayToCSV = (headers: string[], rows: any[][]): string => {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
};

// --- Raw migration CSV helpers ---
const formatPgValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (Array.isArray(val)) {
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

    // Check for raw migration mode via query params
    const url = new URL(req.url);
    const rawTable = url.searchParams.get("table");

    if (rawTable) {
      // RAW CSV MODE — no auth required, outputs exact column names
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "500");

      const { count: totalCount } = await supabaseAdmin
        .from(rawTable)
        .select("*", { count: "exact", head: true });

      const { data, error } = await supabaseAdmin
        .from(rawTable)
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
            "X-Next-Offset": "",
            "X-Row-Count": "0",
          },
        });
      }

      const columns = Object.keys(data[0]);
      const headerLine = columns.map(escapeCSV).join(",");
      const rows = data.map((row) =>
        columns.map((col) => escapeCSV(formatPgValue(row[col]))).join(",")
      );
      const csv = [headerLine, ...rows].join("\n");
      const nextOffset = offset + data.length < (totalCount || 0) ? offset + data.length : null;

      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${rawTable}-${offset}.csv"`,
          "X-Total-Count": String(totalCount || 0),
          "X-Next-Offset": nextOffset !== null ? String(nextOffset) : "",
          "X-Row-Count": String(data.length),
        },
      });
    }

    // --- ORIGINAL ADMIN EXPORT MODE (POST with JSON body) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", requestingUser.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Only admins can export data" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, dateFrom, dateTo }: ExportRequest = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ error: "Export type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'users': {
        const { data: users, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const headers = ['ID', 'User ID', 'Email', 'First Name', 'Last Name', 'Plan', 'Status', 'Is Admin', 'Letters Count', 'Created At'];
        const rows = (users || []).map(u => [u.id, u.user_id, u.email, u.first_name, u.last_name, u.plan, u.status, u.is_admin ? 'Yes' : 'No', u.letters_count, u.created_at]);
        csvContent = arrayToCSV(headers, rows);
        filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      case 'orders': {
        let query = supabaseAdmin.from('letter_purchases').select('*').order('created_at', { ascending: false });
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo);
        const { data: orders, error } = await query;
        if (error) throw error;
        const headers = ['ID', 'Email', 'Template Name', 'Template Slug', 'Purchase Type', 'Amount ($)', 'Status', 'Stripe Session ID', 'Stripe Payment Intent', 'Created At', 'Refunded At', 'Refund Reason'];
        const rows = (orders || []).map(o => [o.id, o.email, o.template_name, o.template_slug, o.purchase_type, (o.amount_cents / 100).toFixed(2), o.status, o.stripe_session_id, o.stripe_payment_intent_id, o.created_at, o.refunded_at || '', o.refund_reason || '']);
        csvContent = arrayToCSV(headers, rows);
        filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      case 'analytics': {
        let query = supabaseAdmin.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(10000);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo);
        const { data: events, error } = await query;
        if (error) throw error;
        const headers = ['ID', 'Event Type', 'Page Path', 'Session ID', 'User ID', 'Event Data', 'Created At'];
        const rows = (events || []).map(e => [e.id, e.event_type, e.page_path || '', e.session_id || '', e.user_id || '', JSON.stringify(e.event_data || {}), e.created_at]);
        csvContent = arrayToCSV(headers, rows);
        filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      case 'blog_posts': {
        const { data: posts, error } = await supabaseAdmin.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const headers = ['ID', 'Title', 'Slug', 'Category', 'Author', 'Status', 'Featured', 'Views', 'Tags', 'Meta Title', 'Meta Description', 'Published At', 'Created At', 'Updated At'];
        const rows = (posts || []).map(p => [p.id, p.title, p.slug, p.category, p.author, p.status, p.featured ? 'Yes' : 'No', p.views, (p.tags || []).join('; '), p.meta_title || '', p.meta_description || '', p.published_at || '', p.created_at, p.updated_at]);
        csvContent = arrayToCSV(headers, rows);
        filename = `blog-posts-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: "Invalid export type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    await supabaseAdmin.from("analytics_events").insert({
      event_type: "admin_data_export",
      user_id: requestingUser.id,
      event_data: { export_type: type, dateFrom, dateTo },
    });

    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error in export-data function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
