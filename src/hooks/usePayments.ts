import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Payment {
  id: string;
  load_id: string;
  shipper_id: string;
  carrier_id: string;
  amount: number;
  status: "pending" | "held_in_escrow" | "released" | "completed" | "failed" | "disputed";
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  escrow_held_at: string | null;
  released_at: string | null;
  completed_at: string | null;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const useLoadPayment = (loadId: string) => {
  return useQuery({
    queryKey: ["payment", loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("load_id", loadId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Payment | null;
    },
    enabled: !!loadId,
  });
};

export const useUserPayments = () => {
  return useQuery({
    queryKey: ["payments", "user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .or(`shipper_id.eq.${user.id},carrier_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });
};

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loadId,
      amount,
      carrierId,
      bidId,
    }: {
      loadId: string;
      amount: number;
      carrierId: string;
      bidId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: { loadId, amount, carrierId, bidId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      toast.success("Payment initiated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create payment: " + error.message);
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paymentIntentId,
      loadId,
      bidId,
    }: {
      paymentIntentId: string;
      loadId: string;
      bidId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("confirm-payment", {
        body: { paymentIntentId, loadId, bidId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      // Invalidate both load and bids since booking updates both
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      toast.success("Payment confirmed and held in escrow");
    },
    onError: (error: Error) => {
      toast.error("Failed to confirm payment: " + error.message);
    },
  });
};

export const useReleasePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loadId,
      finalAmount,
      notes
    }: {
      loadId: string;
      finalAmount?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("release-payment", {
        body: { loadId, finalAmount, notes },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      toast.success("Payment released to carrier");
    },
    onError: (error: Error) => {
      toast.error("Failed to release payment: " + error.message);
    },
  });
};

export const useDisputePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loadId,
      reason,
    }: {
      loadId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("dispute-payment", {
        body: { loadId, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      toast.success("Payment dispute initiated");
    },
    onError: (error: Error) => {
      toast.error("Failed to dispute payment: " + error.message);
    },
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loadId,
      releaseToCarrier,
    }: {
      loadId: string;
      releaseToCarrier: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("resolve-dispute", {
        body: { loadId, releaseToCarrier },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      toast.success("Dispute resolved");
    },
    onError: (error: Error) => {
      toast.error("Failed to resolve dispute: " + error.message);
    },
  });
};
