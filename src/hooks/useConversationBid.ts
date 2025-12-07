import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useConversationBid = (loadId: string | null, otherUserId: string | null) => {
  return useQuery({
    queryKey: ["conversation-bid", loadId, otherUserId],
    queryFn: async () => {
      if (!loadId || !otherUserId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the load details
      const { data: load, error: loadError } = await supabase
        .from("loads")
        .select("*")
        .eq("id", loadId)
        .single();

      if (loadError) throw loadError;

      // Determine if current user is shipper or carrier
      const isShipper = load.shipper_id === user.id;
      const carrierId = isShipper ? otherUserId : user.id;

      // Get bid information for this carrier on this load
      const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*")
        .eq("load_id", loadId)
        .eq("carrier_id", carrierId)
        .maybeSingle();

      if (bidError) throw bidError;

      return {
        load,
        bid,
        isShipper,
      };
    },
    enabled: !!loadId && !!otherUserId,
  });
};
