import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Accept any valid email address (personal or business)
const emailSchema = z.string().email("Invalid email address");

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export default function SiteAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const mode = searchParams.get('mode') || 'signup';
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [selectedRole, setSelectedRole] = useState<'shipper' | 'carrier' | null>(mode === 'login' ? 'shipper' : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/app/onboarding/check-status');
        }
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/app/onboarding/check-status');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Validate inputs
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: emailResult.error.errors[0].message,
        });
        setIsLoading(false);
        return;
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast({
          variant: "destructive",
          title: "Invalid Password",
          description: passwordResult.error.errors[0].message,
        });
        setIsLoading(false);
        return;
      }

      if (isSignUp) {
        if (!selectedRole) {
          toast({
            variant: "destructive",
            title: "Role Required",
            description: "Please select whether you're a shipper or carrier",
          });
          setIsLoading(false);
          return;
        }

        if (!fullName.trim()) {
          toast({
            variant: "destructive",
            title: "Name Required",
            description: "Please enter your full name",
          });
          setIsLoading(false);
          return;
        }

        if (!companyName.trim()) {
          toast({
            variant: "destructive",
            title: "Company Required",
            description: "Please enter your company name",
          });
          setIsLoading(false);
          return;
        }

        // Validate CAPTCHA
        if (!captchaToken) {
          toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please complete the CAPTCHA verification",
          });
          setIsLoading(false);
          return;
        }

        // Call edge function to verify captcha and create user
        const { data, error: signUpError } = await supabase.functions.invoke('verify-signup-captcha', {
          body: {
            email: email.toLowerCase().trim(),
            password,
            fullName: fullName.trim(),
            companyName: companyName.trim(),
            role: selectedRole,
            captchaToken
          }
        });

        if (signUpError) {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: signUpError.message,
          });
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: data.error,
          });
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          setIsLoading(false);
          return;
        }

        toast({
          title: "Account Created!",
          description: data?.message || "You can now log in with your credentials.",
        });

        // Switch to login mode
        setIsSignUp(false);
        setPassword("");
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      } else {
        // Log in
        const { error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-5xl font-bold mb-4">
              {selectedRole ? (isSignUp ? "Create Your Account" : "Welcome Back") : "Welcome to Ship AI"}
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {selectedRole ? `${isSignUp ? "Sign up" : "Log in"} as ${selectedRole === 'shipper' ? 'Shipper' : 'Carrier'}` : "Choose your role to get started"}
            </p>
            <p className="text-sm text-muted-foreground">
              Use any email address to create your account
            </p>
          </motion.div>

{!selectedRole && mode === 'signup' ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-card p-8 hover:shadow-2xl transition-all duration-500 text-center h-full flex flex-col cursor-pointer"
                  onClick={() => setSelectedRole('shipper')}
                >
                  <Package className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">I'm a Shipper</h2>
                  <p className="text-muted-foreground mb-6 flex-1">
                    Post loads, find verified carriers, and cut broker markups
                  </p>
                  <Button variant="hero" size="lg" className="w-full">
                    Continue as Shipper
                  </Button>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-card p-8 hover:shadow-2xl transition-all duration-500 text-center h-full flex flex-col cursor-pointer"
                  onClick={() => setSelectedRole('carrier')}
                >
                  <Truck className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">I'm a Carrier</h2>
                  <p className="text-muted-foreground mb-6 flex-1">
                    Find loads, bid on shipments, and get paid faster
                  </p>
                  <Button variant="hero" size="lg" className="w-full">
                    Continue as Carrier
                  </Button>
                </Card>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <Card className="glass-card p-8">
                <div className="flex items-center justify-center mb-6">
                  {selectedRole === 'shipper' ? (
                    <Package className="w-12 h-12 text-accent" />
                  ) : (
                    <Truck className="w-12 h-12 text-accent" />
                  )}
                </div>

                <div className="space-y-4">
                  {isSignUp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="ACME Logistics"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <HCaptcha
                        sitekey="976ceb3a-35be-49c6-9b3c-d27c0f141b52"
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                        ref={captchaRef}
                        theme="light"
                      />
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleAuth}
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : (isSignUp ? "Create Account" : "Log In")}
                  </Button>

                  <div className="text-center space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm"
                    >
                      {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
                    </Button>
                    <br />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRole(null);
                        setEmail("");
                        setPassword("");
                        setFullName("");
                        setCompanyName("");
                      }}
                      className="text-sm"
                    >
                      ← Change role
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              By signing up, you agree to our{" "}
              <span className="text-accent hover:underline cursor-pointer">Terms of Service</span>
              {" "}and{" "}
              <span className="text-accent hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
