import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  category: string;
  message: string;
  captchaToken: string;
}

// Rate limiting: store request timestamps per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
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
      body: `secret=${HCAPTCHA_SECRET}&response=${token}`,
    });
    
    const data = await response.json();
    console.log("hCaptcha verification result:", data.success);
    return data.success === true;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    carrier: "Carrier Inquiry",
    shipper: "Shipper Inquiry",
    media: "Media Inquiry",
    partnership: "Partnership Opportunity",
    other: "General Inquiry",
  };
  return labels[category] || "Inquiry";
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, category, message, captchaToken }: ContactEmailRequest = await req.json();
    
    // Verify CAPTCHA
    if (!captchaToken) {
      console.warn("Missing CAPTCHA token");
      return new Response(
        JSON.stringify({ error: "CAPTCHA verification required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      console.warn("Invalid CAPTCHA verification");
      return new Response(
        JSON.stringify({ error: "Invalid CAPTCHA verification. Please try again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("CAPTCHA verified successfully");
    
    // Input validation
    if (!name || !email || !category || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email to Ship AI using Resend API
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Ship AI Contact Form <onboarding@resend.dev>",
        to: ["go@shipfreight.ai"],
        subject: `New ${getCategoryLabel(category)} from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Type:</strong> ${getCategoryLabel(category)}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This email was sent from the Ship AI contact form.</p>
        `,
      }),
    });

    if (!adminEmailResponse.ok) {
      throw new Error("Failed to send admin email");
    }

    // Send confirmation email to user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Ship AI <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message!",
        html: `
          <h1>Thank you for contacting Ship AI, ${name}!</h1>
          <p>We have received your ${getCategoryLabel(category).toLowerCase()} and will get back to you as soon as possible.</p>
          <p>Here's a copy of your message:</p>
          <blockquote style="border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0;">
            ${message.replace(/\n/g, "<br>")}
          </blockquote>
          <p>Best regards,<br>The Ship AI Team</p>
          <p style="color: #666; font-size: 12px;">Email: go@shipfreight.ai</p>
        `,
      }),
    });

    if (!userEmailResponse.ok) {
      throw new Error("Failed to send user confirmation email");
    }

    console.log("Emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
