import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Stripe Price IDs mapping
const PRICE_IDS = {
  shipper: {
    monthly: 'price_1SRhrTIDIFYMfhzZad5Li25L',
    annual: 'price_1SRhrgIDIFYMfhzZ02fOtTrI'
  },
  carrier: {
    monthly: 'price_1SRhrmIDIFYMfhzZV3fYVgKZ',
    annual: 'price_1SRhrpIDIFYMfhzZ9HtUFaTI'
  }
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { seats, billingCycle } = await req.json();
    if (!seats || !billingCycle) {
      throw new Error("Missing required fields: seats, billingCycle");
    }
    if (seats < 1 || seats > 100) {
      throw new Error("Seats must be between 1 and 100");
    }
    if (!['monthly', 'annual'].includes(billingCycle)) {
      throw new Error("billingCycle must be 'monthly' or 'annual'");
    }
    logStep("Request validated", { seats, billingCycle });

    // Get user's role from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.role) {
      throw new Error("User profile not found or role not set");
    }
    logStep("User profile retrieved", { role: profile.role });

    // Map role to price ID
    const planType = profile.role as 'shipper' | 'carrier';
    const priceId = PRICE_IDS[planType]?.[billingCycle as 'monthly' | 'annual'];
    
    if (!priceId) {
      throw new Error(`No price found for ${planType} ${billingCycle}`);
    }
    logStep("Price ID determined", { planType, billingCycle, priceId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });

      // Check if user already has an active subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });

      const activeSub = existingSubs.data.find((sub: any) => 
        ['active', 'trialing'].includes(sub.status)
      );

      if (activeSub) {
        throw new Error("User already has an active subscription. Please manage it from the billing page.");
      }
    } else {
      logStep("No existing customer, will create during checkout");
      customerId = '';
    }

    // Create checkout session with 14-day trial
    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL");
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: user.id,
          plan_type: planType,
          seats: seats.toString()
        }
      },
      success_url: `${origin}/app/billing/success`,
      cancel_url: `${origin}/app/billing`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
