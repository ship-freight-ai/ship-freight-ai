import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingDown, Zap, Shield, TrendingUp, Clock, Eye, DollarSign, Sparkles } from "lucide-react";

const shipperBenefits = [
  {
    icon: DollarSign,
    title: "AI Costs 90% Less Than Brokers",
    benefit: "Automated Intelligence",
    description: "AI processes documents and matches carriers for pennies vs broker fees of 15-60% per load",
    metric: "90%",
    metricLabel: "Cost Savings",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Zap,
    title: "AI Processes Any Document Instantly",
    benefit: "Upload PDF, Email, Excel, CSV, Text",
    description: "AI extracts all shipment details in seconds - no manual data entry, no broker calls",
    metric: "8 Sec",
    metricLabel: "Processing Time",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: Shield,
    title: "AI Matches Better Than Brokers",
    benefit: "Smarter Carrier Selection",
    description: "AI analyzes 50K+ carriers instantly - finds better rates and reliability than human brokers",
    metric: "50K+",
    metricLabel: "Carriers Analyzed",
    color: "from-fuchsia-500 to-purple-600"
  }
];

const carrierBenefits = [
  {
    icon: TrendingUp,
    title: "Keep 100% of the Rate",
    benefit: "Direct Shipper Access",
    description: "No middleman taking a cut of your earnings",
    metric: "+25%",
    metricLabel: "More Revenue",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Clock,
    title: "Get Paid in Days",
    benefit: "Fast Payment Processing",
    description: "Quick payouts after POD submission, not weeks of waiting",
    metric: "2-3",
    metricLabel: "Day Payout",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: Eye,
    title: "Complete Transparency",
    benefit: "All Details Upfront",
    description: "See rates, requirements, and shipper details before accepting",
    metric: "100%",
    metricLabel: "Visibility",
    color: "from-fuchsia-500 to-purple-600"
  }
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-bg opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            AI Delivers Measurable ROI
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI processes any document format (PDF, email, Excel, CSV, text) into shipments instantly, then matches carriers faster and cheaper than human brokers
          </p>
        </motion.div>

        {/* Shippers Benefits */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-12 w-1 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <div>
              <h3 className="text-3xl font-bold">For Shippers & Dispatchers</h3>
              <p className="text-muted-foreground">AI automation replaces broker fees with instant intelligence</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {shipperBenefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-card p-6 h-full border-2 border-transparent hover:border-accent/50 transition-all duration-300 group">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-full h-full text-white" />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent from-foreground to-foreground/70">
                          {benefit.metric}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {benefit.metricLabel}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-sm font-medium text-accent mb-2">
                      {benefit.benefit}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Carriers Benefits */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-12 w-1 bg-gradient-to-b from-accent to-primary rounded-full"></div>
            <div>
              <h3 className="text-3xl font-bold">For Carriers</h3>
              <p className="text-muted-foreground">Higher revenue, faster payments, full transparency</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {carrierBenefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="glass-card p-6 h-full border-2 border-transparent hover:border-accent/50 transition-all duration-300 group">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-full h-full text-white" />
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold bg-gradient-to-br bg-clip-text text-transparent from-foreground to-foreground/70">
                          {benefit.metric}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {benefit.metricLabel}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h4>
                    <p className="text-sm font-medium text-accent mb-2">
                      {benefit.benefit}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 border border-accent/20">
            <Sparkles className="w-5 h-5 text-accent" />
            <p className="text-sm font-medium">
              Join thousands using AI to replace brokers, process documents instantly, and save 15-60% on freight
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
