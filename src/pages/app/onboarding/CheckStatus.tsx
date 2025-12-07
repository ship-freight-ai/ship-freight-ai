import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useUserRole } from "@/hooks/useUserRole";

export default function CheckStatus() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const { data: roleData, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (loading || roleLoading) return;

    const isTestingMode = import.meta.env.VITE_TESTING_MODE === 'true';
    
    if (isTestingMode) {
      // TESTING MODE: Skip subscription check, redirect directly to dashboard
      const role = roleData?.role || 'shipper';
      navigate(`/app/dashboard/${role}`, { replace: true });
      return;
    }

    // PRODUCTION MODE: Check subscription status
    if (!subscription?.subscribed || !['active', 'trialing'].includes(subscription.status || '')) {
      // No active subscription, redirect to plan selection
      navigate('/app/onboarding/select-plan', { replace: true });
    } else {
      // Has active subscription, redirect to appropriate dashboard
      const role = roleData?.role || 'shipper';
      navigate(`/app/dashboard/${role}`, { replace: true });
    }
  }, [loading, roleData, roleLoading, subscription, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    </div>
  );
}
