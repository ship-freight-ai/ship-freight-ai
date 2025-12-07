import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Check } from "lucide-react";

export default function SelectPlan() {
  const navigate = useNavigate();
  const { createCheckout } = useSubscription();
  const { data: roleData } = useUserRole();
  const { toast } = useToast();
  const [seats, setSeats] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const role = roleData?.role || 'shipper';
  const isShipper = role === 'shipper';

  const pricing = {
    shipper: {
      monthly: 189,
      annual: 1814.40,
    },
    carrier: {
      monthly: 49,
      annual: 470.40,
    },
  };

  const pricePerSeat = isShipper ? pricing.shipper[billingCycle] : pricing.carrier[billingCycle];
  const totalPrice = pricePerSeat * seats;
  const annualSavings = isShipper 
    ? (pricing.shipper.monthly * 12 - pricing.shipper.annual) * seats
    : (pricing.carrier.monthly * 12 - pricing.carrier.annual) * seats;

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const checkoutUrl = await createCheckout(seats, billingCycle);
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            {isShipper ? 'Shipper' : 'Carrier'} Plan - Start your 14-day free trial
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Billing Cycle</CardTitle>
            <CardDescription>Select monthly or annual billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('monthly')}
                className="h-auto py-4"
              >
                <div className="text-left w-full">
                  <div className="font-semibold">Monthly</div>
                  <div className="text-sm opacity-80">
                    ${isShipper ? pricing.shipper.monthly : pricing.carrier.monthly}/seat/month
                  </div>
                </div>
              </Button>
              <Button
                variant={billingCycle === 'annual' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('annual')}
                className="h-auto py-4 relative"
              >
                {billingCycle === 'annual' && (
                  <Badge className="absolute -top-2 -right-2">Save 20%</Badge>
                )}
                <div className="text-left w-full">
                  <div className="font-semibold">Annual</div>
                  <div className="text-sm opacity-80">
                    ${((isShipper ? pricing.shipper.annual : pricing.carrier.annual) / 12).toFixed(2)}/seat/month
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Number of Seats</CardTitle>
            <CardDescription>How many team members will use this account?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                disabled={seats <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-5xl font-bold">{seats}</div>
                <div className="text-sm text-muted-foreground">
                  {seats === 1 ? 'seat' : 'seats'}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSeats(Math.min(100, seats + 1))}
                disabled={seats >= 100}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Price Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-lg">
              <span>Price per seat ({billingCycle}):</span>
              <span className="font-semibold">${pricePerSeat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Number of seats:</span>
              <span className="font-semibold">{seats}</span>
            </div>
            {billingCycle === 'annual' && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Annual savings:</span>
                <span className="font-semibold">${annualSavings.toFixed(2)}/year</span>
              </div>
            )}
            <div className="border-t pt-4 flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}{billingCycle === 'monthly' ? '/month' : '/year'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">14-Day Free Trial Includes:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Full access to all features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>No charge for 14 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Cancel anytime during trial</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Automatic billing after trial ends</span>
                </li>
              </ul>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleStartTrial}
              disabled={loading}
            >
              {loading ? "Starting checkout..." : "Start 14-Day Free Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
