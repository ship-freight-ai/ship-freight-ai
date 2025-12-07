import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RESET-TEST-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting test data reset");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Get all test users (emails starting with "test-" or "prod-")
    const { data: testProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .or("email.like.test-%,email.like.prod-%");

    if (profilesError) {
      throw new Error(`Failed to fetch test profiles: ${profilesError.message}`);
    }

    if (!testProfiles || testProfiles.length === 0) {
      logStep("No test data found to reset");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No test data found to reset",
          deleted: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const testUserIds = testProfiles.map(p => p.user_id);
    logStep(`Found ${testUserIds.length} test users to delete`);

    // Delete in correct order to avoid foreign key violations

    // 1. Delete messages
    logStep("Deleting messages");
    const { error: messagesError } = await supabaseAdmin
      .from("messages")
      .delete()
      .in("sender_id", testUserIds);

    if (messagesError) {
      logStep("Warning: Error deleting messages", { error: messagesError.message });
    }

    // 2. Delete documents
    logStep("Deleting documents");
    const { error: documentsError } = await supabaseAdmin
      .from("documents")
      .delete()
      .in("user_id", testUserIds);

    if (documentsError) {
      logStep("Warning: Error deleting documents", { error: documentsError.message });
    }

    // 3. Delete tracking updates
    logStep("Deleting tracking updates");
    const { error: trackingError } = await supabaseAdmin
      .from("tracking_updates")
      .delete()
      .in("carrier_id", testUserIds);

    if (trackingError) {
      logStep("Warning: Error deleting tracking updates", { error: trackingError.message });
    }

    // 4. Delete payments
    logStep("Deleting payments");
    const { error: paymentsError } = await supabaseAdmin
      .from("payments")
      .delete()
      .in("shipper_id", testUserIds);

    if (paymentsError) {
      logStep("Warning: Error deleting payments", { error: paymentsError.message });
    }

    // 5. Delete bids
    logStep("Deleting bids");
    const { error: bidsError } = await supabaseAdmin
      .from("bids")
      .delete()
      .in("carrier_id", testUserIds);

    if (bidsError) {
      logStep("Warning: Error deleting bids", { error: bidsError.message });
    }

    // 6. Delete loads
    logStep("Deleting loads");
    const { error: loadsError } = await supabaseAdmin
      .from("loads")
      .delete()
      .in("shipper_id", testUserIds);

    if (loadsError) {
      logStep("Warning: Error deleting loads", { error: loadsError.message });
    }

    // 7. Delete team invites
    logStep("Deleting team invites");
    const { error: invitesError } = await supabaseAdmin
      .from("team_invites")
      .delete()
      .in("created_by", testUserIds);

    if (invitesError) {
      logStep("Warning: Error deleting team invites", { error: invitesError.message });
    }

    // 8. Delete subscriptions
    logStep("Deleting subscriptions");
    const { error: subscriptionsError } = await supabaseAdmin
      .from("subscriptions")
      .delete()
      .in("user_id", testUserIds);

    if (subscriptionsError) {
      logStep("Warning: Error deleting subscriptions", { error: subscriptionsError.message });
    }

    // 9. Delete carrier profiles
    logStep("Deleting carrier profiles");
    const { error: carriersError } = await supabaseAdmin
      .from("carriers")
      .delete()
      .in("user_id", testUserIds);

    if (carriersError) {
      logStep("Warning: Error deleting carriers", { error: carriersError.message });
    }

    // 10. Delete user roles
    logStep("Deleting user roles");
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .in("user_id", testUserIds);

    if (rolesError) {
      logStep("Warning: Error deleting user roles", { error: rolesError.message });
    }

    // 11. Delete profiles
    logStep("Deleting profiles");
    const { error: deleteProfilesError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .in("user_id", testUserIds);

    if (deleteProfilesError) {
      logStep("Warning: Error deleting profiles", { error: deleteProfilesError.message });
    }

    // 12. Delete auth users
    logStep("Deleting auth users");
    for (const userId of testUserIds) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        logStep(`Warning: Error deleting auth user ${userId}`, { error: authDeleteError.message });
      }
    }

    logStep("Test data reset completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Test data reset successfully",
        deleted: testUserIds.length,
        emails: testProfiles.map(p => p.email),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in reset-test-data", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
