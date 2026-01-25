import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const { sessionId, purchaseId } = await req.json();

    if (!sessionId || !purchaseId) {
      throw new Error("Missing session ID or purchase ID");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the purchase record
    const { data: purchase, error: fetchError } = await supabaseClient
      .from("letter_purchases")
      .select("*")
      .eq("id", purchaseId)
      .single();

    if (fetchError || !purchase) {
      throw new Error("Purchase not found");
    }

    // If already completed, return the existing data
    if (purchase.status === "completed") {
      return new Response(JSON.stringify({
        success: true,
        purchase: {
          id: purchase.id,
          templateName: purchase.template_name,
          purchaseType: purchase.purchase_type,
          pdfUrl: purchase.pdf_url,
          docxUrl: purchase.docx_url,
          letterContent: purchase.letter_content,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update purchase status and email
    const customerEmail = session.customer_details?.email || purchase.email;
    
    const { error: updateError } = await supabaseClient
      .from("letter_purchases")
      .update({
        status: "completed",
        email: customerEmail,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", purchaseId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update purchase");
    }

    // Return purchase details for download
    return new Response(JSON.stringify({
      success: true,
      purchase: {
        id: purchase.id,
        templateName: purchase.template_name,
        purchaseType: purchase.purchase_type,
        letterContent: purchase.letter_content,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
