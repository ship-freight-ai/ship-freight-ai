import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get carrier profile
    const { data: carrier, error: carrierError } = await supabaseClient
      .from("carriers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (carrierError || !carrier) {
      throw new Error("Carrier profile not found");
    }

    // Check if already has Connect account
    if (carrier.stripe_connect_account_id) {
      logStep("Account already exists", { accountId: carrier.stripe_connect_account_id });
      return new Response(
        JSON.stringify({ 
          accountId: carrier.stripe_connect_account_id,
          exists: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "company",
      company: {
        name: carrier.company_name,
      },
      metadata: {
        user_id: user.id,
        carrier_id: carrier.id,
        dot_number: carrier.dot_number || "",
        mc_number: carrier.mc_number || "",
      },
    });

    logStep("Connect account created", { accountId: account.id });

    // Save account ID to carrier profile
    const { error: updateError } = await supabaseClient
      .from("carriers")
      .update({ 
        stripe_connect_account_id: account.id,
        stripe_connect_enabled: false,
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        accountId: account.id,
        exists: false 
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
