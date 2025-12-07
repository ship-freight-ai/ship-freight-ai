import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Rating = Database["public"]["Tables"]["ratings"]["Row"];
type RatingInsert = Database["public"]["Tables"]["ratings"]["Insert"];

export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: Omit<RatingInsert, "shipper_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ratings")
        .insert({ ...rating, shipper_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Rating;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      queryClient.invalidateQueries({ queryKey: ["carrier-profile"] });
      queryClient.invalidateQueries({ queryKey: ["verified-carriers"] });
      toast({
        title: "Success",
        description: "Rating submitted successfully",
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

export const useCarrierRatings = (carrierId?: string) => {
  return useQuery({
    queryKey: ["ratings", "carrier", carrierId],
    queryFn: async () => {
      if (!carrierId) return [];
      
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("carrier_id", carrierId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Rating[];
    },
    enabled: !!carrierId,
  });
};

export const useLoadRating = (loadId?: string) => {
  return useQuery({
    queryKey: ["ratings", "load", loadId],
    queryFn: async () => {
      if (!loadId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("load_id", loadId)
        .eq("shipper_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Rating | null;
    },
    enabled: !!loadId,
  });
};

export const useMyRatings = () => {
  return useQuery({
    queryKey: ["ratings", "my-ratings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("carrier_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Rating[];
    },
  });
};
