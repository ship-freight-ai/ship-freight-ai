import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { role: null, roles: [] };
      }

      // Get user's profile role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      // Get user's additional roles from user_roles table
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const allRoles = userRoles?.map(r => r.role) || [];
      
      return {
        role: profile?.role || null,
        roles: allRoles,
        isAdmin: allRoles.includes("admin"),
        isShipper: profile?.role === "shipper",
        isCarrier: profile?.role === "carrier",
      };
    },
  });
};
