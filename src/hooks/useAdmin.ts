import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformMetrics {
  total_users: number;
  total_shippers: number;
  total_carriers: number;
  total_admins: number;
  total_loads: number;
  active_loads: number;
  completed_loads: number;
  active_disputes: number;
  total_revenue: number;
  pending_verifications: number;
}

export const usePlatformMetrics = () => {
  return useQuery<PlatformMetrics>({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_metrics");
      
      if (error) throw error;
      return JSON.parse(data as string) as PlatformMetrics;
    },
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-all-users");
      
      if (error) throw error;
      return data.users;
    },
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke("assign-user-role", {
        body: { userId, role },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
    },
  });
};

export const useAllDisputes = () => {
  return useQuery({
    queryKey: ["admin-all-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          loads (
            id,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            shipper:profiles!loads_shipper_id_fkey(full_name, email),
            carrier:profiles!loads_carrier_id_fkey(full_name, email)
          )
        `)
        .eq("status", "disputed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
