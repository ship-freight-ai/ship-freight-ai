import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: store request timestamps per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 signup attempts per minute per IP

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

interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  role: 'shipper' | 'carrier';
  captchaToken: string;
}

async function verifyCaptcha(token: string): Promise<boolean> {
  const HCAPTCHA_SECRET = Deno.env.get("HCAPTCHA_SECRET_KEY");
  
  if (!HCAPTCHA_SECRET) {
    console.error("HCAPTCHA_SECRET_KEY not configured");
    return false;
  }
  
  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${HCAPTCHA_SECRET}&response=${token}`
    });
    
    const data = await response.json();
    console.log("hCaptcha verification result:", data);
    return data.success === true;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many signup attempts. Please try again in a moment." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, password, fullName, companyName, role, captchaToken }: SignupRequest = await req.json();

    console.log("Signup request received for email:", email);

    // Validate input field lengths to prevent database overflow
    if (!email || !password || !fullName || !companyName || !role) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof fullName !== 'string' || fullName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Full name exceeds maximum length of 100 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof companyName !== 'string' || companyName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Company name exceeds maximum length of 200 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof email !== 'string' || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email exceeds maximum length of 255 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: "Password must be between 8 and 128 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate role is one of the allowed values
    if (role !== 'shipper' && role !== 'carrier') {
      return new Response(
        JSON.stringify({ error: "Invalid role: must be 'shipper' or 'carrier'" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify CAPTCHA
    if (!captchaToken) {
      return new Response(
        JSON.stringify({ error: "CAPTCHA verification required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return new Response(
        JSON.stringify({ error: "Invalid CAPTCHA verification. Please try again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("CAPTCHA verified successfully for email:", email);

    // Create Supabase Admin client (can bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user via Admin API
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm since captcha is verified
      user_metadata: {
        full_name: fullName,
        company_name: companyName,
        role: role,
      }
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      return new Response(
        JSON.stringify({ error: signUpError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User created successfully:", userData.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        company_name: companyName,
        role: role,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // User was created but profile failed - still return success but log error
    } else {
      console.log("Profile created successfully for user:", userData.user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created successfully. You can now log in.",
        user: userData.user 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
