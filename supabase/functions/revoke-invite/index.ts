import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REVOKE-INVITE] ${step}${detailsStr}`);
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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { invite_id } = await req.json();
    if (!invite_id) throw new Error("No invite_id provided");
    logStep("Request body parsed", { invite_id });

    // Get invite and verify ownership
    const { data: invite, error: inviteError } = await supabaseClient
      .from("team_invites")
      .select("*, subscriptions(*)")
      .eq("id", invite_id)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invite not found");
    }

    if (invite.subscriptions.user_id !== user.id) {
      throw new Error("You don't have permission to revoke this invite");
    }

    if (invite.status === "claimed") {
      throw new Error("Cannot revoke a fully claimed invite");
    }

    // Revoke the invite
    const { error: updateError } = await supabaseClient
      .from("team_invites")
      .update({ status: "revoked" })
      .eq("id", invite_id);

    if (updateError) throw new Error(`Failed to revoke invite: ${updateError.message}`);

    logStep("Invite revoked successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Invite revoked successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});