import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Test user emails that bypass Stripe checkout
const TEST_USERS = [
  'prod-shipper1@shipai.com',
  'prod-shipper2@shipai.com',
  'prod-shipper3@shipai.com',
  'prod-carrier1@shipai.com',
  'prod-carrier2@shipai.com',
  'prod-carrier3@shipai.com',
  'prod-carrier4@shipai.com',
  'prod-carrier5@shipai.com',
  'prod-carrier6@shipai.com',
  'prod-admin@shipai.com'
];

// Product IDs for dynamic plan type detection
const PRODUCT_IDS = {
  shipper: ['prod_TOUrUZfOSR8OHW', 'prod_TOUrt7mEaAnTk6'],
  carrier: ['prod_TOUrRWJhc9lzQW', 'prod_TOUrAvox3EalB1']
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
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      // If user doesn't exist, return unsubscribed state instead of erroring
      logStep("User not found, returning unsubscribed state", { error: userError.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: null,
        plan_type: null,
        billing_cycle: null,
        seats: 0,
        seats_used: 0,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
        is_owner: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if this is a test user - bypass Stripe entirely
    if (TEST_USERS.includes(user.email)) {
      logStep("Test user detected, bypassing Stripe", { email: user.email });
      
      // Determine plan type based on email prefix
      const planType = user.email.includes('shipper') ? 'shipper' : 'carrier';
      const trialEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year trial
      const currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Upsert test subscription to database
      const { data: dbSubscription } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: `test_customer_${user.id}`,
          stripe_subscription_id: `test_sub_${user.id}`,
          stripe_product_id: `test_product_${planType}`,
          plan_type: planType,
          billing_cycle: 'monthly',
          seats: 10,
          seats_used: 0,
          status: 'trialing',
          current_period_start: new Date().toISOString(),
          current_period_end: currentPeriodEnd,
          trial_start: new Date().toISOString(),
          trial_end: trialEnd,
          cancel_at_period_end: false
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      // Update profile with subscription_id
      if (dbSubscription) {
        await supabaseClient
          .from('profiles')
          .update({ subscription_id: dbSubscription.id })
          .eq('user_id', user.id)
          .is('subscription_id', null);
      }

      logStep("Test user subscription granted", { planType, seats: 10 });

      return new Response(JSON.stringify({
        subscribed: true,
        status: 'trialing',
        plan_type: planType,
        billing_cycle: 'monthly',
        seats: 10,
        seats_used: dbSubscription?.seats_used || 0,
        trial_end: trialEnd,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        is_owner: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user has a subscription via team invite
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.subscription_id) {
      // User is part of a team, get the subscription
      const { data: teamSubscription } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("id", profile.subscription_id)
        .single();

      if (teamSubscription && ['active', 'trialing'].includes(teamSubscription.status)) {
        const isOwner = teamSubscription.user_id === user.id;
        logStep("User is part of a team subscription", { subscriptionId: teamSubscription.id, isOwner });

        return new Response(JSON.stringify({
          subscribed: true,
          status: teamSubscription.status,
          plan_type: teamSubscription.plan_type,
          billing_cycle: teamSubscription.billing_cycle,
          seats: teamSubscription.seats,
          seats_used: teamSubscription.seats_used,
          trial_end: teamSubscription.trial_end,
          current_period_end: teamSubscription.current_period_end,
          cancel_at_period_end: teamSubscription.cancel_at_period_end,
          is_owner: isOwner,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: null,
        plan_type: null,
        billing_cycle: null,
        seats: 0,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    // Find active or trialing subscription
    const activeSub = subscriptions.data.find((sub: any) => 
      ['active', 'trialing'].includes(sub.status)
    );

    if (!activeSub) {
      logStep("No active subscription found");
      
      // Delete from local DB if exists
      await supabaseClient
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        subscribed: false,
        status: null,
        plan_type: null,
        billing_cycle: null,
        seats: 0,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Active subscription found", { subscriptionId: activeSub.id, status: activeSub.status });

    // Extract subscription details
    const productId = activeSub.items.data[0].price.product as string;
    const priceId = activeSub.items.data[0].price.id;
    const seats = activeSub.items.data[0].quantity || 1;
    const currentPeriodEnd = new Date(activeSub.current_period_end * 1000).toISOString();
    const currentPeriodStart = new Date(activeSub.current_period_start * 1000).toISOString();
    const trialEnd = activeSub.trial_end ? new Date(activeSub.trial_end * 1000).toISOString() : null;
    const trialStart = activeSub.trial_start ? new Date(activeSub.trial_start * 1000).toISOString() : null;

    // Fetch price details to dynamically determine plan type and billing cycle
    const priceDetails = await stripe.prices.retrieve(priceId);
    const interval = priceDetails.recurring?.interval; // 'month' or 'year'
    const priceProductId = priceDetails.product as string;

    logStep("Price details retrieved", { interval, priceProductId });

    // Determine billing cycle from interval
    const billingCycle: 'monthly' | 'annual' = interval === 'year' ? 'annual' : 'monthly';

    // Determine plan type from product ID
    let planType: 'shipper' | 'carrier';
    if (PRODUCT_IDS.shipper.includes(priceProductId)) {
      planType = 'shipper';
    } else if (PRODUCT_IDS.carrier.includes(priceProductId)) {
      planType = 'carrier';
    } else {
      logStep("Unknown product ID", { priceProductId });
      throw new Error(`Unknown product type: ${priceProductId}`);
    }

    logStep("Subscription details extracted", { planType, billingCycle, seats });

    // Upsert to subscriptions table
    const { data: dbSubscription, error: upsertError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: activeSub.id,
        stripe_product_id: productId,
        plan_type: planType,
        billing_cycle: billingCycle,
        seats: seats,
        status: activeSub.status,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        trial_start: trialStart,
        trial_end: trialEnd,
        cancel_at_period_end: activeSub.cancel_at_period_end
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (upsertError) {
      logStep("Error upserting subscription", { error: upsertError });
    } else {
      logStep("Subscription synced to database");
    }

    // Update profile with subscription_id if not already set
    if (dbSubscription) {
      await supabaseClient
        .from('profiles')
        .update({ subscription_id: dbSubscription.id })
        .eq('user_id', user.id)
        .is('subscription_id', null);
    }

    return new Response(JSON.stringify({
      subscribed: true,
      status: activeSub.status,
      plan_type: planType,
      billing_cycle: billingCycle,
      seats: seats,
      seats_used: dbSubscription?.seats_used || 0,
      trial_end: trialEnd,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: activeSub.cancel_at_period_end,
      is_owner: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
