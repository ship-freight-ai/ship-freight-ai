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
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per minute for authenticated users

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
    // Initialize Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user for rate limiting
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

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

    const { loadId, amount, carrierId } = await req.json();

    // Validate required fields
    if (!loadId || !amount || !carrierId) {
      throw new Error("Missing required fields");
    }

    // Validate amount: must be positive number with reasonable limits
    if (typeof amount !== 'number' || amount <= 0 || amount > 10000000) {
      throw new Error("Invalid amount: must be a positive number not exceeding $100,000");
    }

    // Validate amount precision (max 2 decimal places for currency)
    if (!Number.isInteger(amount * 100)) {
      throw new Error("Invalid amount: maximum 2 decimal places allowed");
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

    // Verify load exists and user is the shipper (user from initial auth check)
    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("*")
      .eq("id", loadId)
      .eq("shipper_id", user.id)
      .single();

    if (loadError || !load) {
      throw new Error("Load not found or unauthorized");
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        load_id: loadId,
        carrier_id: carrierId,
        shipper_id: user.id,
      },
      capture_method: "manual", // Hold funds in escrow
      description: `Payment for load ${loadId}`,
    });

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        load_id: loadId,
        shipper_id: user.id,
        carrier_id: carrierId,
        amount: amount,
        status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment creation error:", paymentError);
      throw new Error("Failed to create payment record");
    }

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        payment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment intent creation error:", error);
    
    // Return sanitized error message
    let errorMessage = "Failed to create payment. Please try again.";
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        errorMessage = "Authentication required.";
        statusCode = 401;
      } else if (error.message === "Missing required fields") {
        errorMessage = "Invalid request. Please check all required fields.";
      } else if (error.message === "Load not found or unauthorized") {
        errorMessage = "Unable to process payment for this load.";
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
