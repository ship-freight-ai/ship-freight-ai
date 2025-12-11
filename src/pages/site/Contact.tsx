
import { useState, useEffect, useCallback } from "react";
import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// reCAPTCHA Enterprise Site Key
const RECAPTCHA_SITE_KEY = "6Lc_sScsAAAAAJ3NGZ0VO54XmInfSYne4W0mX3MH";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const { toast } = useToast();

  // Load reCAPTCHA Enterprise script
  useEffect(() => {
    // Check if script already loaded (from Auth page)
    if ((window as any).grecaptcha?.enterprise) {
      setCaptchaReady(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="recaptcha/enterprise"]`);
    if (existingScript) {
      setTimeout(() => setCaptchaReady(true), 500);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(() => setCaptchaReady(true), 500);
    };
    document.head.appendChild(script);
  }, []);

  // Execute reCAPTCHA and get token
  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!captchaReady || !(window as any).grecaptcha?.enterprise) {
      toast({
        variant: "destructive",
        title: "Security Check Loading",
        description: "Please wait a moment and try again.",
      });
      return null;
    }

    try {
      const token = await (window as any).grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error("reCAPTCHA execute error:", error);
      toast({
        variant: "destructive",
        title: "Security Check Failed",
        description: "Please refresh the page and try again.",
      });
      return null;
    }
  }, [captchaReady, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Execute reCAPTCHA Enterprise
      const token = await executeRecaptcha("contact_form");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Insert into Supabase
      const { error } = await supabase
        .from("contact_submissions")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            status: 'new'
          },
        ]);

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Message Sent!",
        description: "We've received your message and will get back to you shortly.",
      });

      // Reset form
      setFormData({ name: "", email: "", subject: "", message: "" });

    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission failed",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <NavSite />

      <main className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Contact Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-6">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Have questions about Ship AI? Our team is here to help you optimize your freight operations.
            </p>
            <p className="text-muted-foreground">
              Fill out the form and we'll get back to you within 24 hours.
            </p>
          </div>

          {/* Contact Form */}
          <Card className="glass-card p-8 border-white/10 dark:border-white/5 shadow-xl relative overflow-hidden group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000" />

            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Message Sent!</h3>
                <p className="text-muted-foreground">
                  Thank you for reaching out. A member of our team will review your message and respond within 24 hours.
                </p>
                <Button
                  onClick={() => setIsSuccess(false)}
                  variant="outline"
                  className="mt-6"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-6 z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-background/50 border-white/10 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-background/50 border-white/10 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="bg-background/50 border-white/10 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your shipping needs..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="min-h-[150px] bg-background/50 border-white/10 focus:border-primary/50 resize-none"
                  />
                </div>

                {/* reCAPTCHA Enterprise Badge */}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Protected by reCAPTCHA Enterprise</span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>

      <FooterSite />
    </div>
  );
}

