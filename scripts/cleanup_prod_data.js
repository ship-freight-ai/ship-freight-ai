
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function cleanupProdData() {
    console.log("Starting cleanup of PRODUCTION seed data (prod-* only)...");
    console.log("Test accounts (test-*) will be PRESERVED.");

    // 1. Identify "Prod" Dummy Users
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email, company_name")
        .ilike("email", "prod-%"); // ONLY targeting prod-%

    if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("No 'prod-*' profiles found to delete.");
        return;
    }

    const userIds = profiles.map((p) => p.user_id);
    const info = profiles.map((p) => `${p.email} (${p.company_name})`);

    console.log(`Found ${userIds.length} 'prod-%' users to delete:`);
    console.log(info.join("\n"));

    console.log("\nDeleting related data (Cascading)...");

    // 2. Delete Related Data
    // Note: We use .in() which fails for empty arrays, but we checked length > 0 above.

    await deleteBatch("messages", "sender_id", userIds);
    await deleteBatch("messages", "receiver_id", userIds);
    await deleteBatch("payments", "shipper_id", userIds);
    await deleteBatch("payments", "carrier_id", userIds);
    await deleteBatch("bids", "carrier_id", userIds);
    await deleteBatch("loads", "shipper_id", userIds);
    await deleteBatch("loads", "carrier_id", userIds);
    await deleteBatch("team_invites", "inviter_id", userIds);
    await deleteBatch("subscriptions", "user_id", userIds);
    await deleteBatch("carriers", "user_id", userIds);
    await deleteBatch("user_roles", "user_id", userIds);
    await deleteBatch("profiles", "user_id", userIds);

    // 3. Delete Auth Users
    console.log("Deleting from Auth config...");
    let deletedCount = 0;
    for (const userId of userIds) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            console.error(`Failed to delete auth user ${userId}:`, error.message);
        } else {
            deletedCount++;
        }
    }

    console.log(`\nCleanup complete. Successfully deleted ${deletedCount} 'prod-*' users.`);
    console.log("Test accounts should still exist.");
}

async function deleteBatch(table, column, ids) {
    const { error } = await supabaseAdmin.from(table).delete().in(column, ids);
    if (error) console.error(`Error deleting from ${table}:`, error.message);
    else console.log(`Cleared ${table} records.`);
}

cleanupProdData();
