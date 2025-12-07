import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Bid = Database["public"]["Tables"]["bids"]["Row"];
type BidInsert = Database["public"]["Tables"]["bids"]["Insert"];
type BidUpdate = Database["public"]["Tables"]["bids"]["Update"];
type BidStatus = Database["public"]["Enums"]["bid_status"];

export const useLoadBids = (loadId: string) => {
  return useQuery({
    queryKey: ["bids", loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          carriers (
            company_name,
            rating,
            on_time_percentage,
            verification_status
          )
        `)
        .eq("load_id", loadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!loadId,
  });
};

export const useCarrierBids = () => {
  return useQuery({
    queryKey: ["carrier-bids"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          loads (
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            pickup_date,
            delivery_date,
            equipment_type,
            status
          )
        `)
        .eq("carrier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bid: Omit<BidInsert, "carrier_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, update load status to bidding if it's posted
      const { data: load } = await supabase
        .from("loads")
        .select("status")
        .eq("id", bid.load_id)
        .single();

      if (load?.status === "posted") {
        await supabase
          .from("loads")
          .update({ status: "bidding" })
          .eq("id", bid.load_id);
      }

      const { data, error } = await supabase
        .from("bids")
        .insert({ ...bid, carrier_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Bid;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bids", data.load_id] });
      queryClient.invalidateQueries({ queryKey: ["carrier-bids"] });
      queryClient.invalidateQueries({ queryKey: ["load", data.load_id] });
      toast({
        title: "Success",
        description: "Bid submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, updates }: { bidId: string; updates: BidUpdate }) => {
      const { data, error } = await supabase
        .from("bids")
        .update(updates)
        .eq("id", bidId)
        .select()
        .single();

      if (error) throw error;
      return data as Bid;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bids", data.load_id] });
      queryClient.invalidateQueries({ queryKey: ["carrier-bids"] });
      toast({
        title: "Success",
        description: "Bid updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAcceptBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, loadId, carrierId }: { bidId: string; loadId: string; carrierId: string }) => {
      // Accept the bid
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (bidError) throw bidError;

      // Reject all other bids for this load
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("load_id", loadId)
        .neq("id", bidId)
        .eq("status", "pending");

      if (rejectError) throw rejectError;

      // Update load status to booked and assign carrier
      const { error: loadError } = await supabase
        .from("loads")
        .update({ 
          status: "booked",
          carrier_id: carrierId
        })
        .eq("id", loadId);

      if (loadError) throw loadError;

      return { bidId, loadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bids", data.loadId] });
      queryClient.invalidateQueries({ queryKey: ["load", data.loadId] });
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      toast({
        title: "Success",
        description: "Bid accepted! Load has been booked.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRejectBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, loadId }: { bidId: string; loadId: string }) => {
      const { error } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("id", bidId);

      if (error) throw error;
      return { bidId, loadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bids", data.loadId] });
      toast({
        title: "Success",
        description: "Bid rejected",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
