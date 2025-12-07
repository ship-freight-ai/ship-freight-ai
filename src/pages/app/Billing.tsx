import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TeamManagement } from "@/components/app/TeamManagement";
import {
  CreditCard,
  Check,
  Sparkles,
  Users,
  Plus,
  Minus,
  Calendar,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info,
} from "lucide-react";
import { format } from "date-fns";

export default function AppBilling() {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, loading, createCheckout, openCustomerPortal, checkSubscription, refreshing } = useSubscription();
  const { data: userRole } = useUserRole();
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [seats, setSeats] = useState(1);
  const [checkingOut, setCheckingOut] = useState(false);

  // Pricing constants
  const PRICING = {
    shipper: { monthly: 189, annual: 1814.40 },
    carrier: { monthly: 49, annual: 470.40 }
  };

  // Check if we're on success or canceled page
  const isSuccessPage = location.pathname.includes('/success');
  const isCanceledPage = location.pathname.includes('/canceled');

  // Refresh subscription on success page
  useEffect(() => {
    if (isSuccessPage) {
      // Wait a bit for Stripe to process
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessPage]);

  const handleStartTrial = async () => {
    setCheckingOut(true);
    try {
      const url = await createCheckout(seats, billingCycle);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = () => {
    openCustomerPortal();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // TESTING MODE: Show testing mode message when enabled
  const isTestingMode = import.meta.env.VITE_TESTING_MODE === 'true';
  if (isTestingMode) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card p-12 text-center">
            <Info className="w-20 h-20 text-accent mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Testing Mode Active</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Subscription features are disabled for testing
            </p>
            <p className="text-muted-foreground mb-8">
              All platform features are accessible without payment during testing mode.
              Billing and subscription management are bypassed.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate(-1)}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccessPage) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card p-12 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">🎉 Welcome to Ship AI!</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Your 14-day free trial has started
            </p>
            
            <div className="bg-secondary/30 rounded-lg p-6 mb-8">
              <p className="text-lg mb-2">
                <strong>What happens now?</strong>
              </p>
              <ul className="text-left space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>You have full access to all platform features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Your payment method won't be charged for 14 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>Cancel anytime during the trial at no cost</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>After the trial, billing starts automatically</span>
                </li>
              </ul>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              onClick={() => navigate('/app/dashboard/shipper')}
              className="mb-4"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => navigate('/app/billing')}
            >
              View Subscription Details
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Canceled state
  if (isCanceledPage) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card p-12 text-center">
            <XCircle className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Checkout Canceled</h1>
            <p className="text-xl text-muted-foreground mb-8">
              No worries! You can start your trial anytime.
            </p>
            
            <Button 
              variant="hero" 
              size="lg" 
              onClick={() => navigate('/app/billing')}
            >
              Return to Billing
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // User has active subscription
  if (subscription?.subscribed && ['active', 'trialing'].includes(subscription.status || '')) {
    const planType = subscription.plan_type;
    const isTrialing = subscription.status === 'trialing';
    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end) : null;
    const periodEndDate = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

    // Calculate pricing
    const basePrice = planType === 'shipper' ? PRICING.shipper : PRICING.carrier;
    const pricePerSeat = subscription.billing_cycle === 'monthly' ? basePrice.monthly : basePrice.annual / 12;
    const totalMonthly = pricePerSeat * subscription.seats;
    const totalAnnual = subscription.billing_cycle === 'annual' 
      ? (planType === 'shipper' ? PRICING.shipper.annual : PRICING.carrier.annual) * subscription.seats
      : totalMonthly * 12;

    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
              <p className="text-muted-foreground">Manage your subscription and billing settings</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkSubscription()}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              {subscription?.is_owner && (
                <TabsTrigger value="team">Team Management</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="subscription">


          {/* Trial Alert */}
          {isTrialing && trialEndDate && (
            <Alert className="mb-6 bg-accent/10 border-accent">
              <Sparkles className="h-4 w-4 text-accent" />
              <AlertDescription>
                <strong>You're on a free trial!</strong> Your trial ends on {format(trialEndDate, 'MMMM d, yyyy')}. 
                First charge will be ${totalMonthly.toFixed(2)} on that date.
              </AlertDescription>
            </Alert>
          )}

          {/* Error States for Past Due and Incomplete */}
          {subscription?.status === 'past_due' && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription>
                Your last payment couldn't be processed. Please update your payment method to avoid service interruption.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3" 
                  onClick={handleManageSubscription}
                >
                  Update Payment Method
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {subscription?.status === 'incomplete' && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Incomplete Subscription</AlertTitle>
              <AlertDescription>
                Your subscription setup wasn't completed. Please complete the payment to activate your account.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3" 
                  onClick={handleManageSubscription}
                >
                  Complete Setup
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Subscription Card */}
          <Card className="glass-card p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">Your Subscription</h2>
                    <Badge className={isTrialing ? "bg-accent" : "bg-green-600"}>
                      {isTrialing ? "Trial Active" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {planType === 'shipper' ? 'Shipper' : 'Carrier'} Plan • {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} • {subscription.seats} {subscription.seats === 1 ? 'seat' : 'seats'}
                  </p>
                </div>
              </div>

              {/* Proration Information Alert */}
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Managing Your Subscription</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">
                    When you make changes through the Stripe portal:
                  </p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>
                      <strong>Adding seats:</strong> Prorated charge applied immediately for the current billing period
                    </li>
                    <li>
                      <strong>Removing seats:</strong> Credit applied to your next invoice
                    </li>
                    <li>
                      <strong>Changing billing cycle:</strong> Automatic prorated adjustment calculated
                    </li>
                    <li>
                      <strong>Canceling:</strong> Subscription remains active until the end of the current period
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={handleManageSubscription} variant="hero" size="lg" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Subscription in Stripe
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Price per seat</p>
                <p className="text-2xl font-bold">${pricePerSeat.toFixed(2)}/mo</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total seats</p>
                <p className="text-2xl font-bold">{subscription.seats}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monthly total</p>
                <p className="text-2xl font-bold text-accent">${totalMonthly.toFixed(2)}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {isTrialing ? 'Trial ends' : 'Current period ends'}
                </p>
                <p className="text-lg font-semibold">
                  {format(isTrialing && trialEndDate ? trialEndDate : periodEndDate || new Date(), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {isTrialing ? 'First charge' : 'Next charge'}
                </p>
                <p className="text-lg font-semibold">
                  ${subscription.billing_cycle === 'monthly' ? totalMonthly.toFixed(2) : totalAnnual.toFixed(2)}
                </p>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <Alert className="mt-6 bg-orange-50 border-orange-200">
                <AlertDescription>
                  Your subscription will be canceled at the end of the current period.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Manage in Portal Card */}
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Subscription Management</h3>
            <p className="text-muted-foreground mb-4">
              Click "Manage Subscription" to open the customer portal where you can:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Add or remove seats (prorated immediately)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Update your payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>View and download invoices</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Cancel your subscription</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>Switch between monthly and annual billing</span>
              </li>
            </ul>
          </Card>
            </TabsContent>

            {subscription?.is_owner && (
              <TabsContent value="team">
                <TeamManagement />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    );
  }

  // User does NOT have a subscription - show sign up flow
  const planType = userRole?.isShipper ? 'shipper' : 'carrier';
  const prices = planType === 'shipper' ? PRICING.shipper : PRICING.carrier;
  const monthlyTotal = prices.monthly * seats;
  const annualTotal = prices.annual * seats;
  const displayPrice = billingCycle === 'monthly' ? monthlyTotal : annualTotal / 12;
  const annualSavings = (monthlyTotal * 12) - annualTotal;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent">
            <Sparkles className="w-4 h-4 mr-1" />
            14-Day Free Trial
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Start Your Free Trial</h1>
          <p className="text-xl text-muted-foreground">
            No credit card charge for 14 days • Full access • Cancel anytime
          </p>
        </div>

        {/* Plan Selection Card */}
        <Card className="glass-card p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">Select Your Plan</h2>
            <Tabs 
              value={billingCycle} 
              onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")}
              className="mb-8"
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="annual">
                  Annual
                  <Badge className="ml-2 bg-green-600 text-white text-xs">Save 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator className="my-6" />

          {/* Seats Selector */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-6 h-6 text-accent" />
              <h3 className="text-xl font-bold">Number of Seats</h3>
            </div>
            
            <div className="flex items-center justify-center gap-6 mb-6">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                disabled={seats <= 1}
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <div className="text-center min-w-[120px]">
                <div className="text-5xl font-bold text-accent">{seats}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {seats === 1 ? 'seat' : 'seats'}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => setSeats(Math.min(100, seats + 1))}
                disabled={seats >= 100}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Pricing Summary */}
          <div className="bg-secondary/30 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">
                {planType === 'shipper' ? 'Shipper' : 'Carrier'} Plan • {seats} {seats === 1 ? 'seat' : 'seats'}
              </span>
              <span className="text-2xl font-bold">
                ${displayPrice.toFixed(2)}<span className="text-lg text-muted-foreground">/month</span>
              </span>
            </div>
            
            {billingCycle === 'annual' && (
              <div className="text-center">
                <Badge className="bg-green-600 text-white">
                  Save ${annualSavings.toFixed(2)}/year with annual billing
                </Badge>
              </div>
            )}
            
            <p className="text-sm text-center text-muted-foreground mt-4">
              {billingCycle === 'monthly' 
                ? `14-day free trial, then $${monthlyTotal.toFixed(2)}/month`
                : `14-day free trial, then $${annualTotal.toFixed(2)}/year (billed annually)`
              }
            </p>
          </div>

          {/* CTA Button */}
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full text-lg py-6"
            onClick={handleStartTrial}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Opening Checkout...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start Your Free Trial
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Powered by Stripe • Bank-level security • Cancel anytime
          </p>
        </Card>

        {/* Features Included */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">What's Included</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {planType === 'shipper' ? (
              <>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Post unlimited loads</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Access verified carrier network</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Escrow payment protection</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>AI-powered automation</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Access unlimited loads</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Direct shipper relationships</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Fast payouts after POD</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>Zero broker fees</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
