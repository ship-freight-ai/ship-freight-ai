import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useSubscription } from "@/contexts/SubscriptionContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Routes that don't require a subscription
  const publicAppRoutes = [
    '/app/onboarding/check-status',
    '/app/onboarding/select-plan',
    '/app/onboarding/trial-started',
    '/app/claim-seat',
    '/app/billing',
  ];

  const isPublicAppRoute = publicAppRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/site/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (!session) {
        navigate('/site/auth');
      }
    });

    return () => authSubscription.unsubscribe();
  }, [navigate]);

  // Subscription check - controlled by VITE_TESTING_MODE
  useEffect(() => {
    const isTestingMode = import.meta.env.VITE_TESTING_MODE === 'true';
    
    // Skip subscription check in testing mode
    if (isTestingMode) return;
    
    // PRODUCTION MODE: Verify subscription
    if (loading || subscriptionLoading || !session) return;

    // Allow access to public app routes
    if (isPublicAppRoute) return;

    // Check subscription status
    if (!subscription?.subscribed || !['active', 'trialing'].includes(subscription.status || '')) {
      navigate('/app/onboarding/check-status');
    }
  }, [loading, subscriptionLoading, session, subscription, isPublicAppRoute, navigate]);

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return session ? <>{children}</> : null;
};
