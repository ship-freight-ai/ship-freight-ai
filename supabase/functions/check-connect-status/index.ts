import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-CONNECT-STATUS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Get carrier profile
    const { data: carrier, error: carrierError } = await supabaseClient
      .from("carriers")
      .select("stripe_connect_account_id")
      .eq("user_id", user.id)
      .single();

    if (carrierError || !carrier?.stripe_connect_account_id) {
      return new Response(
        JSON.stringify({ 
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(carrier.stripe_connect_account_id);
    
    logStep("Account status retrieved", { 
      accountId: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });

    // Update carrier profile with latest status
    const { error: updateError } = await supabaseClient
      .from("carriers")
      .update({
        stripe_connect_enabled: account.charges_enabled && account.payouts_enabled,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        stripe_connect_details_submitted: account.details_submitted,
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Warning: Failed to update carrier status", { error: updateError });
    }

    return new Response(
      JSON.stringify({
        connected: account.charges_enabled && account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
