import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionAnalytics {
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  past_due_subscriptions: number;
  shipper_subscriptions: number;
  carrier_subscriptions: number;
  monthly_revenue: number;
  annual_revenue: number;
  total_seats: number;
  avg_seats_per_subscription: number;
}

export const useSubscriptionAnalytics = () => {
  return useQuery({
    queryKey: ["subscription-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_subscription_analytics");
      
      if (error) {
        console.error("Error fetching subscription analytics:", error);
        throw error;
      }
      
      return data as unknown as SubscriptionAnalytics;
    },
  });
};

export const useAllSubscriptions = () => {
  return useQuery({
    queryKey: ["all-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles!inner(
            email,
            full_name,
            company_name,
            role
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching all subscriptions:", error);
        throw error;
      }
      
      return data;
    },
  });
};
