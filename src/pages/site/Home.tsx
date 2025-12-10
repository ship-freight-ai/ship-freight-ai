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
import awsLogo from "@/assets/partners/aws.png";
import googleLogo from "@/assets/partners/google.png";
import nvidiaLogo from "@/assets/partners/nvidia.png";
import microsoftLogo from "@/assets/partners/microsoft.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
const partnerLogos = [
  { name: "NVIDIA Inception", logo: nvidiaLogo, className: "h-24" },
  { name: "Microsoft Founders Hub", logo: microsoftLogo, className: "h-24" },
  { name: "Google for Startups", logo: googleLogo, className: "h-36" }, // Bigger
  { name: "AWS Activate", logo: awsLogo, className: "h-24" }
];
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
    <section className="relative pt-40 pb-28 overflow-hidden min-h-[90vh] flex items-center justify-center bg-background transition-colors duration-300">
      {/* Background Effects - Deep Void Style (Dark) & Platinum Grid (Light) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

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
          <Badge variant="outline" className="mb-8 px-4 py-1.5 text-sm rounded-full border-primary/30 bg-primary/5 text-primary backdrop-blur-sm shadow-[0_0_15px_-3px_rgba(124,58,237,0.3)] animate-in fade-in zoom-in duration-500">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary animate-pulse" />
            <span className="font-medium">Next-Gen Freight Intelligence</span>
          </Badge>
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight fade-in-up text-foreground">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 dark:from-white dark:via-white/90 dark:to-white/50">Ditch Brokerages.</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-secondary animate-gradient-x">Automate Freight.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 fade-in-up-delay-1 max-w-3xl mx-auto leading-relaxed">
            Eliminate the middleman. Connect directly with enterprise shippers and unified assets in a <span className="text-foreground font-semibold">single chaotic-free dashboard</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center fade-in-up-delay-2">
            <Button variant="default" size="xl" asChild className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_-5px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_-5px_rgba(124,58,237,0.6)] transition-all duration-300">
              <Link to="/site/auth?mode=signup">Start Free Trial <span className="ml-2 font-mono text-xs opacity-70">→</span></Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="h-14 px-8 text-lg rounded-full border-border/50 bg-background/50 hover:bg-background/80 hover:text-foreground text-foreground transition-all backdrop-blur-sm shadow-sm dark:shadow-none dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white dark:text-gray-300">
              <Link to="/site/roi-calculator">Calculate Savings</Link>
            </Button>
          </div>
        </motion.div>

        {/* Partner Logos Carousel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-24 w-full overflow-hidden">
          <p className="text-center text-base text-muted-foreground mb-10 font-semibold">
            🏢 Backed by industry leaders
          </p>

          <div className="relative flex overflow-hidden w-full mask-gradient-x">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10"></div>

            <div className="flex w-max animate-scroll">
              <div className="flex shrink-0 items-center justify-around gap-8 min-w-full px-12">
                {partnerLogos.map((logo, i) => (
                  <div key={`set1-${i}`} className="flex items-center justify-center shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                    <img
                      src={logo.logo}
                      alt={logo.name}
                      className={`${logo.className || "h-24"} w-auto object-contain max-w-[200px]`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center justify-around gap-8 min-w-full px-12">
                {partnerLogos.map((logo, i) => (
                  <div key={`set2-${i}`} className="flex items-center justify-center shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                    <img
                      src={logo.logo}
                      alt={logo.name}
                      className={`${logo.className || "h-24"} w-auto object-contain max-w-[200px]`}
                    />
                  </div>
                ))}
              </div>
            </div>
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