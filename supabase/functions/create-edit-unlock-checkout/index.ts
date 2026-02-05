import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UNLOCK_PRICE_ID = "price_1Sxa6AROE6uHwbbo6a9yQ4AA"; // Letter Editing Access Unlock $5.99

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

    // Get the purchase to verify it exists and get email
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("letter_purchases")
      .select("id, email, user_id, template_name")
      .eq("id", purchaseId)
      .single();

    if (purchaseError || !purchase) {
      throw new Error("Purchase not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: purchase.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://letterofdispute.com";

    // Create checkout session for edit unlock
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : purchase.email,
      line_items: [
        {
          price: UNLOCK_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/letters/${purchaseId}/edit?unlocked=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/letters/${purchaseId}/edit`,
      metadata: {
        purchase_id: purchaseId,
        user_id: purchase.user_id || "",
        type: "edit_unlock",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
