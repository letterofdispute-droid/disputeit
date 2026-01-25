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

    // Generate fresh signed URLs
    const pdfFileName = `${purchaseId}/letter.pdf`;
    const { data: pdfUrlData, error: pdfUrlError } = await supabaseClient.storage
      .from("letters")
      .createSignedUrl(pdfFileName, 60 * 60 * 24 * 7); // 7 days

    if (pdfUrlError) {
      // If PDF doesn't exist yet, regenerate it
      console.log("PDF not found, regenerating documents...");
      
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
            letterContent: purchase.letter_content,
            templateName: purchase.template_name,
            generateDocx: purchase.purchase_type === "pdf-editable",
          }),
        }
      );

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("Document generation failed:", errorText);
        throw new Error("Failed to regenerate documents");
      }

      const generateResult = await generateResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          pdfUrl: generateResult.pdfUrl,
          docxUrl: generateResult.docxUrl,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let docxUrl: string | null = null;

    // If purchase includes editable, get DOCX URL too
    if (purchase.purchase_type === "pdf-editable") {
      const docxFileName = `${purchaseId}/letter.docx`;
      const { data: docxUrlData } = await supabaseClient.storage
        .from("letters")
        .createSignedUrl(docxFileName, 60 * 60 * 24 * 7);

      docxUrl = docxUrlData?.signedUrl || null;
    }

    // Update the stored URLs
    await supabaseClient
      .from("letter_purchases")
      .update({
        pdf_url: pdfUrlData.signedUrl,
        docx_url: docxUrl,
      })
      .eq("id", purchaseId);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfUrlData.signedUrl,
        docxUrl,
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
