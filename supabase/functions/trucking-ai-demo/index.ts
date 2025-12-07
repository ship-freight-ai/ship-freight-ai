import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: store request timestamps per session/IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { demoType, input } = await req.json();
    
    // Input validation
    if (!demoType || !input || input.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    switch (demoType) {
      case "extract_shipment":
        systemPrompt = `You are an AI assistant specialized in extracting shipment details from messages. 
        Extract and structure the following information from the message:
        - Pickup location and date
        - Delivery location and date
        - Commodity/freight description
        - Weight
        - Any special requirements
        
        Return the information in a clear, structured format.`;
        break;
        
      case "followup":
        systemPrompt = `You are an AI assistant that generates professional follow-up messages for trucking logistics. 
        Based on the shipment details provided, create a polite, professional follow-up message to check on the load status.
        Keep it brief and action-oriented.`;
        break;
        
      case "rate_suggestion":
        systemPrompt = `You are an AI assistant that analyzes trucking lanes and provides rate suggestions.
        Based on the lane information provided, suggest a competitive rate range and explain the reasoning.
        Consider factors like distance, typical market rates, and seasonal variations.`;
        break;
        
      case "status_recap":
        systemPrompt = `You are an AI assistant that creates concise status recaps for shipments.
        Summarize the shipment status in 2-3 sentences, highlighting key information and next steps.`;
        break;
        
      default:
        systemPrompt = "You are a helpful AI assistant for trucking logistics.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please contact support." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "No response generated";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in trucking-ai-demo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
