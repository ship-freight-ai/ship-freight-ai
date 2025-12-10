import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId, loadId, bidId } = await req.json();

    if (!paymentIntentId || !loadId || !bidId) {
      throw new Error("Missing required fields (paymentIntentId, loadId, bidId)");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify payment exists and belongs to user
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("load_id", loadId)
      .eq("shipper_id", user.id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found or unauthorized");
    }

    // Confirm the payment intent (capture later)
    // Note: In client-side flow, it might already be confirmed. 
    // We check status first.
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'requires_confirmation') {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    }

    if (paymentIntent.status !== "requires_capture" && paymentIntent.status !== "succeeded") {
      // succeeded covers cases where capture_method is manual but it might have auto-captured (though we set manual)
      // or if it was already authorized.
      // Ideally "requires_capture" for auth/capture flow.
      throw new Error(`Payment status is ${paymentIntent.status}, expected requires_capture`);
    }

    // Update payment status to held in escrow
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "held_in_escrow",
        escrow_held_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      throw new Error("Failed to update payment status");
    }

    // --- ATOMIC BOOKING LOGIC ---

    // 1. Mark Bid as Accepted
    const { error: bidError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId);

    if (bidError) throw new Error("Failed to accept bid: " + bidError.message);

    // 2. Reject other bids
    await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("load_id", loadId)
      .neq("id", bidId)
      .eq("status", "pending");

    // 3. Mark Load as Booked & Assign Carrier
    // We need the carrier_id from the bid (or payment)
    const { error: loadError } = await supabase
      .from("loads")
      .update({
        status: "booked", // Important: This reveals pickup_ref
        carrier_id: payment.carrier_id
      })
      .eq("id", loadId);

    if (loadError) throw new Error("Failed to update load status: " + loadError.message);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
