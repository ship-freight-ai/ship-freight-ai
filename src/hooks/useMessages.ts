import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { useEffect } from "react";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export const useLoadMessages = (loadId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", loadId],
    queryFn: async () => {
      if (!loadId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("load_id", loadId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!loadId,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!loadId) return;

    const channel = supabase
      .channel(`messages:${loadId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE)
          schema: "public",
          table: "messages",
          filter: `load_id=eq.${loadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", loadId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadId, queryClient]);

  return query;
};

export const useUnreadMessages = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-messages"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    // Refresh every minute if no realtime event triggers
    refetchInterval: 60000,
  });

  // Global subscription for unread count
  useEffect(() => {
    const channel = supabase
      .channel("global-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // Ideally check if receiver_id matches, but for now just refetch
          queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useConversations = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["conversations", page, pageSize],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const offset = (page - 1) * pageSize;

      // Get all messages where user is sender or receiver with pagination
      const { data: messages, error, count } = await supabase
        .from("messages")
        .select(`
          *,
          loads (
            id,
            load_number,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            status,
            shipper_id,
            carrier_id
          )
        `, { count: 'exact' })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      // Group by load and get the latest message for each
      const conversationsMap = new Map();

      messages?.forEach((msg: any) => {
        if (!msg.load_id || conversationsMap.has(msg.load_id)) return;

        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const unreadCount = messages.filter(
          (m: any) => m.load_id === msg.load_id &&
            m.receiver_id === user.id &&
            !m.read
        ).length;

        conversationsMap.set(msg.load_id, {
          loadId: msg.load_id,
          load: msg.loads,
          latestMessage: msg,
          otherUserId,
          unreadCount,
        });
      });

      return {
        conversations: Array.from(conversationsMap.values()),
        totalCount: count || 0,
        hasMore: (count || 0) > offset + pageSize,
      };
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Omit<MessageInsert, "sender_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({ ...message, sender_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.load_id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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

export const useMarkMessageRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, loadId }: { messageId: string; loadId: string }) => {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId);

      if (error) throw error;
      return { messageId, loadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.loadId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkAllMessagesRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loadId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("load_id", loadId)
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return loadId;
    },
    onSuccess: (loadId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", loadId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
