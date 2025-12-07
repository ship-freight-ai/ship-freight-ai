import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  status: string | null;
  plan_type: 'shipper' | 'carrier' | null;
  billing_cycle: 'monthly' | 'annual' | null;
  seats: number;
  seats_used: number;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  is_owner: boolean;
  subscription_id?: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  refreshing: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: (seats: number, billingCycle: 'monthly' | 'annual') => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const isRefresh = subscription !== null;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }

      // Bypass for test users
      const TEST_EMAILS = ['test-shipper@shipai.com', 'test-carrier@shipai.com'];
      if (session.user.email && TEST_EMAILS.includes(session.user.email)) {
        console.log('Bypassing subscription check for test user:', session.user.email);
        const isShipper = session.user.email.includes('shipper');

        setSubscription({
          subscribed: true,
          status: 'trialing',
          plan_type: isShipper ? 'shipper' : 'carrier',
          billing_cycle: 'annual',
          seats: 5,
          seats_used: 1,
          trial_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          is_owner: true,
          subscription_id: 'test_sub_bypass'
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // Don't show toast on refresh to avoid spam
        if (!isRefresh) {
          // Only set to null if it's an actual error, not just no subscription
          if (error.message?.includes('Authentication error')) {
            // Auth error means user might not exist yet, keep loading
            setSubscription(null);
          } else {
            toast({
              title: "Error",
              description: "Failed to check subscription status",
              variant: "destructive",
            });
          }
        }
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createCheckout = async (seats: number, billingCycle: 'monthly' | 'annual'): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please log in to continue",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { seats, billingCycle },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error in createCheckout:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please log in to continue",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        toast({
          title: "Error",
          description: "Failed to open customer portal",
          variant: "destructive",
        });
        return;
      }

      // Open portal in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error in openCustomerPortal:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Check subscription on mount and when auth state changes
  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Defer to avoid deadlock
        setTimeout(() => {
          checkSubscription();
        }, 0);
      } else {
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // Listen for realtime subscription changes
  useEffect(() => {
    const setupRealtimeListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('Subscription changed via realtime:', payload);
            // Update subscription state with the new data
            if (payload.eventType === 'DELETE') {
              setSubscription(null);
            } else {
              checkSubscription();
            }
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupRealtimeListener();

    return () => {
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, []);

  const value = {
    subscription,
    loading,
    refreshing,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
