import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { loadId, reason } = await req.json();

    if (!loadId || !reason) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get payment and verify user is involved
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("load_id", loadId)
      .or(`shipper_id.eq.${user.id},carrier_id.eq.${user.id}`)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found or unauthorized");
    }

    if (payment.status !== "held_in_escrow" && payment.status !== "released") {
      throw new Error("Cannot dispute payment in current status");
    }

    // Update payment status to disputed
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "disputed",
        dispute_reason: reason,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update payment status");
    }

    // TODO: Notify admins about dispute for manual resolution

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dispute initiated. An admin will review your case.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment dispute error:", error);
    
    // Return sanitized error message
    let errorMessage = "Failed to create dispute. Please try again.";
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        errorMessage = "Authentication required.";
        statusCode = 401;
      } else if (error.message === "Missing required fields") {
        errorMessage = "Invalid request. Please provide all required information.";
      } else if (error.message === "Payment not found or unauthorized") {
        errorMessage = "Unable to dispute this payment.";
        statusCode = 403;
      } else if (error.message === "Cannot dispute payment in current status") {
        errorMessage = "Payment cannot be disputed in current status.";
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  }
});
