import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEED-TEST-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting test data seeding");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Calculate 1 year from now for trial
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Test user credentials - 2 users with 1-year free trial
    const testUsers = [
      { email: "test-shipper@shipai.com", password: "TestShip123!", role: "shipper", fullName: "Test Shipper", companyName: "Test Shipping Co", planType: "shipper" },
      { email: "test-carrier@shipai.com", password: "TestCarrier123!", role: "carrier", fullName: "Test Carrier", companyName: "Test Carrier LLC", planType: "carrier" },
    ];

    const createdUsers: any[] = [];

    // Create test users
    logStep("Creating test users with 1-year trial and 5 seats");
    for (const user of testUsers) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        }
      });

      if (authError) {
        logStep(`Error creating user ${user.email}`, { error: authError.message });
        continue;
      }

      logStep(`Created user: ${user.email}`, { id: authData.user.id });

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          email: user.email,
          full_name: user.fullName,
          company_name: user.companyName,
          role: user.role,
        });

      if (profileError) {
        logStep(`Error creating profile for ${user.email}`, { error: profileError.message });
      }

      // Create subscription with 1-year free trial and 5 seats
      const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: authData.user.id,
          stripe_customer_id: `cus_trial_${authData.user.id.substring(0, 8)}`,
          stripe_subscription_id: `sub_trial_${authData.user.id.substring(0, 8)}`,
          plan_type: user.planType,
          billing_cycle: "annual",
          seats: 5,
          seats_used: 1,
          status: "trialing",
          current_period_start: now.toISOString(),
          current_period_end: oneYearFromNow.toISOString(),
          trial_start: now.toISOString(),
          trial_end: oneYearFromNow.toISOString(),
          cancel_at_period_end: false,
        })
        .select()
        .single();

      if (subscriptionError) {
        logStep(`Error creating subscription for ${user.email}`, { error: subscriptionError.message });
      } else {
        logStep(`Created 1-year trial subscription for ${user.email}`, {
          subscriptionId: subscriptionData?.id,
          trialEnd: oneYearFromNow.toISOString(),
          seats: 5
        });

        // Update profile with subscription_id
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_id: subscriptionData.id })
          .eq("user_id", authData.user.id);
      }

      createdUsers.push({ ...user, id: authData.user.id });
    }

    const shipper = createdUsers.find(u => u.role === "shipper");
    const carrier1 = createdUsers.find(u => u.role === "carrier");

    // Create carrier profiles
    if (carrier1) {
      logStep("Creating carrier profile");
      await supabaseAdmin.from("carriers").insert({
        user_id: carrier1.id,
        company_name: "Test Carrier LLC",
        dot_number: "123456",
        mc_number: "MC123456",
        equipment_types: ["dry_van", "reefer", "flatbed"],
        service_areas: ["CA", "NV", "AZ", "TX"],
        capacity: 10,
        rating: 5.0,
        total_loads: 0,
        on_time_percentage: 100,
        verification_status: "verified",
        insurance_amount: 1000000,
        insurance_expiry: oneYearFromNow.toISOString().split('T')[0],
      });
    }

    // Create sample loads
    if (shipper) {
      logStep("Creating sample loads");
      const loads = [
        {
          shipper_id: shipper.id,
          origin_address: "1234 Warehouse Blvd",
          origin_city: "Los Angeles",
          origin_state: "CA",
          origin_zip: "90001",
          origin_lat: 34.0522,
          origin_lng: -118.2437,
          destination_address: "5678 Distribution Dr",
          destination_city: "Phoenix",
          destination_state: "AZ",
          destination_zip: "85001",
          destination_lat: 33.4484,
          destination_lng: -112.0740,
          pickup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "dry_van",
          weight: 25000,
          commodity: "Electronics",
          posted_rate: 1200,
          distance_miles: 373,
          status: "posted",
        },
        {
          shipper_id: shipper.id,
          origin_address: "9012 Industrial Pkwy",
          origin_city: "San Diego",
          origin_state: "CA",
          origin_zip: "92101",
          origin_lat: 32.7157,
          origin_lng: -117.1611,
          destination_address: "3456 Commerce St",
          destination_city: "Las Vegas",
          destination_state: "NV",
          destination_zip: "89101",
          destination_lat: 36.1699,
          destination_lng: -115.1398,
          pickup_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "reefer",
          weight: 30000,
          commodity: "Frozen Foods",
          posted_rate: 1500,
          distance_miles: 332,
          status: "posted",
        },
        {
          shipper_id: shipper.id,
          origin_address: "7890 Factory Rd",
          origin_city: "Dallas",
          origin_state: "TX",
          origin_zip: "75201",
          origin_lat: 32.7767,
          origin_lng: -96.7970,
          destination_address: "2345 Port Ave",
          destination_city: "Houston",
          destination_state: "TX",
          destination_zip: "77001",
          destination_lat: 29.7604,
          destination_lng: -95.3698,
          pickup_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "flatbed",
          weight: 40000,
          commodity: "Steel Beams",
          posted_rate: 800,
          distance_miles: 239,
          status: "bidding",
        },
        {
          shipper_id: shipper.id,
          carrier_id: carrier1?.id,
          origin_address: "4567 Loading Dock",
          origin_city: "Sacramento",
          origin_state: "CA",
          origin_zip: "95814",
          origin_lat: 38.5816,
          origin_lng: -121.4944,
          destination_address: "8901 Receiving Bay",
          destination_city: "Reno",
          destination_state: "NV",
          destination_zip: "89501",
          destination_lat: 39.5296,
          destination_lng: -119.8138,
          pickup_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "dry_van",
          weight: 22000,
          commodity: "Furniture",
          posted_rate: 900,
          booked_rate: 850,
          distance_miles: 132,
          status: "booked",
        },
        {
          shipper_id: shipper.id,
          carrier_id: carrier1?.id,
          origin_address: "6543 Shipping Center",
          origin_city: "Austin",
          origin_state: "TX",
          origin_zip: "73301",
          origin_lat: 30.2672,
          origin_lng: -97.7431,
          destination_address: "2109 Delivery Point",
          destination_city: "San Antonio",
          destination_state: "TX",
          destination_zip: "78201",
          destination_lat: 29.4241,
          destination_lng: -98.4936,
          pickup_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "flatbed",
          weight: 35000,
          commodity: "Construction Materials",
          posted_rate: 600,
          booked_rate: 580,
          distance_miles: 80,
          status: "in_transit",
        },
        {
          shipper_id: shipper.id,
          carrier_id: carrier1?.id,
          origin_address: "3210 Freight Terminal",
          origin_city: "San Francisco",
          origin_state: "CA",
          origin_zip: "94102",
          origin_lat: 37.7749,
          origin_lng: -122.4194,
          destination_address: "7654 Drop Zone",
          destination_city: "Portland",
          destination_state: "OR",
          destination_zip: "97201",
          destination_lat: 45.5152,
          destination_lng: -122.6784,
          pickup_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "reefer",
          weight: 28000,
          commodity: "Pharmaceuticals",
          posted_rate: 2200,
          booked_rate: 2100,
          distance_miles: 635,
          status: "delivered",
        },
        {
          shipper_id: shipper.id,
          carrier_id: carrier1?.id,
          origin_address: "9876 Export Hub",
          origin_city: "El Paso",
          origin_state: "TX",
          origin_zip: "79901",
          origin_lat: 31.7619,
          origin_lng: -106.4850,
          destination_address: "5432 Import Center",
          destination_city: "Albuquerque",
          destination_state: "NM",
          destination_zip: "87101",
          destination_lat: 35.0844,
          destination_lng: -106.6504,
          pickup_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          delivery_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          equipment_type: "dry_van",
          weight: 20000,
          commodity: "Retail Goods",
          posted_rate: 750,
          booked_rate: 720,
          distance_miles: 267,
          status: "completed",
        },
      ];

      const { data: createdLoads, error: loadsError } = await supabaseAdmin
        .from("loads")
        .insert(loads)
        .select();

      if (loadsError) {
        logStep("Error creating loads", { error: loadsError.message });
      } else {
        logStep(`Created ${createdLoads.length} loads`);

        // Create bids for loads in "bidding" status
        const biddingLoad = createdLoads.find(l => l.status === "bidding");
        if (biddingLoad && carrier1) {
          logStep("Creating bids");
          await supabaseAdmin.from("bids").insert([
            {
              load_id: biddingLoad.id,
              carrier_id: carrier1.id,
              bid_amount: 750,
              status: "pending",
              notes: "Can deliver early if needed",
              expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            }
          ]);
        }

        // Create accepted bids for booked loads
        const bookedLoad = createdLoads.find(l => l.status === "booked" && l.carrier_id === carrier1?.id);
        if (bookedLoad && carrier1) {
          await supabaseAdmin.from("bids").insert({
            load_id: bookedLoad.id,
            carrier_id: carrier1.id,
            bid_amount: 850,
            status: "accepted",
            notes: "Looking forward to working with you",
            expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Create payments for booked/in_transit/delivered/completed loads
        const paidLoads = createdLoads.filter(l => ["booked", "in_transit", "delivered", "completed"].includes(l.status));
        for (const load of paidLoads) {
          let paymentStatus = "pending";
          let escrowed = null;
          let released = null;

          if (load.status === "in_transit" || load.status === "delivered") {
            paymentStatus = "escrow";
            escrowed = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
          } else if (load.status === "completed") {
            paymentStatus = "released";
            escrowed = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
            released = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString();
          }

          await supabaseAdmin.from("payments").insert({
            load_id: load.id,
            shipper_id: load.shipper_id,
            carrier_id: load.carrier_id,
            amount: load.booked_rate || load.posted_rate,
            status: paymentStatus,
            stripe_payment_intent_id: `pi_test_${Math.random().toString(36).substring(7)}`,
            escrow_held_at: escrowed,
            released_at: released,
          });
        }

        // Create messages
        // Create messages
        if (carrier1) {
          logStep("Creating messages");
          const messages = [];

          for (const load of createdLoads.slice(0, 3)) {
            const carrier = carrier1;

            messages.push({
              load_id: load.id,
              sender_id: shipper.id,
              receiver_id: carrier.id,
              message: `Hi, I'm interested in this load. Can you confirm pickup time?`,
              read: true,
            });

            messages.push({
              load_id: load.id,
              sender_id: carrier.id,
              receiver_id: shipper.id,
              message: `Sure! I can pick up anytime between 8am-5pm. What works best for you?`,
              read: Math.random() > 0.5,
            });
          }

          await supabaseAdmin.from("messages").insert(messages);
        }
      }
    }

    logStep("Test data seeding completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test data created successfully",
        users: testUsers.map(u => ({ email: u.email, password: u.password, role: u.role })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in seed-test-data", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
