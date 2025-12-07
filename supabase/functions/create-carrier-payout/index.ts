import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CARRIER-PAYOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Platform fee percentage (3%)
const PLATFORM_FEE_PERCENTAGE = 0.03;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { loadId } = await req.json();
    if (!loadId) throw new Error("loadId is required");

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

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("load_id", loadId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // Verify user is the shipper
    if (payment.shipper_id !== user.id) {
      throw new Error("Unauthorized: Only shipper can release payment");
    }

    // Check payment status
    if (payment.status !== "held_in_escrow") {
      throw new Error("Payment must be in escrow to release");
    }

    // Get carrier's Connect account
    const { data: carrier, error: carrierError } = await supabaseClient
      .from("carriers")
      .select("stripe_connect_account_id, stripe_connect_enabled, user_id")
      .eq("user_id", payment.carrier_id)
      .single();

    if (carrierError || !carrier) {
      throw new Error("Carrier not found");
    }

    if (!carrier.stripe_connect_account_id || !carrier.stripe_connect_enabled) {
      throw new Error("Carrier has not connected their Stripe account");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Calculate platform fee (3% of total amount)
    const amountCents = Math.round(payment.amount * 100);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE);
    const carrierAmountCents = amountCents - platformFeeCents;

    logStep("Calculated amounts", { 
      amountCents, 
      platformFeeCents, 
      carrierAmountCents 
    });

    // Create transfer to carrier's Connect account
    const transfer = await stripe.transfers.create({
      amount: carrierAmountCents,
      currency: "usd",
      destination: carrier.stripe_connect_account_id,
      description: `Payout for Load #${loadId.substring(0, 8)}`,
      metadata: {
        load_id: loadId,
        payment_id: payment.id,
        carrier_id: carrier.user_id,
        shipper_id: payment.shipper_id,
        platform_fee_cents: platformFeeCents.toString(),
      },
    });

    logStep("Transfer created", { transferId: transfer.id });

    // Create payout record
    const { data: payout, error: payoutError } = await supabaseClient
      .from("carrier_payouts")
      .insert({
        carrier_id: carrier.user_id,
        payment_id: payment.id,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        carrier_amount_cents: carrierAmountCents,
        stripe_transfer_id: transfer.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    // Update payment status to released
    const { error: updatePaymentError } = await supabaseClient
      .from("payments")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id,
      })
      .eq("id", payment.id);

    if (updatePaymentError) throw updatePaymentError;

    // Update load status to completed
    const { error: updateLoadError } = await supabaseClient
      .from("loads")
      .update({ status: "completed" })
      .eq("id", loadId);

    if (updateLoadError) {
      logStep("Warning: Failed to update load status", { error: updateLoadError });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        payout,
        transfer: {
          id: transfer.id,
          amount: carrierAmountCents / 100,
          platform_fee: platformFeeCents / 100,
        }
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
