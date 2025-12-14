import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Target, Users, Zap, Shield, CheckCircle2, TrendingDown, Clock, DollarSign, Award, ArrowRight, Phone, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SiteAbout() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Animated counters
  const [totalSaved, setTotalSaved] = useState(0);
  const [carriersConnected, setCarriersConnected] = useState(0);
  const [loadsMoved, setLoadsMoved] = useState(0);

  useEffect(() => {
    const animateCounter = (setter: (val: number) => void, target: number, duration: number) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setter(target);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
      return timer;
    };

    const timer1 = animateCounter(setTotalSaved, 2400000, 2000);
    const timer2 = animateCounter(setCarriersConnected, 5000, 2000);
    const timer3 = animateCounter(setLoadsMoved, 8500, 2000);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-newsletter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email, source: "about" }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: data.message || "You've been added to our newsletter.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to subscribe. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavSite />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">
              Building the Future of Freight
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About Ship AI</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connecting shippers and carriers directly — no brokers, no markups, just AI-powered efficiency
            </p>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
          >
            <Card className="glass-card p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${totalSaved.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Saved for Customers</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <Users className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">
                {carriersConnected.toLocaleString()}+
              </div>
              <p className="text-sm text-muted-foreground">Verified Carriers</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-3xl font-bold mb-1">
                {loadsMoved.toLocaleString()}+
              </div>
              <p className="text-sm text-muted-foreground">Loads Moved</p>
            </Card>
          </motion.div>

          {/* Before vs After Comparison */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">The Freight Industry: Before & After Ship AI</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card p-6 border-destructive/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold">Traditional (With Brokers)</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-1 text-destructive shrink-0" />
                    <span>Endless phone calls and emails for updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 mt-1 text-destructive shrink-0" />
                    <span>15-60% broker markups eating profit margins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-1 text-destructive shrink-0" />
                    <span>Manual paperwork and documentation delays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-1 text-destructive shrink-0" />
                    <span>30-60 day payment cycles for carriers</span>
                  </li>
                </ul>
              </Card>

              <Card className="glass-card p-6 border-green-500/30 bg-green-500/5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">With Ship AI</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-green-600 shrink-0" />
                    <span>AI-automated status updates and followups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-green-600 shrink-0" />
                    <span>Direct pricing — zero broker markup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-green-600 shrink-0" />
                    <span>Automated documentation with AI parsing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-green-600 shrink-0" />
                    <span>Fast payouts after POD approval</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Mission */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="glass-card p-8">
              <Target className="w-12 h-12 text-accent mb-4 mx-auto" />
              <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>
              <p className="text-lg text-muted-foreground text-center leading-relaxed">
                To connect shippers and carriers directly, eliminating broker markups and using AI to automate operations.
                We believe freight should be <strong className="text-foreground">cheaper</strong>, <strong className="text-foreground">clearer</strong>, and <strong className="text-foreground">fairer</strong> for everyone.
              </p>
            </Card>
          </div>

          {/* Story */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Why We Exist</h2>
            <Card className="glass-card p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">❌</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">The Problem</h3>
                  <p className="text-muted-foreground">
                    The freight industry is broken. Brokers take 15-60% cuts while adding little value. Carriers struggle with cash flow.
                    Shippers overpay and lack transparency. Phone calls, emails, and paperwork slow everything down.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-accent" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">The Solution</h3>
                  <p className="text-muted-foreground">
                    Ship AI changes this. We give shippers direct access to verified carriers. We use AI to automate followups, documentation,
                    and status updates. We hold payments in escrow and release them fast after proof of delivery. <strong className="text-foreground">No middleman, no markups, no waiting.</strong>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Safety</h3>
                  <p className="text-sm text-muted-foreground">
                    Verified carriers, secure payments, protected data
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Transparency</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear pricing, open communication, no hidden fees
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Speed</h3>
                  <p className="text-sm text-muted-foreground">
                    AI automation, instant bookings, fast payouts
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card p-6 text-center h-full hover:border-accent/50 transition-all">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fairness</h3>
                  <p className="text-sm text-muted-foreground">
                    Direct relationships, fair rates, equal access
                  </p>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-accent" />
                  <div>
                    <div className="font-bold">Sarah Johnson</div>
                    <div className="text-sm text-muted-foreground">Logistics Manager, MidWest Manufacturing</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "We've cut our shipping costs by 38% since switching to Ship AI. No more broker markups, and the AI automation saves our team 15+ hours per week."
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="secondary">38% savings</Badge>
                  <Badge variant="secondary">15hrs/week saved</Badge>
                </div>
              </Card>

              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-accent" />
                  <div>
                    <div className="font-bold">Mike Rodriguez</div>
                    <div className="text-sm text-muted-foreground">Owner, Rodriguez Trucking</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Direct access to shippers means better rates for me. Plus, getting paid in days instead of weeks has transformed my cash flow."
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="secondary">Better rates</Badge>
                  <Badge variant="secondary">Fast payments</Badge>
                </div>
              </Card>
            </div>
          </div>



          {/* Newsletter */}
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="glass-card p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-muted-foreground mb-6">
                Get product updates & freight insights delivered to your inbox
              </p>

              {isSuccess ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-700">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Success! You're subscribed.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button type="submit" variant="default" disabled={isSubmitting}>
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Contact CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-6">
              Join the future of freight today
            </p>
            <Button variant="default" size="lg" asChild>
              <Link to="/site/auth">Create your account</Link>
            </Button>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
