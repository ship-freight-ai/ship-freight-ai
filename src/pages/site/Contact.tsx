import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  category: z.enum(["carrier", "shipper", "media", "partnership", "other"], {
    required_error: "Please select an inquiry type",
  }),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function SiteContact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    category: "other",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate CAPTCHA
      if (!captchaToken) {
        toast({
          title: "Verification Required",
          description: "Please complete the CAPTCHA verification",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          ...validatedData,
          captchaToken,
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form and captcha
      setFormData({
        name: "",
        email: "",
        category: "other",
        message: "",
      });
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again or email us directly.",
          variant: "destructive",
        });
      }
      // Reset captcha on error
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen">
      <NavSite />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold mb-6">Get in Touch</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're a carrier, shipper, media outlet, or potential partner, we'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                      required
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Inquiry Type *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carrier">I'm a Carrier</SelectItem>
                        <SelectItem value="shipper">I'm a Shipper</SelectItem>
                        <SelectItem value="media">Media Inquiry</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Tell us how we can help..."
                      required
                      rows={6}
                      maxLength={1000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.message.length}/1000 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Verification *</Label>
                    <HCaptcha
                      sitekey="976ceb3a-35be-49c6-9b3c-d27c0f141b52"
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                      ref={captchaRef}
                      theme="light"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <Card className="glass-card p-6 hover:scale-105 transition-transform">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-accent/10">
                        <Mail className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a
                          href="mailto:go@shipfreight.ai"
                          className="text-muted-foreground hover:text-accent transition-colors"
                        >
                          go@shipfreight.ai
                        </a>
                      </div>
                    </div>
                  </Card>

                </div>
              </div>

              <Card className="glass-card p-6 bg-accent/5">
                <h3 className="font-semibold mb-3">Quick Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond to all inquiries within 24 hours during business days.
                  For urgent matters, please indicate "URGENT" in your message subject.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
