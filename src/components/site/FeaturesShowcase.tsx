import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, MapPin, TrendingUp, Truck, DollarSign, Globe2, Clock, Award, CheckCircle2, Star, Lock, Activity, Target } from "lucide-react";
import { useState } from "react";
const features = [{
  icon: Shield,
  title: "Top-Tier Verified Carriers",
  description: "Access 50,000+ pre-vetted carriers with verified MC numbers, safety scores, and real performance data",
  metrics: ["99.8% On-Time", "DOT Verified", "Insurance Checked"],
  color: "from-blue-500 to-cyan-500",
  delay: 0
}, {
  icon: Truck,
  title: "Every Equipment Type",
  description: "Dry Van, Reefer, Flatbed, Step Deck, Power Only, Intermodal - all available 24/7 nationwide",
  metrics: ["15+ Equipment Types", "Real-Time Availability", "Instant Quotes"],
  color: "from-fuchsia-500 to-purple-500",
  delay: 0.1
}, {
  icon: Globe2,
  title: "Full North America Coverage",
  description: "Seamless shipping across all 50 US states, Canada, and cross-border Mexico with compliance built-in",
  metrics: ["US + Canada + Mexico", "Cross-Border Ready", "Custom Docs"],
  color: "from-green-500 to-emerald-500",
  delay: 0.2
}, {
  icon: Zap,
  title: "AI Document Processing",
  description: "Upload PDFs, emails, Excel, CSV, or paste text - our AI instantly extracts all shipment details and creates loads ready to book",
  metrics: ["Any File Format", "8 Sec Processing", "99.9% Accuracy"],
  color: "from-orange-500 to-red-500",
  delay: 0.3
}, {
  icon: DollarSign,
  title: "Guaranteed Fast Payments",
  description: "Escrow-protected payments release 2-3 days after POD approval - no more 30-60 day waits",
  metrics: ["2-3 Day Payout", "Escrow Protected", "Zero Disputes"],
  color: "from-yellow-500 to-orange-500",
  delay: 0.4
}, {
  icon: MapPin,
  title: "Real-Time Load Tracking",
  description: "Dispatchers share tracking links with every bid - shipment managers monitor all loads from one web dashboard",
  metrics: ["Live Updates", "Web Dashboard", "Flexible Tracking"],
  color: "from-purple-500 to-fuchsia-500",
  delay: 0.5
}, {
  icon: Award,
  title: "Performance Analytics",
  description: "See carrier on-time rates, customer ratings, and lane expertise before you book",
  metrics: ["5-Star Ratings", "Lane History", "Performance Scores"],
  color: "from-pink-500 to-rose-500",
  delay: 0.6
}, {
  icon: Clock,
  title: "24/7 Platform Access",
  description: "Book, track, and manage loads any time - AI handles matching even while you sleep",
  metrics: ["Always On", "Instant Response", "No Downtime"],
  color: "from-teal-500 to-cyan-500",
  delay: 0.7
}, {
  icon: Lock,
  title: "Transparent Pricing",
  description: "No hidden fees, no broker markups - see exactly what you pay and what carriers earn",
  metrics: ["No Hidden Fees", "Full Disclosure", "Direct Rates"],
  color: "from-fuchsia-500 to-purple-600",
  delay: 0.8
}];
const stats = [{
  value: "50K+",
  label: "Verified Carriers",
  icon: Truck
}, {
  value: "15+",
  label: "Equipment Types",
  icon: Activity
}, {
  value: "99.8%",
  label: "On-Time Delivery",
  icon: Target
}, {
  value: "Nationwide",
  label: "Full North America Coverage",
  icon: Globe2
}];
export const FeaturesShowcase = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return <section className="py-24 relative overflow-hidden">
    {/* Animated Background */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>
    <motion.div className="absolute inset-0 opacity-30" animate={{
      background: ["radial-gradient(circle at 20% 50%, hsl(293 84% 61% / 0.15) 0%, transparent 50%)", "radial-gradient(circle at 80% 50%, hsl(217 91% 60% / 0.15) 0%, transparent 50%)", "radial-gradient(circle at 50% 50%, hsl(199 89% 48% / 0.12) 0%, transparent 50%)"]
    }} transition={{
      duration: 10,
      repeat: Infinity,
      ease: "linear"
    }} />

    <div className="container mx-auto px-4 relative z-10">
      {/* Header */}
      <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-16">
        <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium border-accent/30 bg-accent/5">
          <Star className="w-4 h-4 mr-2 inline text-yellow-500 fill-yellow-500" />
          Everything You Need to Ship Smarter
        </Badge>

        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-gradient">Complete freight platform.</span>
          <br />
          <span className="text-foreground">AI-powered, commission-free.</span>
        </h2>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Access 50,000+ verified carriers, instant AI document processing, real-time tracking, and fast guaranteed payments - all on one platform with zero broker fees.
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-5xl mx-auto">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return <motion.div key={idx} initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: idx * 0.1
          }} whileHover={{
            scale: 1.05
          }}>
            <Card className="glass-card p-6 text-center border-2 border-transparent hover:border-primary/20 transition-all">
              <Icon className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-3xl md:text-4xl font-bold text-primary dark:text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-foreground/80 font-medium">{stat.label}</div>
            </Card>
          </motion.div>;
        })}
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          const isHovered = hoveredIndex === idx;
          return <motion.div key={idx} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: feature.delay,
            duration: 0.5
          }} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
            <Card className="glass-card p-6 h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 group relative overflow-hidden">
              {/* Animated gradient background on hover */}
              <motion.div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              <div className="relative z-10">
                {/* Icon */}
                <motion.div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 shadow-lg`} animate={isHovered ? {
                  rotate: [0, -10, 10, -10, 0],
                  scale: 1.1
                } : {}} transition={{
                  duration: 0.5
                }}>
                  <Icon className="w-full h-full text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Metrics */}
                <div className="flex flex-wrap gap-2">
                  {feature.metrics.map((metric, metricIdx) => <motion.div key={metricIdx} initial={{
                    opacity: 0,
                    scale: 0.8
                  }} whileInView={{
                    opacity: 1,
                    scale: 1
                  }} viewport={{
                    once: true
                  }} transition={{
                    delay: feature.delay + metricIdx * 0.1
                  }}>
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {metric}
                    </Badge>
                  </motion.div>)}
                </div>
              </div>
            </Card>
          </motion.div>;
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mt-16">
        <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/5 to-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <motion.div animate={{
              rotate: 360
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}>
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </motion.div>
            <h4 className="text-2xl font-bold text-primary dark:text-gradient">
              Let AI handle your freight
            </h4>
            <motion.div animate={{
              rotate: -360
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}>
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </motion.div>
          </div>
          <p className="text-foreground/80 max-w-2xl">Thousands of carriers trust our AI to process their documents, match carriers, and eliminate broker fees - saving 15-60% on every shipment</p>
        </div>
      </motion.div>
    </div>
  </section>;
};