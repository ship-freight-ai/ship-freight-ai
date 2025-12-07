import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { CheckCircle2, Sparkles, Calendar, CreditCard, Shield } from "lucide-react";

export default function TrialStarted() {
  const navigate = useNavigate();
  const { data: roleData } = useUserRole();
  const role = roleData?.role || 'shipper';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            🎉 Your 14-Day Trial Has Started!
          </h1>
          <p className="text-xl text-muted-foreground">
            Welcome aboard! You now have full access to all features.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-6">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Full Feature Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore all premium features without any limitations during your trial period.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">14 Days Free</h3>
                  <p className="text-sm text-muted-foreground">
                    You won't be charged for the next 14 days. Use this time to explore and see the value.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Cancel Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    No commitment required. You can cancel your subscription at any time before the trial ends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automatic Billing</h3>
                  <p className="text-sm text-muted-foreground">
                    After your trial, billing will start automatically. Manage your subscription in the billing section.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate(`/app/dashboard/${role}`)}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
