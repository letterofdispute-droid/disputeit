import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RedeemCreditRequest {
  templateSlug: string;
  templateName: string;
  letterContent: string;
  evidencePhotoPaths?: { storagePath: string; description?: string }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client for auth validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // Service client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      throw new Error("Invalid or expired token");
    }

    const user = authData.user;
    if (!user.email) {
      throw new Error("User email not available");
    }

    // Parse request body
    const { templateSlug, templateName, letterContent, evidencePhotoPaths }: RedeemCreditRequest = await req.json();

    if (!templateSlug || !templateName || !letterContent) {
      throw new Error("Missing required fields: templateSlug, templateName, letterContent");
    }

    // Find the oldest active, non-expired credit for this user
    const now = new Date().toISOString();
    const { data: credits, error: creditError } = await supabaseAdmin
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", now)
      .order("granted_at", { ascending: true })
      .limit(1);

    if (creditError) {
      throw new Error(`Failed to fetch credits: ${creditError.message}`);
    }

    if (!credits || credits.length === 0) {
      throw new Error("No active credits available");
    }

    const creditToUse = credits[0];

    // Create the letter purchase record (amount_cents = 0 for credit redemption)
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("letter_purchases")
      .insert({
        user_id: user.id,
        email: user.email,
        template_slug: templateSlug,
        template_name: templateName,
        letter_content: letterContent,
        purchase_type: "pdf-editable", // Credits always get the full package
        amount_cents: 0,
        status: "completed",
        edit_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days edit access
        follow_up_due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days follow-up
        evidence_photos: evidencePhotoPaths || [],
      })
      .select()
      .single();

    if (purchaseError) {
      throw new Error(`Failed to create purchase: ${purchaseError.message}`);
    }

    // Mark the credit as used
    const { error: updateError } = await supabaseAdmin
      .from("user_credits")
      .update({
        status: "used",
        used_at: now,
        purchase_id: purchase.id,
      })
      .eq("id", creditToUse.id);

    if (updateError) {
      // Rollback the purchase if credit update fails
      await supabaseAdmin
        .from("letter_purchases")
        .delete()
        .eq("id", purchase.id);

      throw new Error(`Failed to update credit: ${updateError.message}`);
    }

    // Generate the letter documents (call the existing edge function)
    console.log(`Generating documents for credit redemption purchase ${purchase.id}`);
    const generateResponse = await fetch(
      `${supabaseUrl}/functions/v1/generate-letter-documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          purchaseId: purchase.id,
          letterContent: letterContent,
          templateName: templateName,
          evidencePhotoPaths: evidencePhotoPaths || [],
        }),
      }
    );

    let pdfUrl: string | undefined;
    if (!generateResponse.ok) {
      console.error("Failed to generate documents, but credit was redeemed");
    } else {
      const generateResult = await generateResponse.json();
      pdfUrl = generateResult.pdfUrl;
    }

    // Send email notification (non-blocking)
    console.log(`Sending purchase email to ${user.email}`);
    try {
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-purchase-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            email: user.email,
            templateName: templateName,
            purchaseType: "pdf-editable",
            pdfUrl: pdfUrl,
          }),
        }
      );

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error("Email sending failed (non-blocking):", emailError);
      } else {
        console.log("Purchase email sent successfully");
      }
    } catch (emailError) {
      console.error("Email sending error (non-blocking):", emailError);
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        purchaseId: purchase.id,
        message: "Credit redeemed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Redeem credit error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to redeem credit" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
