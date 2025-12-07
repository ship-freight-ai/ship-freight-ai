import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: store request timestamps per user (expensive AI operation)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute (AI calls are expensive)

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user for rate limiting and authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    // Extract user from auth (simple check - could verify JWT if needed)
    const userIdentifier = authHeader.split(' ')[1] || 'unknown';
    
    // Rate limiting check
    if (!checkRateLimit(userIdentifier)) {
      console.warn(`Rate limit exceeded for user: ${userIdentifier}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { fileUrl, fileName } = await req.json();
    
    // Validate required fields
    if (!fileUrl || !fileName) {
      throw new Error('File URL and name are required');
    }

    // Validate URL format and security - must be HTTPS
    if (typeof fileUrl !== 'string' || !fileUrl.startsWith('https://')) {
      throw new Error('Invalid file URL: must be HTTPS');
    }

    // Whitelist allowed storage domains to prevent SSRF attacks
    const allowedDomains = ['supabase.co', 'lovableproject.com'];
    try {
      const url = new URL(fileUrl);
      const isAllowedDomain = allowedDomains.some(domain => url.hostname.endsWith(domain));
      if (!isAllowedDomain) {
        throw new Error('Invalid file source: domain not allowed');
      }
    } catch (urlError) {
      if (urlError instanceof Error && urlError.message.includes('domain not allowed')) {
        throw urlError;
      }
      throw new Error('Invalid file URL format');
    }

    // Validate fileName length
    if (typeof fileName !== 'string' || fileName.length > 255) {
      throw new Error('File name exceeds maximum length of 255 characters');
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing document:', fileName);

    const systemPrompt = `You are an AI assistant that extracts load/shipment information from documents.
Extract the following information and return it as JSON:
- origin_address, origin_city, origin_state, origin_zip
- destination_address, destination_city, destination_state, destination_zip
- pickup_date (YYYY-MM-DD format)
- delivery_date (YYYY-MM-DD format)
- equipment_type (one of: dry_van, reefer, flatbed, step_deck, power_only)
- weight (in pounds, numeric only)
- length, width, height (in feet, numeric only)
- commodity (description of goods)
- special_requirements (any special instructions like hazmat, team drivers, etc.)
- posted_rate (numeric only, dollar amount)

If a field cannot be found, set it to null. Return ONLY valid JSON, no explanations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract load information from this document: ${fileUrl}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log('AI Response:', extractedText);

    let loadData;
    try {
      loadData = JSON.parse(extractedText);
    } catch (e) {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        loadData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    return new Response(
      JSON.stringify({ loadData, confidence: 0.85 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-load-document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
