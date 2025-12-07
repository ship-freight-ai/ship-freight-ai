import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEED-PRODUCTION-DATA] ${step}${detailsStr}`);
};

// Realistic data pools
const cities = [
  { name: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lng: -118.2437 },
  { name: "San Francisco", state: "CA", zip: "94102", lat: 37.7749, lng: -122.4194 },
  { name: "San Diego", state: "CA", zip: "92101", lat: 32.7157, lng: -117.1611 },
  { name: "Sacramento", state: "CA", zip: "95814", lat: 38.5816, lng: -121.4944 },
  { name: "Phoenix", state: "AZ", zip: "85001", lat: 33.4484, lng: -112.0740 },
  { name: "Tucson", state: "AZ", zip: "85701", lat: 32.2226, lng: -110.9747 },
  { name: "Las Vegas", state: "NV", zip: "89101", lat: 36.1699, lng: -115.1398 },
  { name: "Reno", state: "NV", zip: "89501", lat: 39.5296, lng: -119.8138 },
  { name: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lng: -96.7970 },
  { name: "Houston", state: "TX", zip: "77001", lat: 29.7604, lng: -95.3698 },
  { name: "Austin", state: "TX", zip: "78701", lat: 30.2672, lng: -97.7431 },
  { name: "San Antonio", state: "TX", zip: "78201", lat: 29.4241, lng: -98.4936 },
  { name: "Portland", state: "OR", zip: "97201", lat: 45.5152, lng: -122.6784 },
  { name: "Seattle", state: "WA", zip: "98101", lat: 47.6062, lng: -122.3321 },
  { name: "Denver", state: "CO", zip: "80202", lat: 39.7392, lng: -104.9903 },
  { name: "Albuquerque", state: "NM", zip: "87101", lat: 35.0844, lng: -106.6504 },
  { name: "El Paso", state: "TX", zip: "79901", lat: 31.7619, lng: -106.4850 },
  { name: "Oklahoma City", state: "OK", zip: "73102", lat: 35.4676, lng: -97.5164 },
  { name: "Kansas City", state: "MO", zip: "64101", lat: 39.0997, lng: -94.5786 },
  { name: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lng: -87.6298 },
];

const commodities = [
  "Electronics", "Furniture", "Frozen Foods", "Pharmaceuticals", "Retail Goods",
  "Construction Materials", "Steel Beams", "Lumber", "Paper Products", "Textiles",
  "Automotive Parts", "Machinery", "Chemicals", "Food & Beverages", "Consumer Goods",
  "Building Supplies", "Medical Equipment", "Agricultural Products", "Industrial Equipment"
];

const equipmentTypes = ["dry_van", "reefer", "flatbed", "step_deck", "lowboy", "box_truck"];

const loadStatuses = ["posted", "bidding", "booked", "in_transit", "delivered", "completed"];

const streetPrefixes = ["Warehouse", "Industrial", "Distribution", "Freight", "Shipping", "Loading", "Commerce", "Factory", "Port", "Terminal"];
const streetSuffixes = ["Blvd", "Dr", "Pkwy", "Ave", "St", "Rd", "Way", "Center", "Hub", "Point"];

const generateAddress = () => {
  const number = Math.floor(Math.random() * 9000) + 1000;
  const prefix = streetPrefixes[Math.floor(Math.random() * streetPrefixes.length)];
  const suffix = streetSuffixes[Math.floor(Math.random() * streetSuffixes.length)];
  return `${number} ${prefix} ${suffix}`;
};

const randomDate = (daysFromNow: number, variance: number) => {
  const baseDate = Date.now() + (daysFromNow * 24 * 60 * 60 * 1000);
  const offset = (Math.random() - 0.5) * variance * 24 * 60 * 60 * 1000;
  return new Date(baseDate + offset).toISOString().split('T')[0];
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

const messageTemplates = [
  { sender: "shipper", text: "Can you confirm the pickup time for this load?" },
  { sender: "carrier", text: "I can pick up anytime between 8am-5pm. What works best for you?" },
  { sender: "shipper", text: "9am would be perfect. Please arrive at the loading dock." },
  { sender: "carrier", text: "Confirmed for 9am. I'll call when I'm 30 minutes out." },
  { sender: "shipper", text: "Is the load secured properly? Any special handling requirements?" },
  { sender: "carrier", text: "Yes, everything is secured with straps and tarps as needed." },
  { sender: "carrier", text: "I'm currently 2 hours away from the delivery location." },
  { sender: "shipper", text: "Great! The receiving dock closes at 6pm, so you're on schedule." },
  { sender: "carrier", text: "Just delivered the load. POD has been uploaded." },
  { sender: "shipper", text: "Thank you! I'll review the POD and release payment today." },
  { sender: "shipper", text: "What's your availability for next week?" },
  { sender: "carrier", text: "I have capacity available Tuesday through Friday." },
  { sender: "shipper", text: "Do you have refrigeration capability for this load?" },
  { sender: "carrier", text: "Yes, my trailer maintains 34-38°F consistently." },
  { sender: "shipper", text: "Can you accommodate a stop for partial unload?" },
  { sender: "carrier", text: "Absolutely, just let me know the address and timing." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting production data seeding - 100 loads, 100+ messages");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Create 10 test users (3 shippers, 6 carriers, 1 admin)
    const testUsers = [
      { email: "prod-shipper1@shipai.com", password: "ProdShip123!", role: "shipper", fullName: "Mike Johnson", companyName: "Johnson Freight Co" },
      { email: "prod-shipper2@shipai.com", password: "ProdShip123!", role: "shipper", fullName: "Sarah Williams", companyName: "Williams Logistics" },
      { email: "prod-shipper3@shipai.com", password: "ProdShip123!", role: "shipper", fullName: "David Chen", companyName: "Chen Supply Chain" },
      { email: "prod-carrier1@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Tom Driver", companyName: "Express Transport LLC" },
      { email: "prod-carrier2@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Lisa Trucker", companyName: "Swift Haul Inc" },
      { email: "prod-carrier3@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Mark Roads", companyName: "Roads Logistics" },
      { email: "prod-carrier4@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Emma Wheeler", companyName: "Wheeler Transport" },
      { email: "prod-carrier5@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Jake Mason", companyName: "Mason Freight" },
      { email: "prod-carrier6@shipai.com", password: "ProdCarrier123!", role: "carrier", fullName: "Rachel Stone", companyName: "Stone Carriers" },
      { email: "prod-admin@shipai.com", password: "ProdAdmin123!", role: "admin", fullName: "Admin User", companyName: "ShipAI Platform" },
    ];

    const createdUsers: any[] = [];

    // Create users
    logStep("Creating 10 production test users");
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

      await supabaseAdmin.from("profiles").insert({
        user_id: authData.user.id,
        email: user.email,
        full_name: user.fullName,
        company_name: user.companyName,
        role: user.role,
      });

      if (user.role === "admin") {
        await supabaseAdmin.from("user_roles").insert({
          user_id: authData.user.id,
          role: "admin",
        });
      }

      createdUsers.push({ ...user, id: authData.user.id });
    }

    const shippers = createdUsers.filter(u => u.role === "shipper");
    const carriers = createdUsers.filter(u => u.role === "carrier");

    // Create carrier profiles
    logStep("Creating carrier profiles with varied equipment and service areas");
    const carrierEquipment = [
      ["dry_van", "reefer"],
      ["flatbed", "step_deck"],
      ["dry_van"],
      ["reefer"],
      ["flatbed", "lowboy"],
      ["box_truck", "dry_van"],
    ];

    const serviceAreaSets = [
      ["CA", "NV", "AZ"],
      ["TX", "OK", "LA"],
      ["CA", "OR", "WA"],
      ["TX", "NM", "AZ"],
      ["IL", "MO", "KS"],
      ["CO", "UT", "WY"],
    ];

    for (let i = 0; i < carriers.length; i++) {
      await supabaseAdmin.from("carriers").insert({
        user_id: carriers[i].id,
        company_name: carriers[i].companyName,
        dot_number: String(100000 + i * 10000),
        mc_number: `MC${100000 + i * 10000}`,
        equipment_types: carrierEquipment[i % carrierEquipment.length],
        service_areas: serviceAreaSets[i % serviceAreaSets.length],
        capacity: Math.floor(Math.random() * 10) + 3,
        rating: 4.0 + Math.random() * 1.0,
        total_loads: Math.floor(Math.random() * 100) + 20,
        on_time_percentage: 90 + Math.floor(Math.random() * 10),
        verification_status: "verified",
        insurance_amount: 1000000 + (i * 500000),
        insurance_expiry: "2026-12-31",
      });
    }

    // Generate 100 loads
    logStep("Generating 100 loads with realistic data");
    const loads = [];
    
    for (let i = 0; i < 100; i++) {
      const shipper = shippers[i % shippers.length];
      const origin = cities[Math.floor(Math.random() * cities.length)];
      let destination = cities[Math.floor(Math.random() * cities.length)];
      while (destination.name === origin.name) {
        destination = cities[Math.floor(Math.random() * cities.length)];
      }

      const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const equipment = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
      const weight = 15000 + Math.floor(Math.random() * 30000);
      const ratePerMile = 2.0 + Math.random() * 2.5;
      const postedRate = Math.round(distance * ratePerMile);

      // Distribute statuses: 30% posted, 20% bidding, 20% booked, 15% in_transit, 10% delivered, 5% completed
      let status;
      const rand = Math.random();
      if (rand < 0.30) status = "posted";
      else if (rand < 0.50) status = "bidding";
      else if (rand < 0.70) status = "booked";
      else if (rand < 0.85) status = "in_transit";
      else if (rand < 0.95) status = "delivered";
      else status = "completed";

      const daysOffset = status === "completed" ? -20 + i * 0.2 :
                        status === "delivered" ? -10 + i * 0.1 :
                        status === "in_transit" ? -5 + i * 0.05 :
                        status === "booked" ? -2 + i * 0.02 :
                        3 + i * 0.1;

      const load: any = {
        shipper_id: shipper.id,
        origin_address: generateAddress(),
        origin_city: origin.name,
        origin_state: origin.state,
        origin_zip: origin.zip,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: generateAddress(),
        destination_city: destination.name,
        destination_state: destination.state,
        destination_zip: destination.zip,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        pickup_date: randomDate(Math.floor(daysOffset), 2),
        delivery_date: randomDate(Math.floor(daysOffset) + 3, 2),
        equipment_type: equipment,
        weight: weight,
        commodity: commodities[Math.floor(Math.random() * commodities.length)],
        posted_rate: postedRate,
        distance_miles: distance,
        status: status,
      };

      // Add carrier and booked rate for non-posted loads
      if (["booked", "in_transit", "delivered", "completed"].includes(status)) {
        load.carrier_id = carriers[i % carriers.length].id;
        load.booked_rate = Math.round(postedRate * (0.85 + Math.random() * 0.1));
      }

      loads.push(load);
    }

    const { data: createdLoads, error: loadsError } = await supabaseAdmin
      .from("loads")
      .insert(loads)
      .select();

    if (loadsError) {
      throw new Error(`Error creating loads: ${loadsError.message}`);
    }

    logStep(`Successfully created ${createdLoads.length} loads`);

    // Create bids (2-5 bids per bidding/booked load)
    logStep("Creating realistic bids");
    const bids = [];
    const biddingLoads = createdLoads.filter(l => l.status === "bidding" || l.status === "booked");
    
    for (const load of biddingLoads) {
      const numBids = 2 + Math.floor(Math.random() * 4);
      const shuffledCarriers = [...carriers].sort(() => Math.random() - 0.5).slice(0, numBids);
      
      for (let i = 0; i < shuffledCarriers.length; i++) {
        const carrier = shuffledCarriers[i];
        const bidAmount = Math.round(load.posted_rate * (0.80 + Math.random() * 0.15));
        const isAccepted = load.status === "booked" && load.carrier_id === carrier.id;
        
        bids.push({
          load_id: load.id,
          carrier_id: carrier.id,
          bid_amount: bidAmount,
          status: isAccepted ? "accepted" : "pending",
          notes: isAccepted ? "Looking forward to serving you!" : `I can deliver this load for $${bidAmount}`,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    if (bids.length > 0) {
      await supabaseAdmin.from("bids").insert(bids);
      logStep(`Created ${bids.length} bids`);
    }

    // Create payments for booked/in_transit/delivered/completed loads
    logStep("Creating payment records");
    const paidLoads = createdLoads.filter(l => ["booked", "in_transit", "delivered", "completed"].includes(l.status));
    const payments = [];

    for (const load of paidLoads) {
      let paymentStatus = "pending";
      let escrowed = null;
      let released = null;

      if (load.status === "in_transit" || load.status === "delivered") {
        paymentStatus = "held_in_escrow";
        escrowed = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString();
      } else if (load.status === "completed") {
        paymentStatus = "released";
        escrowed = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString();
        released = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString();
      }

      payments.push({
        load_id: load.id,
        shipper_id: load.shipper_id,
        carrier_id: load.carrier_id,
        amount: load.booked_rate || load.posted_rate,
        status: paymentStatus,
        stripe_payment_intent_id: `pi_prod_${Math.random().toString(36).substring(7)}`,
        escrow_held_at: escrowed,
        released_at: released,
      });
    }

    if (payments.length > 0) {
      await supabaseAdmin.from("payments").insert(payments);
      logStep(`Created ${payments.length} payment records`);
    }

    // Create 100+ messages distributed across loads
    logStep("Creating 100+ messages with realistic conversations");
    const messages = [];
    const loadsWithMessages = createdLoads
      .filter(l => l.carrier_id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 25); // 25 loads with conversations

    for (const load of loadsWithMessages) {
      const numMessages = 3 + Math.floor(Math.random() * 5); // 3-7 messages per conversation
      const conversation = messageTemplates.sort(() => Math.random() - 0.5).slice(0, numMessages);
      
      let messageTime = Date.now() - (numMessages * 60 * 60 * 1000);
      
      for (const template of conversation) {
        messages.push({
          load_id: load.id,
          sender_id: template.sender === "shipper" ? load.shipper_id : load.carrier_id,
          receiver_id: template.sender === "shipper" ? load.carrier_id : load.shipper_id,
          message: template.text,
          read: Math.random() > 0.3, // 70% read
          created_at: new Date(messageTime).toISOString(),
        });
        
        messageTime += (30 + Math.random() * 90) * 60 * 1000; // 30-120 minutes between messages
      }
    }

    if (messages.length > 0) {
      await supabaseAdmin.from("messages").insert(messages);
      logStep(`Created ${messages.length} messages across ${loadsWithMessages.length} conversations`);
    }

    logStep("Production data seeding completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Production test data created successfully",
        summary: {
          users: createdUsers.length,
          loads: createdLoads.length,
          bids: bids.length,
          payments: payments.length,
          messages: messages.length,
        },
        credentials: testUsers.map(u => ({ 
          email: u.email, 
          password: u.password, 
          role: u.role 
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in seed-production-data", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
