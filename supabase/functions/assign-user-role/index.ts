import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: store request timestamps per user
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute for admin operations

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
    const { userId, role } = await req.json();

    if (!userId || !role) {
      throw new Error("Missing required fields: userId and role");
    }

    // Validate role
    const validRoles = ['admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role. Must be: admin, moderator, or user");
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

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify requesting user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !adminRole) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already has this role" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Assign new role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: role,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to assign role");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully assigned ${role} role to user`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
