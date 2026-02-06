import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RefundRequest {
  orderId: string;
  reason: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin status
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", {
      check_user_id: userData.user.id,
    });

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { orderId, reason, notes }: RefundRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("letter_purchases")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.status === "refunded") {
      throw new Error("Order has already been refunded");
    }

    if (order.status !== "completed") {
      throw new Error("Only completed orders can be refunded");
    }

    if (!order.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this order");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reason: reason === "duplicate" ? "duplicate" : 
              reason === "fraudulent" ? "fraudulent" : 
              "requested_by_customer",
    });

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from("letter_purchases")
      .update({
        status: "refunded",
        refunded_at: new Date().toISOString(),
        refund_reason: `${reason}${notes ? `: ${notes}` : ""}`,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      // Don't throw - refund was successful
    }

    // Log the refund
    const { error: logError } = await supabaseAdmin
      .from("refund_logs")
      .insert({
        purchase_id: orderId,
        amount_cents: order.amount_cents,
        reason: `${reason}${notes ? `: ${notes}` : ""}`,
        stripe_refund_id: refund.id,
        processed_by: userData.user.id,
      });

    if (logError) {
      console.error("Failed to log refund:", logError);
      // Don't throw - refund was successful
    }

    // Log analytics event
    await supabaseAdmin.from("analytics_events").insert({
      event_type: "refund_processed",
      event_data: {
        order_id: orderId,
        amount_cents: order.amount_cents,
        reason: reason,
        template_slug: order.template_slug,
      },
      user_id: userData.user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        message: "Refund processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Refund error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
