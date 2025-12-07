import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const logStep = (step, details) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[DELETE-ALL-USERS] ${step}${detailsStr}`);
};

async function deleteAllUsers() {
    try {
        logStep("Starting deletion of ALL users");

        // Get ALL profiles
        const { data: allProfiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("user_id, email");

        if (profilesError) {
            throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        if (!allProfiles || allProfiles.length === 0) {
            logStep("No users found to delete");
            return;
        }

        const allUserIds = allProfiles.map(p => p.user_id);
        logStep(`Found ${allUserIds.length} users to delete`);

        // Delete in correct order to avoid foreign key violations
        const tables = [
            "messages", "documents", "tracking_updates", "payments", "bids",
            "loads", "team_invites", "subscriptions", "carriers", "user_roles"
        ];

        for (const table of tables) {
            logStep(`Deleting ${table}`);
            await supabaseAdmin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }

        // Delete profiles
        logStep("Deleting profiles");
        await supabaseAdmin.from("profiles").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");

        // Delete auth users
        logStep("Deleting auth users");
        for (const userId of allUserIds) {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (authDeleteError) {
                logStep(`Warning: Error deleting auth user ${userId}`, { error: authDeleteError.message });
            }
        }

        logStep("All users deleted successfully");

    } catch (error) {
        console.error("ERROR in delete-all-users:", error);
        process.exit(1);
    }
}

deleteAllUsers();
