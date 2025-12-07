import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[DELETE-ALL-USERS] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        logStep("Starting deletion of ALL users");

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        // Get ALL profiles
        const { data: allProfiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("user_id, email");

        if (profilesError) {
            throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        if (!allProfiles || allProfiles.length === 0) {
            logStep("No users found to delete");
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No users found to delete",
                    deleted: 0,
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        const allUserIds = allProfiles.map(p => p.user_id);
        logStep(`Found ${allUserIds.length} users to delete`);

        // Delete in correct order to avoid foreign key violations

        // 1. Delete messages
        logStep("Deleting messages");
        await supabaseAdmin.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 2. Delete documents
        logStep("Deleting documents");
        await supabaseAdmin.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 3. Delete tracking updates
        logStep("Deleting tracking updates");
        await supabaseAdmin.from("tracking_updates").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 4. Delete payments
        logStep("Deleting payments");
        await supabaseAdmin.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 5. Delete bids
        logStep("Deleting bids");
        await supabaseAdmin.from("bids").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 6. Delete loads
        logStep("Deleting loads");
        await supabaseAdmin.from("loads").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 7. Delete team invites
        logStep("Deleting team invites");
        await supabaseAdmin.from("team_invites").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 8. Delete subscriptions
        logStep("Deleting subscriptions");
        await supabaseAdmin.from("subscriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 9. Delete carrier profiles
        logStep("Deleting carrier profiles");
        await supabaseAdmin.from("carriers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 10. Delete user roles
        logStep("Deleting user roles");
        await supabaseAdmin.from("user_roles").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // 11. Delete profiles
        logStep("Deleting profiles");
        await supabaseAdmin.from("profiles").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");

        // 12. Delete auth users
        logStep("Deleting auth users");
        for (const userId of allUserIds) {
            const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (authDeleteError) {
                logStep(`Warning: Error deleting auth user ${userId}`, { error: authDeleteError.message });
            }
        }

        logStep("All users deleted successfully");

        return new Response(
            JSON.stringify({
                success: true,
                message: "All users deleted successfully",
                deleted: allUserIds.length,
                emails: allProfiles.map(p => p.email),
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR in delete-all-users", { message: errorMessage });
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
