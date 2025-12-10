import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[VERIFY-CARRIER] ${step}${detailsStr}`);
};

// Mock response for testing
const MOCK_CARRIER = {
    dotNumber: "123456",
    companyName: "Verified Logistics LLC",
    mcNumber: "MC123456",
    safetyRating: "Satisfactory",
    address: "123 Freight Way, Atlanta, GA 30301",
    status: "ACTIVE",
    insurance: {
        cargo: 100000,
        liability: 1000000
    }
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        logStep("Function started");

        const { dotNumber } = await req.json();
        if (!dotNumber) {
            throw new Error("DOT Number is required");
        }

        logStep("Verifying DOT Number", { dotNumber });

        // TODO: Replace with actual CarrierOK API key
        const apiKey = Deno.env.get("CARRIER_OK_API_KEY");

        // MOCK PATH: If no key or specific test DOT
        if (!apiKey || dotNumber === "123456") {
            logStep("Returning MOCK data (Test Mode)");

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            if (dotNumber === "000000") {
                throw new Error("Carrier not found (Mock)");
            }

            return new Response(
                JSON.stringify(MOCK_CARRIER),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // REAL API PATH
        // TODO: Confirm actual endpoint from docs
        const apiUrl = `https://api.carrier-ok.com/v1/carriers/${dotNumber}`;

        logStep("Calling CarrierOK API", { url: apiUrl });

        const response = await fetch(apiUrl, {
            headers: {
                "x-api-key": apiKey,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            logStep("Upstream API Error", { status: response.status, body: errorText });
            throw new Error(`Verification failed: ${response.statusText}`);
        }

        const data = await response.json();
        logStep("Data received from CarrierOK");

        // Transform to standard format if needed
        // This depends on the actual response structure of CarrierOK
        const normalizedData = {
            dotNumber: data.dot_number || dotNumber,
            companyName: data.legal_name || data.company_name,
            mcNumber: data.mc_number,
            safetyRating: data.safety_rating,
            address: data.physical_address,
            status: data.operating_status,
            // Add other fields mapped from the API response
        };

        return new Response(
            JSON.stringify(normalizedData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage });
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
