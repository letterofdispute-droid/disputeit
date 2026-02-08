import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { purchaseId } = await req.json();

    if (!purchaseId) {
      throw new Error("Missing purchase ID");
    }

    // Get the authorization header to verify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    // Create a client with the user's token
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // Verify user can access this purchase
    const { data: purchase, error: fetchError } = await userClient
      .from("letter_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("status", "completed")
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error("Failed to fetch purchase");
    }

    if (!purchase) {
      throw new Error("Purchase not found or not accessible");
    }

    // Always regenerate PDF with professional template to ensure latest formatting
    // Use last_edited_content if user has edited the letter, otherwise use original
    const letterContent = purchase.last_edited_content || purchase.letter_content;
    
    console.log("Regenerating PDF with professional template...");
    
    const generateResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-letter-documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          purchaseId: purchase.id,
          letterContent: letterContent,
          templateName: purchase.template_name,
          evidencePhotoPaths: purchase.evidence_photos || [],
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Document generation failed:", errorText);
      throw new Error("Failed to generate documents");
    }

    const generateResult = await generateResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: generateResult.pdfUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
