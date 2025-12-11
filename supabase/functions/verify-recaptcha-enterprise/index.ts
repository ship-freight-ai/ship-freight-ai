import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssessmentRequest {
    token: string;
    action: string;
    userIp?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const logStep = (step: string) => console.log(`[verify-recaptcha-enterprise] ${step}`);

    try {
        const { token, action, userIp } = await req.json() as AssessmentRequest;

        if (!token) {
            throw new Error("Token is required");
        }

        logStep(`Verifying token for action: ${action}`);

        // Get environment variables
        const siteKey = Deno.env.get("RECAPTCHA_SITE_KEY") || "6Lc_sScsAAAAAJ3NGZ0VO54XmInfSYne4W0mX3MH";
        const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
        const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "ship-ai-477800";

        if (!siteKey || !apiKey) {
            console.error("Missing required environment variables");
            // In dev mode, return a mock success
            if (Deno.env.get("DEV_MODE") === "true" || !apiKey) {
                logStep("DEV MODE: Returning mock success");
                return new Response(
                    JSON.stringify({
                        success: true,
                        score: 0.9,
                        action: action,
                        message: "Mock verification (dev mode)"
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
            throw new Error("reCAPTCHA not configured");
        }

        // Create assessment with Google reCAPTCHA Enterprise API
        const assessmentUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

        const assessmentRequest = {
            event: {
                token: token,
                siteKey: siteKey,
                expectedAction: action,
                userIpAddress: userIp
            }
        };

        logStep("Calling reCAPTCHA Enterprise API");
        const response = await fetch(assessmentUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(assessmentRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("reCAPTCHA API error:", errorText);
            throw new Error(`reCAPTCHA API error: ${response.status}`);
        }

        const assessment = await response.json();
        logStep(`Assessment received: score=${assessment.riskAnalysis?.score}`);

        // Extract the risk score
        const score = assessment.riskAnalysis?.score ?? 0;
        const tokenValid = assessment.tokenProperties?.valid ?? false;
        const actionMatch = assessment.tokenProperties?.action === action;

        // Check if the request is likely legitimate (score >= 0.5)
        const isHuman = tokenValid && score >= 0.5;

        if (!tokenValid) {
            logStep("Token is invalid");
            return new Response(
                JSON.stringify({
                    success: false,
                    score: 0,
                    message: "Invalid reCAPTCHA token"
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        if (!isHuman) {
            logStep(`Low score detected: ${score}`);
            return new Response(
                JSON.stringify({
                    success: false,
                    score: score,
                    message: "Bot activity detected. Please try again."
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        logStep(`Verification successful: score=${score}`);
        return new Response(
            JSON.stringify({
                success: true,
                score: score,
                action: assessment.tokenProperties?.action,
                message: "Verification successful"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error in verify-recaptcha-enterprise:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Verification failed"
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
