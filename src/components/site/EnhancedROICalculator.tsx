import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TrendingUp, Download, BarChart3, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { z } from "zod";
import { toast } from "sonner";

// Input validation schema
const roiInputSchema = z.object({
  monthlyLoads: z.number().int().min(1, "Must be at least 1").max(100000, "Must be less than 100,000"),
  avgLaneMiles: z.number().min(1, "Must be at least 1 mile").max(10000, "Must be less than 10,000 miles"),
  brokerMarkup: z.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  accessorials: z.number().min(0, "Cannot be negative").max(10000, "Must be less than $10,000"),
  carrierRate: z.number().min(0.1, "Must be at least $0.10").max(20, "Must be less than $20"),
  detention: z.number().min(0, "Cannot be negative").max(5000, "Must be less than $5,000"),
  seats: z.number().int().min(1, "Must be at least 1").max(200, "Must be less than 200"),
});

export const EnhancedROICalculator = () => {
  const [userType, setUserType] = useState<"shipper" | "carrier">("shipper");
  const [monthlyLoads, setMonthlyLoads] = useState(20);
  const [avgLaneMiles, setAvgLaneMiles] = useState(500);
  const [brokerMarkup, setBrokerMarkup] = useState(25);
  const [accessorials, setAccessorials] = useState(150);
  const [carrierRate, setCarrierRate] = useState(2.5); // per mile
  const [detention, setDetention] = useState(100);
  const [seats, setSeats] = useState(1);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Validation helper
  const validateInput = (field: keyof z.infer<typeof roiInputSchema>, value: number) => {
    try {
      roiInputSchema.shape[field].parse(value);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  // Pricing
  const shipperSeatPrice = 189;
  const carrierSeatPrice = 49;

  // Calculations for shippers
  const baseLoadCost = avgLaneMiles * carrierRate;
  const totalLoadCost = baseLoadCost + accessorials + detention;
  const brokerFeePerLoad = totalLoadCost * (brokerMarkup / 100);
  const monthlyBrokerFees = brokerFeePerLoad * monthlyLoads;
  const monthlyPlatformCost = shipperSeatPrice * seats;
  const shipperMonthlySavings = monthlyBrokerFees - monthlyPlatformCost;
  const shipperAnnualSavings = shipperMonthlySavings * 12;
  const breakEvenLoads = Math.ceil(monthlyPlatformCost / brokerFeePerLoad);
  
  // Time saved (assuming 30 min per load for manual processes)
  const hoursPerLoad = 0.5;
  const monthlyTimeSaved = monthlyLoads * hoursPerLoad;
  const annualTimeSaved = monthlyTimeSaved * 12;

  // Calculations for carriers
  const brokerRate = baseLoadCost; // What carrier gets through broker
  const directRate = brokerRate / (1 - brokerMarkup / 100); // What shipper pays
  const monthlyGainVsBroker = (directRate - brokerRate) * monthlyLoads;
  const carrierMonthlyCost = carrierSeatPrice * seats;
  const carrierMonthlyNetGain = monthlyGainVsBroker - carrierMonthlyCost;
  const carrierAnnualNetGain = carrierMonthlyNetGain * 12;
  const carrierBreakEvenLoads = Math.ceil(carrierMonthlyCost / (directRate - brokerRate));

  // Chart data
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    savings: userType === "shipper" ? shipperMonthlySavings : carrierMonthlyNetGain,
    cumulative: (userType === "shipper" ? shipperMonthlySavings : carrierMonthlyNetGain) * (i + 1),
  }));

  const downloadCSV = () => {
    const headers = userType === "shipper" 
      ? "Month,Monthly Savings,Cumulative Savings,Break-Even Loads,Time Saved (hrs)\n"
      : "Month,Monthly Gain,Cumulative Gain,Break-Even Loads,Time Saved (hrs)\n";
    
    const rows = monthlyData.map((d, i) => 
      `${d.month},$${d.savings.toFixed(2)},$${d.cumulative.toFixed(2)},${breakEvenLoads},${monthlyTimeSaved.toFixed(1)}`
    ).join('\n');
    
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ship-ai-roi-calculator-${userType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Card className="glass-card p-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <TrendingUp className="w-16 h-16 text-accent mx-auto mb-4" />
        <h2 className="text-4xl font-bold mb-3">ROI Calculator</h2>
        <p className="text-muted-foreground text-lg">
          Calculate exactly how much you'll {userType === "shipper" ? "save" : "gain"} by going direct
        </p>
      </div>

      {/* User Type Toggle */}
      <Tabs value={userType} onValueChange={(v) => setUserType(v as "shipper" | "carrier")} className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="shipper">I'm a Shipper</TabsTrigger>
          <TabsTrigger value="carrier">I'm a Carrier</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Inputs */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyLoads" className="text-base mb-2 block">Monthly loads</Label>
              <Input
                id="monthlyLoads"
                type="number"
                value={monthlyLoads}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('monthlyLoads', val)) {
                    setMonthlyLoads(val);
                  }
                }}
                min="1"
                max="100000"
              />
            </div>

            <div>
              <Label htmlFor="avgLaneMiles" className="text-base mb-2 block">Avg lane (miles)</Label>
              <Input
                id="avgLaneMiles"
                type="number"
                value={avgLaneMiles}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('avgLaneMiles', val)) {
                    setAvgLaneMiles(val);
                  }
                }}
                min="1"
                max="10000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="brokerMarkup" className="text-base mb-2 block">
              Broker markup %
            </Label>
            <Select value={brokerMarkup.toString()} onValueChange={(v) => setBrokerMarkup(Number(v))}>
              <SelectTrigger id="brokerMarkup">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15% (Low)</SelectItem>
                <SelectItem value="25">25% (Typical)</SelectItem>
                <SelectItem value="40">40% (High)</SelectItem>
                <SelectItem value="60">60% (Very High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carrierRate" className="text-base mb-2 block">Rate per mile ($)</Label>
              <Input
                id="carrierRate"
                type="number"
                step="0.1"
                value={carrierRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('carrierRate', val)) {
                    setCarrierRate(val);
                  }
                }}
                min="0.1"
                max="20"
              />
            </div>

            <div>
              <Label htmlFor="accessorials" className="text-base mb-2 block">Accessorials ($)</Label>
              <Input
                id="accessorials"
                type="number"
                value={accessorials}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('accessorials', val)) {
                    setAccessorials(val);
                  }
                }}
                min="0"
                max="10000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="detention" className="text-base mb-2 block">Detention ($)</Label>
              <Input
                id="detention"
                type="number"
                value={detention}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('detention', val)) {
                    setDetention(val);
                  }
                }}
                min="0"
                max="5000"
              />
            </div>

            <div>
              <Label htmlFor="seats" className="text-base mb-2 block">Seats needed</Label>
              <Input
                id="seats"
                type="number"
                value={seats}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (validateInput('seats', val)) {
                    setSeats(val);
                  }
                }}
                min="1"
                max="200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ${userType === "shipper" ? shipperSeatPrice : carrierSeatPrice}/seat/month
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={`${userType}-${monthlyLoads}-${brokerMarkup}-${avgLaneMiles}-${seats}`}
            className="space-y-4"
          >
            {userType === "shipper" ? (
              <>
                <Card className="bg-accent/10 border-accent/20 p-6">
                  <p className="text-sm text-muted-foreground mb-1">💰 Monthly savings</p>
                  <p className="text-4xl font-bold text-accent">
                    ${shipperMonthlySavings.toLocaleString()}
                  </p>
                </Card>

                <Card className="bg-primary/5 border-primary/10 p-6">
                  <p className="text-sm text-muted-foreground mb-1">📈 Annual savings</p>
                  <p className="text-3xl font-bold">
                    ${shipperAnnualSavings.toLocaleString()}
                  </p>
                </Card>

                <Card className="bg-secondary p-6">
                  <p className="text-sm text-muted-foreground mb-1">⚡ Break-even point</p>
                  <p className="text-2xl font-bold">
                    {breakEvenLoads} loads/month
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're shipping {monthlyLoads} loads
                  </p>
                </Card>

                <Card className="bg-green-500/10 border-green-500/20 p-6">
                  <p className="text-sm text-muted-foreground mb-1">⏱️ Time saved annually</p>
                  <p className="text-2xl font-bold text-green-700">
                    {annualTimeSaved.toFixed(0)} hours
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~{(annualTimeSaved / 40).toFixed(1)} work weeks
                  </p>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-accent/10 border-accent/20 p-6">
                  <p className="text-sm text-muted-foreground mb-1">💰 Monthly net gain</p>
                  <p className="text-4xl font-bold text-accent">
                    ${carrierMonthlyNetGain.toLocaleString()}
                  </p>
                </Card>

                <Card className="bg-primary/5 border-primary/10 p-6">
                  <p className="text-sm text-muted-foreground mb-1">📈 Annual net gain</p>
                  <p className="text-3xl font-bold">
                    ${carrierAnnualNetGain.toLocaleString()}
                  </p>
                </Card>

                <Card className="bg-secondary p-6">
                  <p className="text-sm text-muted-foreground mb-1">⚡ Break-even point</p>
                  <p className="text-2xl font-bold">
                    {carrierBreakEvenLoads} loads/month
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're hauling {monthlyLoads} loads
                  </p>
                </Card>

                <Card className="bg-green-500/10 border-green-500/20 p-6">
                  <p className="text-sm text-muted-foreground mb-1">⏱️ Time saved annually</p>
                  <p className="text-2xl font-bold text-green-700">
                    {annualTimeSaved.toFixed(0)} hours
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Less phone tag & paperwork
                  </p>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">
          {userType === "shipper" ? "Savings" : "Gains"} Over Time
        </h3>
        <div className="flex items-center gap-3">
          <Button
            variant={chartType === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Bar
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
          >
            <LineChart className="w-4 h-4 mr-2" />
            Line
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/50 rounded-lg p-6 border border-border/50">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "bar" ? (
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, userType === "shipper" ? "Savings" : "Gain"]}
              />
              <Legend />
              <Bar dataKey="savings" fill="hsl(var(--accent))" name={userType === "shipper" ? "Monthly Savings" : "Monthly Gain"} radius={[8, 8, 0, 0]} />
              <Bar dataKey="cumulative" fill="hsl(var(--primary))" name="Cumulative" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <RechartsLine data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, userType === "shipper" ? "Savings" : "Gain"]}
              />
              <Legend />
              <Line type="monotone" dataKey="savings" stroke="hsl(var(--accent))" strokeWidth={3} name={userType === "shipper" ? "Monthly Savings" : "Monthly Gain"} />
              <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={3} name="Cumulative" />
            </RechartsLine>
          )}
        </ResponsiveContainer>
      </div>

      <div className="text-center pt-6 border-t border-border mt-6">
        <p className="text-sm text-muted-foreground mb-2">
          {userType === "shipper" 
            ? "Estimates based on typical broker markups and operational costs. Your actual savings may vary." 
            : "Estimates based on direct rates vs. brokered rates. Actual gains depend on your lanes and negotiated rates."}
        </p>
        <p className="text-xs text-muted-foreground">
          Platform fees shown above. Payment processing fees apply to transactions.
        </p>
      </div>
    </Card>
  );
};