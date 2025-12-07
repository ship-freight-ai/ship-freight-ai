import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      full_name?: string;
      company_name?: string;
      email_notifications?: boolean;
      bid_notifications?: boolean;
      message_notifications?: boolean;
      load_update_notifications?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateEmail = () => {
  return useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check your new email to confirm the change");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
