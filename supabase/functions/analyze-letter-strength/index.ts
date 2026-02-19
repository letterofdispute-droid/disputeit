import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 3;

function hashIP(ip: string): string {
  // Simple hash for rate limiting - not cryptographically secure, just for basic limiting
  let hash = 0;
  const str = ip + new Date().toDateString(); // Resets daily
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { letterText, category } = body;

    if (!letterText || letterText.trim().length < 100) {
      return new Response(JSON.stringify({ error: "Letter text must be at least 100 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting by IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const ipHash = hashIP(clientIP);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("letter_analyses")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", todayStart.toISOString());

    if (count !== null && count >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ 
        error: "Daily limit reached. You've used your 3 free analyses for today. Come back tomorrow.",
        rateLimited: true,
        limit: DAILY_LIMIT,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryContext = category
      ? `This is a ${category} dispute letter.`
      : "This is a general consumer dispute letter.";

    const systemPrompt = `You are an expert legal letter analyst specializing in US consumer protection law. 
Analyze dispute letters across exactly 5 dimensions and return structured JSON.
${categoryContext}

Scoring rubric (each dimension scored 0-20):
1. Legal Citations (0-20): Does the letter cite specific US statutes, federal acts, or case law by name/code? (e.g., FCBA 15 U.S.C. § 1666, FTC Act Section 5, state consumer protection laws). Max 20 for multiple specific citations.
2. Specific Deadlines (0-20): Does the letter set a clear, specific deadline for response (e.g., "within 14 business days")? Does it reference statutory timeframes?
3. Documentation Evidence (0-20): Does the letter reference specific evidence documents (receipts, photos, prior correspondence, reference numbers)?
4. Tone & Professionalism (0-20): Is the tone firm but professional, clear and concise, not aggressive or emotional?
5. Clear Demand (0-20): Is the desired outcome explicitly and specifically stated (exact refund amount, specific action required)?

Return ONLY valid JSON in this exact format:
{
  "overallScore": <0-100>,
  "level": "<strong|moderate|weak>",
  "summary": "<1-2 sentence overall assessment>",
  "dimensions": [
    {"dimension": "Legal Citations", "score": <0-20>, "maxScore": 20, "feedback": "<specific improvement suggestion>"},
    {"dimension": "Specific Deadlines", "score": <0-20>, "maxScore": 20, "feedback": "<specific improvement suggestion>"},
    {"dimension": "Documentation Evidence", "score": <0-20>, "maxScore": 20, "feedback": "<specific improvement suggestion>"},
    {"dimension": "Tone & Professionalism", "score": <0-20>, "maxScore": 20, "feedback": "<specific improvement suggestion>"},
    {"dimension": "Clear Demand", "score": <0-20>, "maxScore": 20, "feedback": "<specific improvement suggestion>"}
  ],
  "topSuggestion": "<single most impactful improvement the user can make>",
  "templateCategory": "<suggest the most relevant category: refunds|housing|vehicle|financial|insurance|employment|ecommerce|utilities|contractors|damaged-goods|travel|hoa|healthcare>"
}
level is "strong" if overallScore >= 75, "moderate" if 45-74, "weak" if under 45.`;

    const userPrompt = `Analyze this letter:\n\n${letterText.slice(0, 4000)}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI service rate limit reached. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Record this analysis for rate limiting
    await supabase.from("letter_analyses").insert({
      ip_hash: ipHash,
      score: result.overallScore,
      category: category || null,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-letter-strength error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
