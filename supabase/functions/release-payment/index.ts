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
    const { loadId, finalAmount, notes } = await req.json();

    if (!loadId) {
      throw new Error("Missing loadId");
    }

    // ... (Init Stripe & Supabase & Auth - skipped for brevity in replacement if context allows, but here we replace block)
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get payment and verify
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("load_id", loadId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // Verify user is shipper or load is delivered
    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("*")
      .eq("id", loadId)
      .single();

    if (loadError || !load) {
      throw new Error("Load not found");
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some(r => r.role === "admin");

    if (load.shipper_id !== user.id || load.status !== "delivered") {
      throw new Error("Unauthorized or load not delivered");
    }

    if (payment.status !== "held_in_escrow") {
      throw new Error("Payment not in escrow");
    }

    // ... (BOL Check omitted for brevity if not changing, but let's keep robust)
    if (!isAdmin) {
      const { data: bolDocument } = await supabase
        .from("documents")
        .select("approved")
        .eq("load_id", loadId)
        .in("document_type", ["bol", "pod"])
        .eq("approved", true)
        .maybeSingle();

      if (!bolDocument) {
        throw new Error("BOL approval required before payment release");
      }
    }

    // Determine capture amount
    let captureAmount = payment.amount; // Default to full amount
    if (finalAmount !== undefined && finalAmount !== null) {
      if (finalAmount > payment.amount) {
        // For now, disallow capturing MORE than auth. 
        // In future, could support creating separate charge.
        throw new Error("Final amount cannot exceed authorized amount (Escrow)");
      }
      captureAmount = finalAmount;
    }

    // Capture the payment intent
    const captureOptions: any = {};
    if (captureAmount < payment.amount) {
      captureOptions.amount_to_capture = captureAmount;
    }

    const paymentIntent = await stripe.paymentIntents.capture(
      payment.stripe_payment_intent_id!,
      captureOptions
    );

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment capture failed");
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
        final_amount: captureAmount,
        notes: notes || payment.notes
      })
      .eq("id", payment.id);

    if (updateError) {
      throw new Error("Failed to update payment status");
    }

    // Update load status to completed
    await supabase
      .from("loads")
      .update({ status: "completed" })
      .eq("id", loadId);

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
    console.error("Payment release error:", error);

    // Return sanitized error message
    let errorMessage = "Failed to release payment. Please try again.";
    let statusCode = 400;

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        errorMessage = "Authentication required.";
        statusCode = 401;
      } else if (error.message === "Payment not found") {
        errorMessage = "Payment not found.";
        statusCode = 404;
      } else if (error.message.includes("Unauthorized") || error.message.includes("not delivered")) {
        errorMessage = "Unable to release payment at this time.";
        statusCode = 403;
      } else if (error.message === "Payment not in escrow") {
        errorMessage = "Payment cannot be released in current status.";
      } else if (error.message === "BOL approval required before payment release") {
        errorMessage = "Please approve the BOL document before releasing payment.";
        statusCode = 403;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  }
});
