import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: store request timestamps per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute for admin operations

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { loadId, releaseToCarrier } = await req.json();

    if (!loadId || typeof releaseToCarrier !== "boolean") {
      throw new Error("Missing required fields");
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

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify user is admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!userRole) {
      throw new Error("Unauthorized - Admin only");
    }

    // Get payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("load_id", loadId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "disputed") {
      throw new Error("Payment is not disputed");
    }

    let newStatus = "completed";
    let stripeAction = null;

    if (releaseToCarrier) {
      // Release payment to carrier if not already captured
      if (payment.status === "held_in_escrow") {
        stripeAction = await stripe.paymentIntents.capture(
          payment.stripe_payment_intent_id!
        );
      }
      newStatus = "released";
    } else {
      // Refund to shipper
      if (payment.stripe_payment_intent_id) {
        stripeAction = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
        });
      }
      newStatus = "completed";
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        completed_at: new Date().toISOString(),
        dispute_reason: null,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update payment status");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: releaseToCarrier
          ? "Payment released to carrier"
          : "Payment refunded to shipper",
        stripeAction,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Dispute resolution error:", error);
    
    // Return sanitized error message
    let errorMessage = "Failed to resolve dispute. Please try again.";
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        errorMessage = "Authentication required.";
        statusCode = 401;
      } else if (error.message === "Unauthorized - Admin only") {
        errorMessage = "Insufficient permissions.";
        statusCode = 403;
      } else if (error.message === "Missing required fields") {
        errorMessage = "Invalid request. Please check all required fields.";
      } else if (error.message === "Payment not found") {
        errorMessage = "Payment not found.";
        statusCode = 404;
      } else if (error.message === "Payment is not disputed") {
        errorMessage = "No active dispute for this payment.";
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
