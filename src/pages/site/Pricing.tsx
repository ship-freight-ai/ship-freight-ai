import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Users, Shield, Plus, Minus, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";


export default function SitePricing() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [shipperSeats, setShipperSeats] = useState(3);
  const [carrierSeats, setCarrierSeats] = useState(1);

  const shipperBasePrice = 189;
  const carrierBasePrice = 49;

  const shipperMonthlyTotal = shipperBasePrice * shipperSeats;
  const carrierMonthlyTotal = carrierBasePrice * carrierSeats;

  const annualDiscount = 0.20; // 20% off for annual billing

  const shipperAnnualTotal = shipperMonthlyTotal * 12 * (1 - annualDiscount);
  const carrierAnnualTotal = carrierMonthlyTotal * 12 * (1 - annualDiscount);

  const shipperDisplayPrice = billingCycle === "monthly" ? shipperMonthlyTotal : shipperAnnualTotal / 12;
  const carrierDisplayPrice = billingCycle === "monthly" ? carrierMonthlyTotal : carrierAnnualTotal / 12;

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Not logged in -> redirect to auth
      navigate('/site/auth');
    } else {
      // Logged in -> redirect to billing
      navigate('/app/billing');
    }
  };

  return (
    <div className="min-h-screen">
      <NavSite />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">Simple, transparent pricing</h1>

            {/* Billing Cycle Toggle */}
            <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")} className="mb-8">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="annual">
                  Annual <Badge className="ml-2 bg-accent text-white">Save 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {/* Shipper Pricing */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card p-8 hover:shadow-2xl transition-all duration-500 h-full">
                <Badge className="mb-4 bg-accent">For Shippers</Badge>
                
                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2">
                    ${shipperDisplayPrice.toFixed(0)}
                    <span className="text-xl text-muted-foreground ml-2">/ month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="text-sm text-green-600 font-semibold mt-1">
                      Save ${(shipperMonthlyTotal * 12 * annualDiscount).toFixed(0)}/year with annual billing
                    </div>
                  )}
                </div>

                {/* Seats Selector */}
                <div className="mb-6 bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" />
                      <Label className="text-base font-semibold">Seats</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShipperSeats(Math.max(1, shipperSeats - 1))}
                      disabled={shipperSeats <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-4xl font-bold text-accent">{shipperSeats}</div>
                      <div className="text-xs text-muted-foreground mt-1">seats selected</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShipperSeats(Math.min(100, shipperSeats + 1))}
                      disabled={shipperSeats >= 100}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Post unlimited loads</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Access verified carrier network</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Escrow payment protection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>AI-powered automation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Document management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>TMS integration support</span>
                  </li>
                </ul>

                <Button variant="hero" size="lg" className="w-full" onClick={handleGetStarted}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Card>
            </motion.div>

            {/* Carrier Pricing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card p-8 hover:shadow-2xl transition-all duration-500 h-full border-2 border-accent/50">
                <Badge className="mb-4 bg-accent">For Carriers - Most Popular</Badge>
                
                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2">
                    ${carrierDisplayPrice.toFixed(0)}
                    <span className="text-xl text-muted-foreground ml-2">/ month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="text-sm text-green-600 font-semibold mt-1">
                      Save ${(carrierMonthlyTotal * 12 * annualDiscount).toFixed(0)}/year with annual billing
                    </div>
                  )}
                </div>

                {/* Seats Selector */}
                <div className="mb-6 bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" />
                      <Label className="text-base font-semibold">Seats</Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCarrierSeats(Math.max(1, carrierSeats - 1))}
                      disabled={carrierSeats <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-4xl font-bold text-accent">{carrierSeats}</div>
                      <div className="text-xs text-muted-foreground mt-1">seats selected</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCarrierSeats(Math.min(100, carrierSeats + 1))}
                      disabled={carrierSeats >= 100}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Access unlimited loads</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Submit bids or instant book</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Fast payouts after POD</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Direct shipper relationships</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Document upload & management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Transparent load details</span>
                  </li>
                </ul>

                <Button variant="hero" size="lg" className="w-full" onClick={handleGetStarted}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Free Trial
                </Button>
              </Card>
            </motion.div>
          </div>

          {/* Payment Info */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-6 mb-6">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Powered by Stripe" className="h-8 opacity-60" />
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4" />
                <span>Bank-level security</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-2">
              Manage seats & billing from your dashboard. Cancel anytime.
            </p>
            <p className="text-sm text-muted-foreground">
              Taxes and payment processing fees may apply. All prices in USD.
            </p>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}