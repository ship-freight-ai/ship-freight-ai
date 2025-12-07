import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INVITE] ${step}${detailsStr}`);
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

    const { seats_to_allocate, email } = await req.json();
    
    if (!seats_to_allocate || seats_to_allocate < 1) {
      throw new Error("Invalid seats_to_allocate value");
    }
    logStep("Request body parsed", { seats_to_allocate, email });

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .single();

    if (subError || !subscription) {
      throw new Error("No active subscription found");
    }
    logStep("Subscription found", { subscriptionId: subscription.id, seats: subscription.seats, seats_used: subscription.seats_used });

    // Check available seats
    const availableSeats = subscription.seats - subscription.seats_used;
    if (availableSeats < seats_to_allocate) {
      throw new Error(`Not enough seats available. Available: ${availableSeats}, Requested: ${seats_to_allocate}`);
    }

    // Generate unique invite token
    const invite_token = crypto.randomUUID();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7); // 7 days expiry

    // Create invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from("team_invites")
      .insert({
        subscription_id: subscription.id,
        created_by: user.id,
        invite_token,
        email,
        seats_allocated: seats_to_allocate,
        expires_at: expires_at.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) throw new Error(`Failed to create invite: ${inviteError.message}`);
    logStep("Invite created", { inviteId: invite.id, token: invite_token });

    const origin = req.headers.get("origin") || "https://yourapp.com";
    const invite_url = `${origin}/app/claim-seat?token=${invite_token}`;

    return new Response(JSON.stringify({
      invite_url,
      invite_id: invite.id,
      expires_at: invite.expires_at,
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