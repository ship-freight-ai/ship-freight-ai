import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Search,
  Zap,
  CheckCircle2,
  TrendingDown,
  Clock,
  DollarSign,
  MapPin,
  Truck,
  FileCheck,
  ArrowRight,
  Sparkles,
  Ban
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    step: 1,
    title: "AI Creates Your Shipment in 60 Seconds",
    subtitle: "Upload PDF, email, Excel, CSV, or just paste text - AI handles the rest",
    icon: Package,
    example: {
      title: "Real Example: Email to Shipment",
      details: [
        "📧 Forward email: 'Need 40k lbs LA to Dallas tomorrow'",
        "🤖 AI extracts: origin, destination, weight, dates",
        "⚡ Shipment created in 8 seconds",
        "✅ Ready to match with carriers instantly"
      ],
      result: "AI processed the email and created a complete shipment posting - no manual data entry, no broker calls",
      savings: "Saved 45 minutes vs calling broker and waiting for quote"
    },
    visual: "from-blue-500 to-cyan-500"
  },
  {
    step: 2,
    title: "AI Matches Perfect Carriers Instantly",
    subtitle: "Our AI analyzes 50K+ carriers and finds the best matches in seconds",
    icon: Search,
    example: {
      title: "Real Example: AI Carrier Matching",
      details: [
        "🤖 AI analyzed 50,000+ carrier profiles",
        "📊 Matched lane history + on-time rates",
        "⭐ 12 qualified bids received in 47 seconds",
        "💰 Best rate: $2,150 (broker quoted $2,800)"
      ],
      result: "AI found better carrier at 23% lower cost than broker quote - instantly",
      savings: "No broker markup of $650, no 2-day wait for quotes"
    },
    visual: "from-fuchsia-500 to-purple-500"
  },
  {
    step: 3,
    title: "Track, Deliver & Get Paid Fast",
    subtitle: "Simple tracking, instant POD upload, payment in 2-3 days",
    icon: CheckCircle2,
    example: {
      title: "Real Example: POD to Payment",
      details: [
        "🖥️ Carrier dispatcher shares tracking link",
        "✅ Delivered on time",
        "📄 POD uploaded via web dashboard",
        "💳 Funds released from escrow"
      ],
      result: "Payment processed in 48 hours - not 30-60 days",
      savings: "No factoring fees, no cash flow issues"
    },
    visual: "from-green-500 to-emerald-500"
  }
];

const benefits = [
  { icon: Ban, text: "No broker fees - AI does it better", color: "text-red-500" },
  { icon: Clock, text: "Seconds not days - AI is instant", color: "text-orange-500" },
  { icon: DollarSign, text: "90% cheaper than brokers", color: "text-green-500" },
  { icon: Zap, text: "AI reads any document format", color: "text-blue-500" }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5">
            <Sparkles className="w-4 h-4 mr-2 inline text-primary" />
            How It Works for Everyone
          </Badge>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Post Loads or Find Freight in 60 Seconds
          </h2>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Shippers: AI creates your shipment from any document and matches verified carriers instantly. Carriers: Find quality loads and get paid in 2-3 days. No brokers taking a cut from either side.
          </p>

          {/* Quick Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Icon className={`w-5 h-5 ${benefit.color}`} />
                  <span className="text-left">{benefit.text}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isEven = false;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="glass-card border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Left: Step Info */}
                    <div className={`${isEven ? 'md:order-2' : 'md:order-1'}`}>
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.visual} p-4 shadow-lg flex-shrink-0`}>
                          <Icon className="w-full h-full text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`bg-gradient-to-br ${step.visual} text-white border-0`}>
                              Step {step.step}
                            </Badge>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold mb-2">
                            {step.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {step.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Real Example */}
                    <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
                      <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Truck className="w-5 h-5 text-primary" />
                          <h4 className="font-bold text-lg">{step.example.title}</h4>
                        </div>

                        <div className="space-y-2 mb-4">
                          {step.example.details.map((detail, detailIdx) => (
                            <motion.div
                              key={detailIdx}
                              initial={{ opacity: 0, x: -10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.1 * detailIdx }}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                              <span>{detail}</span>
                            </motion.div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-border/50 space-y-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                                Result:
                              </p>
                              <p className="text-sm">{step.example.result}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <TrendingDown className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm text-primary">
                                You Avoided:
                              </p>
                              <p className="text-sm">{step.example.savings}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow to next step */}
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center pb-8">
                      <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                      </motion.div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
