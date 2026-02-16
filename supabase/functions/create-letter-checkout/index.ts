import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AMOUNTS = {
  "pdf-only": 999,
  "pdf-editable": 1499,
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
    const { 
      purchaseType, 
      templateSlug, 
      templateName, 
      letterContent,
      evidencePhotoPaths,
    } = await req.json();

    if (!purchaseType || !templateSlug || !templateName || !letterContent) {
      throw new Error("Missing required fields");
    }

    if (!AMOUNTS[purchaseType as keyof typeof AMOUNTS]) {
      throw new Error("Invalid purchase type");
    }

    // Check if user is authenticated
    let user = null;
    let userEmail = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      userEmail = user?.email;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer already exists
    let customerId;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("letter_purchases")
      .insert({
        user_id: user?.id || null,
        email: userEmail || "pending@checkout.com", // Will be updated by webhook or success page
        template_slug: templateSlug,
        template_name: templateName,
        letter_content: letterContent,
        purchase_type: purchaseType,
        amount_cents: AMOUNTS[purchaseType as keyof typeof AMOUNTS],
        status: "pending",
        evidence_photos: evidencePhotoPaths || [],
      })
      .select()
      .single();

    if (purchaseError) {
      console.error("Purchase insert error:", purchaseError);
      throw new Error("Failed to create purchase record");
    }

    const origin = req.headers.get("origin") || "https://letterofdispute.com";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: AMOUNTS[purchaseType as keyof typeof AMOUNTS],
            product_data: {
              name: `${templateName} - ${purchaseType === "pdf-editable" ? "PDF + Edit Access" : "PDF Only"}`,
              description: purchaseType === "pdf-editable"
                ? "Professional dispute letter with 30 days of in-app editing and unlimited PDF exports"
                : "Professional dispute letter as a ready-to-send PDF download",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase.id}`,
      cancel_url: `${origin}/letter/${templateSlug}`,
      metadata: {
        purchase_id: purchase.id,
        template_slug: templateSlug,
        purchase_type: purchaseType,
      },
    });

    // Update purchase with session ID
    await supabaseClient
      .from("letter_purchases")
      .update({ stripe_session_id: session.id })
      .eq("id", purchase.id);

    return new Response(JSON.stringify({ url: session.url, purchaseId: purchase.id }), {
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
