import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConnectStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: any;
}

export const useCreateConnectAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-connect-account");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-profile"] });
      toast.success("Stripe Connect account created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create Connect account: " + error.message);
    },
  });
};

export const useCreateOnboardingLink = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-connect-onboarding-link");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success("Opening Stripe onboarding...");
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to create onboarding link: " + error.message);
    },
  });
};

export const useConnectStatus = () => {
  return useQuery({
    queryKey: ["connect-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-connect-status");
      if (error) throw error;
      return data as ConnectStatus;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useCreateCarrierPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loadId: string) => {
      const { data, error } = await supabase.functions.invoke("create-carrier-payout", {
        body: { loadId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      queryClient.invalidateQueries({ queryKey: ["carrier-payouts"] });
      toast.success("Payment released to carrier via Stripe Connect");
    },
    onError: (error: Error) => {
      toast.error("Failed to release payment: " + error.message);
    },
  });
};

export const useCarrierPayouts = () => {
  return useQuery({
    queryKey: ["carrier-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrier_payouts")
        .select(`
          *,
          payment:payments(
            load:loads(
              load_number,
              origin_city,
              origin_state,
              destination_city,
              destination_state
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
