import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Carrier = Database["public"]["Tables"]["carriers"]["Row"];
type CarrierInsert = Database["public"]["Tables"]["carriers"]["Insert"];
type CarrierUpdate = Database["public"]["Tables"]["carriers"]["Update"];

export const useCarrierProfile = () => {
  return useQuery({
    queryKey: ["carrier-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("carriers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Carrier | null;
    },
  });
};

export const useCreateCarrierProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carrier: Omit<CarrierInsert, "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("carriers")
        .insert({ ...carrier, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Carrier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-profile"] });
      toast({
        title: "Success",
        description: "Carrier profile created successfully",
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

export const useUpdateCarrierProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: CarrierUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("carriers")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Carrier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-profile"] });
      toast({
        title: "Success",
        description: "Carrier profile updated successfully",
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

export const useVerifiedCarriers = () => {
  return useQuery({
    queryKey: ["verified-carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carriers")
        .select("*")
        .eq("verification_status", "verified")
        .order("rating", { ascending: false });

      if (error) throw error;
      return data as Carrier[];
    },
  });
};
