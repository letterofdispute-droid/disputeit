import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function classifyError(status: number, text: string): string {
  if (status === 429) return "rate_limited";
  if (status === 402) return "credit_exhausted";
  if (status >= 500) return "ai_server_error";
  return `ai_error_${status}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("is_admin", {
      check_user_id: user.id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { page_ids } = await req.json();
    if (!Array.isArray(page_ids) || page_ids.length === 0 || page_ids.length > 2) {
      return new Response(
        JSON.stringify({ error: "page_ids must be an array of 1-2 IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pages with current SEO fields to know what's missing
    const { data: pages, error: fetchErr } = await supabase
      .from("pages")
      .select("id, title, slug, page_group, page_type, meta_title, meta_description, featured_image_url")
      .in("id", page_ids);

    if (fetchErr || !pages) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch pages", detail: fetchErr?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const PIXABAY_API_KEY = Deno.env.get("PIXABAY_API_KEY")!;

    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ pageId: string; reason: string }> = [];
    let bailReason: string | null = null;

    for (const page of pages) {
      if (bailReason) {
        failed++;
        errors.push({ pageId: page.id, reason: "skipped_bail" });
        continue;
      }

      try {
        const needsMeta = !page.meta_title || !page.meta_description;
        const needsImage = !page.featured_image_url;

        // Skip if nothing to do
        if (!needsMeta && !needsImage) {
          succeeded++;
          continue;
        }

        let metaTitle = page.meta_title;
        let metaDescription = page.meta_description;
        let imageKeywords = page.title;

        // 1. Generate meta via AI only if needed
        if (needsMeta) {
          const aiController = new AbortController();
          const aiTimeout = setTimeout(() => aiController.abort(), 25000);

          try {
            const aiPrompt = `You are an SEO expert for a consumer rights and dispute resolution website called "Letter of Dispute". 

Write a unique, compelling meta title and meta description for this specific page:

Title: "${page.title}"
URL slug: "/${page.slug}"
Page group: "${page.page_group || "general"}"
Page type: "${page.page_type}"

Rules:
- meta_title: Max 60 characters. Must be unique, specific to THIS exact topic. Include the brand "Letter of Dispute" only if space allows. No generic patterns.
- meta_description: Max 155 characters. Compelling, action-oriented, specific to the page's actual subject matter. Make someone want to click.
- Do NOT use templates or patterns. Each one should read like a human copywriter wrote it specifically for this page.
- Focus on the specific consumer rights topic, state, or category this page covers.

Return using the provided tool.`;

            const aiResponse = await fetch(
              "https://ai.gateway.lovable.dev/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [{ role: "user", content: aiPrompt }],
                  tools: [
                    {
                      type: "function",
                      function: {
                        name: "set_seo_meta",
                        description: "Set the SEO meta title and description for a page.",
                        parameters: {
                          type: "object",
                          properties: {
                            meta_title: {
                              type: "string",
                              description: "SEO meta title, max 60 characters",
                            },
                            meta_description: {
                              type: "string",
                              description: "SEO meta description, max 155 characters",
                            },
                            image_keywords: {
                              type: "string",
                              description:
                                "2-4 visual keywords for finding a relevant stock photo (e.g. 'apartment tenant keys' or 'courthouse gavel justice'). Focus on concrete visual subjects.",
                            },
                          },
                          required: ["meta_title", "meta_description", "image_keywords"],
                          additionalProperties: false,
                        },
                      },
                    },
                  ],
                  tool_choice: {
                    type: "function",
                    function: { name: "set_seo_meta" },
                  },
                }),
                signal: aiController.signal,
              }
            );

            clearTimeout(aiTimeout);

            if (!aiResponse.ok) {
              const errText = await aiResponse.text();
              const reason = classifyError(aiResponse.status, errText);
              if (reason === "rate_limited" || reason === "credit_exhausted") {
                bailReason = reason;
              }
              throw new Error(`${reason}: ${errText.slice(0, 200)}`);
            }

            const aiData = await aiResponse.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (!toolCall) throw new Error("ai_no_tool_call");

            const args = JSON.parse(toolCall.function.arguments);
            metaTitle = (args.meta_title || "").slice(0, 60);
            metaDescription = (args.meta_description || "").slice(0, 155);
            imageKeywords = args.image_keywords || page.title;
          } catch (err) {
            clearTimeout(aiTimeout);
            if (err instanceof DOMException && err.name === "AbortError") {
              throw new Error("ai_timeout");
            }
            throw err;
          }
        }

        // 2. Pixabay image search (only if missing)
        let featuredImageUrl: string | null = page.featured_image_url;
        if (needsImage) {
          const pixController = new AbortController();
          const pixTimeout = setTimeout(() => pixController.abort(), 10000);

          try {
            const query = encodeURIComponent(imageKeywords);
            const pixRes = await fetch(
              `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${query}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`,
              { signal: pixController.signal }
            );
            clearTimeout(pixTimeout);

            if (pixRes.ok) {
              const pixData = await pixRes.json();
              if (pixData.hits && pixData.hits.length > 0) {
                const idx = Math.floor(Math.random() * Math.min(pixData.hits.length, 5));
                featuredImageUrl = pixData.hits[idx].largeImageURL;
              }
            }
          } catch (imgErr) {
            clearTimeout(pixTimeout);
            const reason = imgErr instanceof DOMException && imgErr.name === "AbortError"
              ? "pixabay_timeout"
              : "pixabay_error";
            console.error(`${reason} for page ${page.id}:`, imgErr);
            // Non-fatal — we still save meta
          }
        }

        // 3. Update DB — only set fields that were missing
        const updateData: Record<string, string | null> = {};
        if (needsMeta && metaTitle) updateData.meta_title = metaTitle;
        if (needsMeta && metaDescription) updateData.meta_description = metaDescription;
        if (needsImage && featuredImageUrl) updateData.featured_image_url = featuredImageUrl;

        if (Object.keys(updateData).length > 0) {
          const { error: updateErr } = await supabase
            .from("pages")
            .update(updateData)
            .eq("id", page.id);

          if (updateErr) throw new Error(`db_error: ${updateErr.message}`);
        }

        succeeded++;
      } catch (err) {
        failed++;
        const reason = err instanceof Error ? err.message : String(err);
        errors.push({ pageId: page.id, reason: reason.slice(0, 300) });
        console.error(`Failed page ${page.id}:`, err);
      }
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({ succeeded, failed, errors, bailReason, duration_ms: durationMs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("backfill-page-seo error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
