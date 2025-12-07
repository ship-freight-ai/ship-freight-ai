import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
});

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = newsletterSchema.parse({ email });
      
      // TODO: Integrate with Supabase
      setTimeout(() => {
        setIsSuccess(true);
        setIsSubmitting(false);
        setEmail("");
        toast({
          title: "Success!",
          description: "You've been added to our newsletter.",
        });
      }, 1000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card p-8 text-center max-w-2xl mx-auto">
      <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
      <p className="text-muted-foreground mb-6">
        Get product updates and freight insights delivered to your inbox
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
  );
};