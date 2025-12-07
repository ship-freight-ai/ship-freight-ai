import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  useCreateConnectAccount, 
  useCreateOnboardingLink, 
  useConnectStatus 
} from "@/hooks/useStripeConnect";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  AlertTriangle,
  DollarSign
} from "lucide-react";

export function StripeConnectCard() {
  const { data: status, isLoading: statusLoading, refetch } = useConnectStatus();
  const createAccount = useCreateConnectAccount();
  const createOnboardingLink = useCreateOnboardingLink();

  const handleConnectStripe = async () => {
    try {
      // First create account if it doesn't exist
      await createAccount.mutateAsync();
      // Then open onboarding
      await createOnboardingLink.mutateAsync();
      // Refetch status after a delay
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error("Error connecting Stripe:", error);
    }
  };

  const handleContinueOnboarding = async () => {
    await createOnboardingLink.mutateAsync();
    setTimeout(() => refetch(), 2000);
  };

  if (statusLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  // Account fully connected
  if (status?.connected) {
    return (
      <Card className="p-6 border-green-200 bg-green-50/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Stripe Connect Enabled
              <Badge className="bg-green-600">Active</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your Stripe account is connected and ready to receive payouts. 
              You'll receive direct deposits to your bank account when loads are completed.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Platform fee: 3% per transaction</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Account exists but onboarding incomplete
  if (status?.details_submitted === false) {
    return (
      <Card className="p-6 border-orange-200 bg-orange-50/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Complete Your Stripe Setup
              <Badge variant="secondary">Pending</Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You started connecting your Stripe account, but need to complete the onboarding process 
              to receive direct payouts.
            </p>
            <Alert className="mb-4">
              <AlertDescription className="text-sm">
                <strong>What's needed:</strong> Complete your business details, 
                verify your identity, and connect your bank account.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleContinueOnboarding}
              disabled={createOnboardingLink.isPending}
              variant="default"
            >
              {createOnboardingLink.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue Stripe Setup
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // No account yet
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Connect Stripe for Direct Payouts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Stripe account to receive direct payouts when you complete loads. 
            Get paid faster with automatic transfers to your bank account.
          </p>
          
          <div className="bg-secondary/30 rounded-lg p-4 mb-4 space-y-2">
            <h4 className="font-medium text-sm mb-2">Benefits:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Automatic payouts within 2 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Secure and verified by Stripe</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>Track all payouts in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span>3% platform fee (deducted automatically)</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleConnectStripe}
            disabled={createAccount.isPending || createOnboardingLink.isPending}
            variant="hero"
            size="lg"
          >
            {createAccount.isPending || createOnboardingLink.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Connect Stripe Account
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
