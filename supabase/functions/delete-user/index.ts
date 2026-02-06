import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
  anonymize?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", requestingUser.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Only admins can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { userId, anonymize = true }: DeleteUserRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-deletion
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's email for order handling
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    const userEmail = targetProfile?.email;

    // Handle orders based on anonymize preference
    if (anonymize && userEmail) {
      // Anonymize orders - keep for analytics but remove identifying info
      const anonymizedEmail = `deleted_${userId.substring(0, 8)}@anonymized.local`;
      await supabaseAdmin
        .from("letter_purchases")
        .update({ 
          email: anonymizedEmail,
          user_id: null,
          letter_content: '[CONTENT REMOVED]',
          last_edited_content: null
        })
        .or(`user_id.eq.${userId},email.eq.${userEmail}`);
    } else if (userEmail) {
      // Hard delete orders
      await supabaseAdmin
        .from("letter_purchases")
        .delete()
        .or(`user_id.eq.${userId},email.eq.${userEmail}`);
    }

    // Delete user letters
    await supabaseAdmin
      .from("user_letters")
      .delete()
      .eq("user_id", userId);

    // Delete user roles
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Delete profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    // Delete the auth user (this will cascade to profiles via trigger if set up)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      // Profile is already deleted, so we'll continue
    }

    // Log the action
    await supabaseAdmin.from("analytics_events").insert({
      event_type: "admin_user_deleted",
      user_id: requestingUser.id,
      event_data: {
        deleted_user_id: userId,
        anonymized: anonymize,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: anonymize ? "User anonymized successfully" : "User deleted successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
