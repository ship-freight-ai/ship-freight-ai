import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { TrendingUp, DollarSign, Calendar, Minus, Plus, ArrowRight, Briefcase, TrendingDown, Wallet, Trophy, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export const ROICalculator = () => {
  const [userType, setUserType] = useState<"shipper" | "carrier">("shipper");
  const [currency, setCurrency] = useState<"USD" | "CAD">("USD");
  const [avgRate, setAvgRate] = useState(2000);
  const [brokerMarkup, setBrokerMarkup] = useState(25);
  const [loadsPerMonth, setLoadsPerMonth] = useState(20);
  const [seats, setSeats] = useState(1);

  // Pricing based on currency
  const shipperSeatPrice = currency === "USD" ? 189 : 249;
  const carrierSeatPrice = currency === "USD" ? 49 : 65;

  // Calculations for shippers
  const monthlyBrokerFees = avgRate * (brokerMarkup / 100) * loadsPerMonth;
  const monthlyPlatformCost = shipperSeatPrice * seats;
  const shipperMonthlySavings = monthlyBrokerFees - monthlyPlatformCost;
  const shipperAnnualSavings = shipperMonthlySavings * 12;

  // Calculations for carriers
  // P = avg_direct × (1+m); carrier gets P × m/(1+m) more by going direct
  const brokerRate = avgRate; // What carrier would get through broker
  const directRate = brokerRate / (1 - brokerMarkup / 100); // What shipper actually pays
  const monthlyGainVsBroker = (directRate - brokerRate) * loadsPerMonth;
  const carrierMonthlyCost = carrierSeatPrice * seats;
  const carrierMonthlyNetGain = monthlyGainVsBroker - carrierMonthlyCost;
  const carrierAnnualNetGain = carrierMonthlyNetGain * 12;

  const currencySymbol = currency === "USD" ? "$" : "$";
  const currencySuffix = currency === "CAD" ? " CAD" : "";

  return (
    <Card className="glass-card p-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-4xl font-bold mb-3">ROI Calculator</h2>
        <p className="text-muted-foreground text-lg">
          See exactly how much you can {userType === "shipper" ? "save" : "gain"} by cutting out the middleman
        </p>
      </div>

      {/* User Type Toggle */}
      <Tabs value={userType} onValueChange={(v) => setUserType(v as "shipper" | "carrier")} className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="shipper">I'm a Shipper</TabsTrigger>
          <TabsTrigger value="carrier">I'm a Carrier</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Inputs */}
        <div className="space-y-6">
          <Card className="p-6 bg-secondary/30 border-secondary hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Your Business Details</h3>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="currency" className="text-base mb-2 block font-medium">Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "CAD")}>
                  <SelectTrigger id="currency" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="avgRate" className="text-base mb-2 block font-medium">
                  {userType === "shipper" ? "Average direct carrier rate" : "Average rate you get from brokers"}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="avgRate"
                    type="number"
                    value={avgRate}
                    onChange={(e) => setAvgRate(Number(e.target.value))}
                    className="pl-10 h-11"
                    min="0"
                    step="100"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per load</p>
              </div>

              <div>
                <Label htmlFor="markup" className="text-base mb-2 block font-medium">
                  {userType === "shipper" ? "Typical broker markup" : "Typical broker markup (% they take)"}
                </Label>
                <Select value={brokerMarkup.toString()} onValueChange={(v) => setBrokerMarkup(Number(v))}>
                  <SelectTrigger id="markup" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15% (Low)</SelectItem>
                    <SelectItem value="25">25% (Average)</SelectItem>
                    <SelectItem value="40">40% (High)</SelectItem>
                    <SelectItem value="60">60% (Very High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="loads" className="text-base mb-2 block font-medium">Loads per month</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="loads"
                    type="number"
                    value={loadsPerMonth}
                    onChange={(e) => setLoadsPerMonth(Number(e.target.value))}
                    className="pl-10 h-11"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="seats" className="text-base mb-2 block font-medium">Number of seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  min="1"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currencySymbol}{userType === "shipper" ? shipperSeatPrice : carrierSeatPrice}/seat/month
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={`${userType}-${avgRate}-${brokerMarkup}-${loadsPerMonth}-${seats}-${currency}`}
            className="space-y-4"
          >
            {userType === "shipper" ? (
              <>
                <Card className="bg-destructive/10 border-destructive/20 p-6 hover:bg-destructive/15 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-destructive/20 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Broker fees avoided</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-destructive">
                      {currencySymbol}{monthlyBrokerFees.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {currencySuffix || "monthly"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">If using traditional brokers</p>
                </Card>

                <Card className="bg-secondary/60 p-6 hover:bg-secondary/70 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Wallet className="w-5 h-5 text-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Platform cost</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">
                      {currencySymbol}{monthlyPlatformCost.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {currencySuffix || "monthly"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <CircleDollarSign className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {seats} seat{seats > 1 ? "s" : ""} × {currencySymbol}{shipperSeatPrice}
                    </p>
                  </div>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 dark:accent-gradient p-6 glow-effect hover:shadow-xl transition-all">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-white/90">Monthly net savings</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-white">
                        {currencySymbol}{shipperMonthlySavings.toLocaleString()}
                      </p>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {currencySuffix || "per month"}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs text-white/80">
                        {((shipperMonthlySavings / monthlyBrokerFees) * 100).toFixed(0)}% cost reduction
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-primary/10 border-primary/20 p-6 hover:bg-primary/15 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Annual projection</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-primary">
                      {currencySymbol}{shipperAnnualSavings.toLocaleString()}
                    </p>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      ×12 months
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total annual savings</p>
                </Card>

                <Card className="border-2 p-6 space-y-4">
                  <p className="font-semibold text-base mb-4">How we calculated your savings:</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Minus className="w-5 h-5 text-destructive" />
                        <span className="text-sm">Broker fees you avoid</span>
                      </div>
                      <Badge variant="destructive" className="text-base px-3 py-1">
                        {currencySymbol}{monthlyBrokerFees.toLocaleString()}{currencySuffix}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Minus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">Platform cost</span>
                      </div>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {currencySymbol}{monthlyPlatformCost.toLocaleString()}{currencySuffix}
                      </Badge>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Plus className="w-6 h-6 text-green-600" />
                          <span className="font-semibold text-lg">You save</span>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-600">
                            {currencySymbol}{shipperMonthlySavings.toLocaleString()}{currencySuffix}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-primary/5 border-primary/20 p-6 hover:bg-primary/10 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Extra revenue potential</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-primary">
                      {currencySymbol}{monthlyGainVsBroker.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {currencySuffix || "monthly"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Direct rates vs broker rates
                  </p>
                </Card>

                <Card className="bg-secondary/60 p-6 hover:bg-secondary/70 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Wallet className="w-5 h-5 text-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Platform cost</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">
                      {currencySymbol}{carrierMonthlyCost.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {currencySuffix || "monthly"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <CircleDollarSign className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {seats} seat{seats > 1 ? "s" : ""} × {currencySymbol}{carrierSeatPrice}
                    </p>
                  </div>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 dark:accent-gradient p-6 glow-effect hover:shadow-xl transition-all">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-white/90">Monthly net gain</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-white">
                        {currencySymbol}{carrierMonthlyNetGain.toLocaleString()}
                      </p>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {currencySuffix || "per month"}
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs text-white/80">
                        After platform costs
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-primary/10 border-primary/20 p-6 hover:bg-primary/15 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Annual projection</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-primary">
                      {currencySymbol}{carrierAnnualNetGain.toLocaleString()}
                    </p>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      ×12 months
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total annual gain</p>
                </Card>

                <Card className="border-2 p-6 space-y-4">
                  <p className="font-semibold text-base mb-4">How we calculated your gain:</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5 text-primary" />
                        <span className="text-sm">Extra revenue (direct vs broker)</span>
                      </div>
                      <Badge className="text-base px-3 py-1 bg-primary text-white">
                        {currencySymbol}{monthlyGainVsBroker.toLocaleString()}{currencySuffix}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Minus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">Platform cost</span>
                      </div>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {currencySymbol}{carrierMonthlyCost.toLocaleString()}{currencySuffix}
                      </Badge>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Plus className="w-6 h-6 text-green-600" />
                          <span className="font-semibold text-lg">You gain</span>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-600">
                            {currencySymbol}{carrierMonthlyNetGain.toLocaleString()}{currencySuffix}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="text-center pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-4">
          {userType === "shipper"
            ? "These are estimates. Actual savings depend on your specific broker rates and load volumes."
            : "These are estimates. Actual gains depend on your lanes and the rates you negotiate directly with shippers."}
        </p>
        <p className="text-xs text-muted-foreground">
          Platform fees shown above. Stripe payment processing fees may apply to transactions.
        </p>
      </div>
    </Card>
  );
};
