import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-RELEASE-PAYMENTS] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get payments that should be auto-released
    logStep("Calling auto_release_old_payments function");
    const { data: paymentsData, error: functionError } = await supabaseClient.rpc(
      "auto_release_old_payments"
    );

    if (functionError) {
      logStep("ERROR calling function", { error: functionError.message });
      throw new Error(`Failed to get payments: ${functionError.message}`);
    }

    const paymentIds = paymentsData?.payment_ids || [];
    const count = paymentsData?.count || 0;

    logStep("Payments to auto-release", { count });

    if (count === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          released_count: 0,
          message: "No payments to auto-release"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each payment
    for (const paymentId of paymentIds) {
      try {
        logStep("Processing payment", { paymentId });

        // Get payment details
        const { data: payment, error: paymentError } = await supabaseClient
          .from("payments")
          .select("*, loads!inner(*)")
          .eq("id", paymentId)
          .single();

        if (paymentError || !payment) {
          logStep("ERROR fetching payment", { paymentId, error: paymentError?.message });
          failedCount++;
          continue;
        }

        // Capture the payment intent in Stripe
        logStep("Capturing Stripe payment", { 
          paymentIntentId: payment.stripe_payment_intent_id 
        });
        
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

        // Update payment status to released
        const { error: updateError } = await supabaseClient
          .from("payments")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

        if (updateError) {
          logStep("ERROR updating payment", { paymentId, error: updateError.message });
          failedCount++;
          continue;
        }

        // Update load status to completed
        const { error: loadError } = await supabaseClient
          .from("loads")
          .update({ status: "completed" })
          .eq("id", payment.load_id);

        if (loadError) {
          logStep("ERROR updating load", { loadId: payment.load_id, error: loadError.message });
        }

        logStep("Payment auto-released successfully", { paymentId });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR processing payment", { paymentId, error: errorMessage });
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        released_count: successCount,
        failed_count: failedCount,
        message: `Auto-released ${successCount} payments, ${failedCount} failed`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in auto-release-payments", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});