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

    // If already completed with documents, return the existing data with fresh signed URL
    if (purchase.status === "completed" && purchase.pdf_url) {
      // Generate a fresh signed URL from the storage path
      let pdfUrl = purchase.pdf_url;
      if (!pdfUrl.startsWith('http')) {
        const { data: signedData, error: signedError } = await supabaseClient.storage
          .from("letters")
          .createSignedUrl(pdfUrl, 60 * 60); // 1 hour
        if (signedData?.signedUrl) {
          pdfUrl = signedData.signedUrl;
        } else {
          console.warn("Failed to generate signed URL:", signedError);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        purchase: {
          id: purchase.id,
          templateName: purchase.template_name,
          purchaseType: purchase.purchase_type,
          pdfUrl: pdfUrl,
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
    
    // For pdf-editable, set edit_expires_at to 30 days from now
    const editExpiresAt = purchase.purchase_type === 'pdf-editable' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    // Set follow-up reminder for 14 days from now
    const followUpDueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabaseClient
      .from("letter_purchases")
      .update({
        status: "completed",
        email: customerEmail,
        stripe_payment_intent_id: session.payment_intent as string,
        edit_expires_at: editExpiresAt,
        follow_up_due_at: followUpDueAt,
      })
      .eq("id", purchaseId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update purchase");
    }

    // Generate PDF document only (no DOCX)
    console.log(`Calling generate-letter-documents for purchase ${purchaseId}`);
    
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
          generateDocx: false, // No longer generating DOCX
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

    if (!generateResult.success) {
      throw new Error(generateResult.error || "Document generation failed");
    }

    // Send email with download links
    console.log(`Sending purchase email to ${customerEmail}`);
    
    try {
      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-purchase-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            email: customerEmail,
            templateName: purchase.template_name,
            purchaseType: purchase.purchase_type,
            pdfUrl: generateResult.pdfUrl,
            docxUrl: generateResult.docxUrl,
          }),
        }
      );

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error("Email sending failed (non-blocking):", emailError);
        // Don't throw - email failure shouldn't block purchase success
      } else {
        console.log("Purchase email sent successfully");
      }
    } catch (emailError) {
      console.error("Email sending error (non-blocking):", emailError);
      // Don't throw - email failure shouldn't block purchase success
    }

    // Increment usage count in template_stats (non-blocking)
    try {
      const { data: currentStats } = await supabaseClient
        .from("template_stats")
        .select("usage_count")
        .eq("template_slug", purchase.template_slug)
        .maybeSingle();
      
      if (currentStats) {
        await supabaseClient
          .from("template_stats")
          .update({ usage_count: (currentStats.usage_count || 0) + 1 })
          .eq("template_slug", purchase.template_slug);
      }
    } catch (statsErr) {
      console.error("Stats increment error (non-blocking):", statsErr);
    }

    // Return purchase details with document URLs
    return new Response(JSON.stringify({
      success: true,
      purchase: {
        id: purchase.id,
        templateName: purchase.template_name,
        purchaseType: purchase.purchase_type,
        pdfUrl: generateResult.pdfUrl,
        letterContent: purchase.letter_content,
        editExpiresAt: editExpiresAt,
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
