import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  loadId: string;
  pdfUrl: string;
  shipperEmail: string;
  carrierEmail: string;
  loadNumber: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { loadId, pdfUrl, shipperEmail, carrierEmail, loadNumber }: EmailRequest = await req.json();

    // Note: This is a placeholder for Resend integration
    // To implement, add RESEND_API_KEY secret and use Resend API
    console.log("PDF email delivery requested:", {
      loadId,
      pdfUrl,
      shipperEmail,
      carrierEmail,
      loadNumber,
    });

    // Fetch PDF from storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Log the email request
    console.log(`Sending load confirmation #${loadNumber} to ${shipperEmail} and ${carrierEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email functionality placeholder - configure Resend to enable",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-pdf-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
