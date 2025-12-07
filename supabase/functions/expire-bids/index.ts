import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPIRE-BIDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Call the database function to expire old bids
    logStep("Calling expire_old_bids function");
    const { error: functionError } = await supabaseClient.rpc("expire_old_bids");

    if (functionError) {
      logStep("ERROR calling function", { error: functionError.message });
      throw new Error(`Failed to expire bids: ${functionError.message}`);
    }

    // Get count of expired bids for logging
    const { count, error: countError } = await supabaseClient
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected")
      .lt("expires_at", new Date().toISOString());

    logStep("Bids expired successfully", { count: count || 0 });

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: count || 0,
        message: "Bid expiration cleanup completed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in expire-bids", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});