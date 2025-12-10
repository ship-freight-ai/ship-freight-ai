import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type Load = Database["public"]["Tables"]["loads"]["Row"];
type LoadInsert = Database["public"]["Tables"]["loads"]["Insert"];
type LoadUpdate = Database["public"]["Tables"]["loads"]["Update"];
type LoadStatus = Database["public"]["Enums"]["load_status"];
type EquipmentType = Database["public"]["Enums"]["equipment_type"];

export interface LoadFilters {
  equipment_type?: EquipmentType;
  origin_state?: string;
  destination_state?: string;
  pickup_date_from?: string;
  pickup_date_to?: string;
  min_rate?: number;
  max_rate?: number;
}

export const useLoadsList = (role?: "shipper" | "carrier", filters?: LoadFilters, page = 0, pageSize = 20) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["loads", role, filters, page, pageSize],
    queryFn: async () => {
      let query = supabase.from("loads").select("*", { count: "exact" });

      if (role === "carrier") {
        query = query.in("status", ["posted", "bidding"]);
      }

      // Apply filters
      if (filters?.equipment_type) {
        query = query.eq("equipment_type", filters.equipment_type);
      }
      if (filters?.origin_state) {
        query = query.eq("origin_state", filters.origin_state);
      }
      if (filters?.destination_state) {
        query = query.eq("destination_state", filters.destination_state);
      }
      if (filters?.pickup_date_from) {
        query = query.gte("pickup_date", filters.pickup_date_from);
      }
      if (filters?.pickup_date_to) {
        query = query.lte("pickup_date", filters.pickup_date_to);
      }
      if (filters?.min_rate) {
        query = query.gte("posted_rate", filters.min_rate);
      }
      if (filters?.max_rate) {
        query = query.lte("posted_rate", filters.max_rate);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      return { data: data as Load[], count: count || 0 };
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loads",
        },
        () => {
          // Invalidate all loads queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["loads"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useLoadDetails = (loadId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["load", loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("id", loadId)
        .single();
      if (error) throw error;
      return data as Load;
    },
    enabled: !!loadId,
  });

  // Real-time updates for specific load
  useEffect(() => {
    if (!loadId) return;

    const channel = supabase
      .channel(`load:${loadId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "loads",
        filter: `id=eq.${loadId}`
      }, (payload) => {
        queryClient.setQueryData(["load", loadId], payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadId, queryClient]);

  return query;
};

export const useCreateLoad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (load: Omit<LoadInsert, "shipper_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("loads")
        .insert({ ...load, shipper_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Load;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      toast({
        title: "Success",
        description: "Load created successfully",
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

export const useUpdateLoad = (loadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: LoadUpdate) => {
      const { data, error } = await supabase
        .from("loads")
        .update(updates)
        .eq("id", loadId)
        .select()
        .single();

      if (error) throw error;
      return data as Load;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      queryClient.invalidateQueries({ queryKey: ["load", loadId] });
      toast({
        title: "Success",
        description: "Load updated successfully",
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

export const useDeleteLoad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loadId: string) => {
      const { error } = await supabase.from("loads").delete().eq("id", loadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      toast({
        title: "Success",
        description: "Load deleted successfully",
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

export const useUpdateLoadStatus = (loadId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: LoadStatus) => {
      const { data, error } = await supabase
        .from("loads")
        .update({ status })
        .eq("id", loadId)
        .select()
        .single();

      if (error) throw error;
      return data as Load;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loads"] });
      queryClient.invalidateQueries({ queryKey: ["load", loadId] });
      toast({
        title: "Success",
        description: "Load status updated successfully",
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
