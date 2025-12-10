import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLAIM-INVITE] ${step}${detailsStr}`);
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

    const { invite_token } = await req.json();
    if (!invite_token) throw new Error("No invite_token provided");
    logStep("Request body parsed", { invite_token });

    // Get invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from("team_invites")
      .select("*, subscriptions(*)")
      .eq("invite_token", invite_token)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invalid invite token");
    }
    logStep("Invite found", { inviteId: invite.id, status: invite.status });

    // Validate invite
    if (invite.status !== "pending") {
      throw new Error(`Invite is ${invite.status}`);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }

    // Check available seats on the invite
    const availableSeats = invite.seats_allocated - invite.seats_claimed;
    if (availableSeats < 1) {
      throw new Error("No seats available on this invite");
    }

    // Check available seats on the subscription (global limit)
    const subscription = invite.subscriptions;
    if (!subscription) {
      throw new Error("Subscription not found for this invite");
    }

    // Check if subscription is active
    if (!['active', 'trialing'].includes(subscription.status)) {
      throw new Error("The organization's subscription is not active");
    }

    if ((subscription.seats_used || 0) >= (subscription.seats || 0)) {
      throw new Error("The organization has reached its maximum seat limit. The owner must add more seats.");
    }

    // Check if user already has a subscription
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.subscription_id) {
      throw new Error("You already have an active subscription");
    }

    // Claim the seat
    // Update invite
    const newSeatsClaimed = invite.seats_claimed + 1;
    const newStatus = newSeatsClaimed >= invite.seats_allocated ? "claimed" : "pending";

    const { error: updateInviteError } = await supabaseClient
      .from("team_invites")
      .update({
        seats_claimed: newSeatsClaimed,
        status: newStatus,
        claimed_at: new Date().toISOString(),
        claimed_by: user.id,
      })
      .eq("id", invite.id);

    if (updateInviteError) throw new Error(`Failed to update invite: ${updateInviteError.message}`);

    // Update subscription seats_used
    const { error: updateSubError } = await supabaseClient
      .from("subscriptions")
      .update({
        seats_used: invite.subscriptions.seats_used + 1,
      })
      .eq("id", invite.subscription_id);

    if (updateSubError) throw new Error(`Failed to update subscription: ${updateSubError.message}`);

    // Update profile
    const { error: updateProfileError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_id: invite.subscription_id,
        claimed_via_invite: invite.id,
      })
      .eq("user_id", user.id);

    if (updateProfileError) throw new Error(`Failed to update profile: ${updateProfileError.message}`);

    logStep("Seat claimed successfully");

    return new Response(JSON.stringify({
      success: true,
      subscription_id: invite.subscription_id,
      plan_type: invite.subscriptions.plan_type,
      message: "You've successfully joined the team!",
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