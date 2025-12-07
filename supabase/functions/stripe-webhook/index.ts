import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Product IDs mapping
const PRODUCT_IDS = {
  shipper: ['prod_TOUrUZfOSR8OHW', 'prod_TOUrt7mEaAnTk6'],
  carrier: ['prod_TOUrRWJhc9lzQW', 'prod_TOUrAvox3EalB1']
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: `Webhook Error: ${errorMessage}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) {
          throw new Error("Customer has no email");
        }

        // Get user_id from email
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("email", customer.email)
          .single();

        if (profileError || !profile) {
          logStep("Profile not found for email", { email: customer.email });
          throw new Error(`No profile found for email: ${customer.email}`);
        }

        // Get price details to determine plan type and billing cycle
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const productId = price.product as string;

        let planType: string;
        if (PRODUCT_IDS.shipper.includes(productId)) {
          planType = 'shipper';
        } else if (PRODUCT_IDS.carrier.includes(productId)) {
          planType = 'carrier';
        } else {
          throw new Error(`Unknown product ID: ${productId}`);
        }

        const billingCycle = price.recurring?.interval === 'year' ? 'annual' : 'monthly';
        const isNewSubscription = event.type === 'customer.subscription.created';

        // Upsert subscription data
        const { data: subData, error: upsertError } = await supabaseClient
          .from("subscriptions")
          .upsert({
            user_id: profile.user_id,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_product_id: productId,
            plan_type: planType,
            billing_cycle: billingCycle,
            seats: subscription.items.data[0].quantity || 1,
            seats_used: isNewSubscription ? 1 : undefined, // Initialize to 1 for new subscriptions (owner claims first seat)
            status: subscription.status,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError });
          throw upsertError;
        }

        // Update profile with subscription_id if this is a new subscription
        if (isNewSubscription && subData) {
          await supabaseClient
            .from('profiles')
            .update({ subscription_id: subData.id })
            .eq('user_id', profile.user_id)
            .is('subscription_id', null);
        }

        logStep("Subscription updated successfully", { userId: profile.user_id });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

        // Delete subscription from database
        const { error: deleteError } = await supabaseClient
          .from("subscriptions")
          .delete()
          .eq("stripe_subscription_id", subscription.id);

        if (deleteError) {
          logStep("Error deleting subscription", { error: deleteError });
          throw deleteError;
        }

        logStep("Subscription deleted successfully");
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Trial ending soon", { 
          subscriptionId: subscription.id,
          trialEnd: subscription.trial_end 
        });
        // You could send an email notification here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
