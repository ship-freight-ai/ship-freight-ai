
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    Deno.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function cleanupDummyData() {
    console.log("Starting cleanup of dummy data (prod-* and test-*)...");

    // 1. Identify Dummy Users
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .or("email.ilike.prod-%,email.ilike.test-%");

    if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("No dummy profiles found to delete.");
        return;
    }

    const userIds = profiles.map((p) => p.user_id);
    const emails = profiles.map((p) => p.email);

    console.log(`Found ${userIds.length} dummy users to delete:`, emails);

    // 2. Delete Related Data (Manual Cascade for safety)

    // Messages (Sent or Received by these users)
    console.log("Deleting messages...");
    await supabaseAdmin.from("messages").delete().in("sender_id", userIds);
    await supabaseAdmin.from("messages").delete().in("receiver_id", userIds);

    // Payments (related to these users)
    console.log("Deleting payments...");
    await supabaseAdmin.from("payments").delete().in("shipper_id", userIds);
    await supabaseAdmin.from("payments").delete().in("carrier_id", userIds);

    // Bids (Made by these users)
    console.log("Deleting bids...");
    await supabaseAdmin.from("bids").delete().in("carrier_id", userIds);

    // Loads (Posted by these users or Booked by these users)
    // Note: If a real user booked a load from a dummy shipper, that load is deleted.
    // If a dummy carrier booked a load from a real shipper, we should probably unbook it?
    // But for now, we assume strict separation or that we want to wipe the dummy carrier's trace.
    // Deleting the load is safest for consistency if the dummy user was involved.
    console.log("Deleting loads...");
    await supabaseAdmin.from("loads").delete().in("shipper_id", userIds);
    await supabaseAdmin.from("loads").delete().in("carrier_id", userIds);

    // Team Invites
    console.log("Deleting team invites...");
    await supabaseAdmin.from("team_invites").delete().in("inviter_id", userIds);

    // Subscriptions
    console.log("Deleting subscriptions...");
    await supabaseAdmin.from("subscriptions").delete().in("user_id", userIds);

    // Carriers Profile
    console.log("Deleting carrier profiles...");
    await supabaseAdmin.from("carriers").delete().in("user_id", userIds);

    // User Roles
    console.log("Deleting user roles...");
    await supabaseAdmin.from("user_roles").delete().in("user_id", userIds);

    // Profiles
    console.log("Deleting profiles...");
    await supabaseAdmin.from("profiles").delete().in("user_id", userIds);

    // 3. Delete Auth Users
    console.log("Deleting auth users...");
    for (const userId of userIds) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            console.error(`Failed to delete auth user ${userId}:`, error.message);
        } else {
            console.log(`Deleted auth user ${userId}`);
        }
    }

    console.log("Cleanup complete.");
}

cleanupDummyData();
