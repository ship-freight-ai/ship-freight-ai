import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { ROICalculator } from "@/components/site/ROICalculator";
import { TruckingAIDemo } from "@/components/site/TruckingAIDemo";
import { FeaturesShowcase } from "@/components/site/FeaturesShowcase";
import { HowItWorksSection } from "@/components/site/HowItWorksSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, DollarSign, CheckCircle2, TrendingUp, Clock, FileText, MessageSquare, BarChart3, Link as LinkIcon, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
const partnerLogos = [{
  name: "NVIDIA Inception",
  width: 140
}, {
  name: "Microsoft Founders Hub",
  width: 140
}, {
  name: "Google for Startups",
  width: 140
}, {
  name: "AWS Activate",
  width: 120
}];
export default function SiteHome() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    toast
  } = useToast();
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simple validation
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // TODO: Integrate with Supabase newsletter_subscribers table
    setTimeout(() => {
      setIsSuccess(true);
      setIsSubmitting(false);
      toast({
        title: "Success!",
        description: "You've been added to our newsletter."
      });
    }, 1000);
  };
  return <div className="min-h-screen">
    <NavSite />

    {/* Hero Section */}
    <section className="relative pt-40 pb-28 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-bg opacity-30" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="text-center max-w-5xl mx-auto">
          <Badge variant="outline" className="mb-8 text-sm border-accent/40 bg-accent/10 hover:bg-accent/20 transition-all shimmer">
            <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
            AI-Powered Freight Intelligence
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight fade-in-up">
            <span className="text-gradient">Ditch Freight Brokerages</span>
            <br />
            <span className="text-foreground">Automate Operations</span>
            <br />
            <span className="text-gradient">Match Freight Instantly</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 fade-in-up-delay-1 max-w-3xl mx-auto">You don't need a 3PL, cut the middleman, manage spot & contract freight, track assets in real time, handle billing & gain insights.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center fade-in-up-delay-2">
            <Button variant="default" size="xl" asChild className="shimmer glow-effect hover:scale-105 transition-all bg-primary hover:bg-primary/90">
              <Link to="/site/auth?mode=signup">Get started free</Link>
            </Button>
            <Button variant="glass" size="xl" asChild className="hover:scale-105 transition-all">
              <Link to="/site/roi-calculator">Calculate your savings</Link>
            </Button>
          </div>
        </motion.div>

        {/* Partner Logos */}
        <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.5
        }} className="mt-24">
          <p className="text-center text-base text-muted-foreground mb-10 font-semibold">
            🏢 Backed by industry leaders
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16">
            {partnerLogos.map((logo, i) => <motion.div key={i} initial={{
              opacity: 0,
              scale: 0.8
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              delay: 0.4 + i * 0.1
            }} className="glass-card px-8 py-5 rounded-xl hover:scale-110 transition-transform">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-accent" />
                <span className="text-foreground font-semibold" style={{
                  width: logo.width
                }}>
                  {logo.name}
                </span>
              </div>
            </motion.div>)}
          </div>
        </motion.div>
      </div>
    </section>

    <FeaturesShowcase />

    <HowItWorksSection />


    {/* ROI Calculator */}
    <section id="roi" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <ROICalculator />
      </div>
    </section>

    {/* Newsletter Signup */}
    <section className="py-20">
      <div className="container mx-auto px-4">
        <Card className="glass-card p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get product updates & freight insights</h2>
          <p className="text-muted-foreground mb-6">
            Join our newsletter for the latest features and industry trends
          </p>

          {isSuccess ? <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-700">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Success! You're subscribed.</p>
          </div> : <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
            <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" required />
            <Button type="submit" variant="hero" disabled={isSubmitting}>
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>}
        </Card>
      </div>
    </section>


    <FooterSite />
  </div>;
}