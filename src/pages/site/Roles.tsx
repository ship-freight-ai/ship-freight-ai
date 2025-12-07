import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Package, Truck, DollarSign, Clock, Shield, CheckCircle2, TrendingDown, Zap, ArrowRight, Target, Calendar, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function SiteRoles() {
  const [shipperLoads, setShipperLoads] = useState(50);
  const [brokerFee, setBrokerFee] = useState(25);

  const monthlyShipperSavings = shipperLoads * 1500 * (brokerFee / 100);
  const annualShipperSavings = monthlyShipperSavings * 12;

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
            <Badge variant="secondary" className="mb-4">
              Choose Your Role
            </Badge>
            <h1 className="text-5xl font-bold mb-4">For Shippers & Carriers</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how Ship AI transforms freight for your specific role — direct connections, zero broker fees, AI automation
            </p>
          </motion.div>

          <Tabs defaultValue="shippers" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1">
              <TabsTrigger value="shippers" className="text-base py-4 data-[state=active]:bg-accent/10 data-[state=active]:border-accent/50">
                <Package className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">Shippers</div>
                  <div className="text-xs text-muted-foreground">Save 15-60% per load</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="carriers" className="text-base py-4 data-[state=active]:bg-accent/10 data-[state=active]:border-accent/50">
                <Truck className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">Carriers</div>
                  <div className="text-xs text-muted-foreground">Get paid in days, not weeks</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shippers">
              <div className="space-y-12">
                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <TrendingDown className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Cut Broker Markups</h3>
                    <p className="text-muted-foreground mb-3">
                      Direct access to carriers means no 15-60% broker fees eating your margins
                    </p>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700">Save 15-60%</Badge>
                  </Card>

                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">AI Automation</h3>
                    <p className="text-muted-foreground mb-3">
                      Automate followups, status updates, and documentation with AI
                    </p>
                    <Badge variant="secondary">15+ hrs/week saved</Badge>
                  </Card>

                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
                    <p className="text-muted-foreground mb-3">
                      Escrow protection with automated POD verification
                    </p>
                    <Badge variant="secondary">100% protected</Badge>
                  </Card>
                </div>

                {/* Savings Calculator */}
                <Card className="glass-card p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/30">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-8 h-8 text-accent" />
                    <h3 className="text-2xl font-bold">Calculate Your Savings</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Monthly Loads</label>
                      <Input
                        type="number"
                        value={shipperLoads}
                        onChange={(e) => setShipperLoads(Number(e.target.value))}
                        className="text-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Avg Broker Fee %</label>
                      <Input
                        type="number"
                        value={brokerFee}
                        onChange={(e) => setBrokerFee(Number(e.target.value))}
                        className="text-lg"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-background/50 rounded-lg p-6 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Monthly Savings</div>
                      <div className="text-3xl font-bold text-green-600">
                        ${monthlyShipperSavings.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-6 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Annual Savings</div>
                      <div className="text-3xl font-bold text-green-600">
                        ${annualShipperSavings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* How it Works */}
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">How Ship AI Works for Shippers</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { num: 1, icon: FileCheck, title: "Post Your Load", desc: "Create load with pickup, delivery, equipment details" },
                      { num: 2, icon: CheckCircle2, title: "Review & Book", desc: "Get instant bids or choose your preferred carrier" },
                      { num: 3, icon: Target, title: "Track Progress", desc: "Real-time updates via carrier's tracking link" },
                      { num: 4, icon: DollarSign, title: "Auto Payment", desc: "Funds released instantly after POD approval" },
                    ].map((step) => (
                      <motion.div key={step.num} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                        <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <step.icon className="w-7 h-7 text-accent" />
                          </div>
                          <div className="text-sm font-bold text-accent mb-2">Step {step.num}</div>
                          <h4 className="font-bold mb-2">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Use Case Scenario */}
                <Card className="glass-card p-8 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                  <h3 className="text-xl font-bold mb-4">Real-World Example</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">MidWest Manufacturing</strong> ships 75 loads per month at an average cost of $2,500 per load.
                    </p>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      <span><strong className="text-green-600">Before Ship AI:</strong> Paid 30% broker markup = $56,250 extra per month</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      <span><strong className="text-green-600">After Ship AI:</strong> Direct carrier rates = $56,250 saved monthly ($675k annually)</span>
                    </div>
                  </div>
                  <Button variant="default" size="lg" className="mt-6" asChild>
                    <Link to="/site/auth">Start Saving Today</Link>
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="carriers">
              <div className="space-y-12">
                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Better Rates</h3>
                    <p className="text-muted-foreground mb-3">
                      Direct shipper relationships mean you keep the full rate — no broker cuts
                    </p>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700">Full rates</Badge>
                  </Card>

                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Fast Payments</h3>
                    <p className="text-muted-foreground mb-3">
                      Get paid in days after POD approval, not 30-60 day payment terms
                    </p>
                    <Badge variant="secondary">Days not weeks</Badge>
                  </Card>

                  <Card className="glass-card p-6 hover:border-accent/50 transition-all">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
                    <p className="text-muted-foreground mb-3">
                      See all load details upfront — lanes, dates, equipment, rates
                    </p>
                    <Badge variant="secondary">100% transparent</Badge>
                  </Card>
                </div>

                {/* Payment Timeline Comparison */}
                <Card className="glass-card p-8 bg-gradient-to-br from-accent/5 to-transparent border-accent/30">
                  <h3 className="text-2xl font-bold mb-6 text-center">Payment Timeline: Ship AI vs Traditional</h3>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-destructive" />
                        </div>
                        <h4 className="font-bold">Traditional Brokers</h4>
                      </div>
                      <div className="space-y-3 pl-13">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Day 1: Deliver load & submit POD</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Day 7-14: POD processing</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Day 30-60: Payment received</span>
                        </div>
                        <Badge variant="destructive">30-60 days to payment</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="font-bold">Ship AI</h4>
                      </div>
                      <div className="space-y-3 pl-13">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span>Day 1: Deliver load & upload POD</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span>Day 1-2: Shipper approves POD</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span>Day 2-3: Payment released</span>
                        </div>
                        <Badge className="bg-green-500/10 text-green-700">2-3 days to payment</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* How it Works */}
                <div>
                  <h3 className="text-2xl font-bold mb-6 text-center">How Ship AI Works for Carriers</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { num: 1, icon: Target, title: "Find Loads", desc: "Browse available loads in your preferred lanes" },
                      { num: 2, icon: CheckCircle2, title: "Bid or Book", desc: "Submit competitive bid with your tracking link" },
                      { num: 3, icon: Truck, title: "Deliver Freight", desc: "Complete delivery & upload proof of delivery" },
                      { num: 4, icon: DollarSign, title: "Get Paid Fast", desc: "Receive payment within 2-3 days of POD approval" },
                    ].map((step) => (
                      <motion.div key={step.num} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                        <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <step.icon className="w-7 h-7 text-accent" />
                          </div>
                          <div className="text-sm font-bold text-accent mb-2">Step {step.num}</div>
                          <h4 className="font-bold mb-2">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Use Case Scenario */}
                <Card className="glass-card p-8 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                  <h3 className="text-xl font-bold mb-4">Real-World Example</h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Rodriguez Trucking</strong> (3-truck operation) running Southeast lanes.
                    </p>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      <span><strong className="text-green-600">Before Ship AI:</strong> Average $1,800/load through brokers, paid in 45 days</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      <span><strong className="text-green-600">After Ship AI:</strong> Direct shipper rates of $2,400/load, paid in 3 days</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-green-600" />
                      <span><strong className="text-green-600">Result:</strong> +$600 per load + 42 days faster payment = better cash flow</span>
                    </div>
                  </div>
                  <Button variant="default" size="lg" className="mt-6" asChild>
                    <Link to="/site/auth">Join as a Carrier</Link>
                  </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
