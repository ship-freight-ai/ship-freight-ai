
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestLoad() {
    console.log("Creating test load...");

    // Get test shipper user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const testShipper = users.find(u => u.email === "test-shipper@shipai.com");
    if (!testShipper) {
        console.error("Test shipper not found");
        process.exit(1);
    }

    const { data: load, error } = await supabase
        .from("loads")
        .insert({
            shipper_id: testShipper.id,
            origin_address: "123 Test St",
            origin_city: "Test City",
            origin_state: "TS",
            origin_zip: "12345",
            destination_address: "456 Destination Ave",
            destination_city: "Dest City",
            destination_state: "DS",
            destination_zip: "67890",
            pickup_date: new Date().toISOString().split('T')[0],
            delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            equipment_type: "dry_van",
            commodity: "General Freight",
            weight: 10000,
            posted_rate: 1500,
            status: "posted"
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating load:", error);
        process.exit(1);
    }

    console.log("Test load created with ID:", load.id);
}

createTestLoad();
