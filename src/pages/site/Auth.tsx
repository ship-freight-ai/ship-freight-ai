import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";



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
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);


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

        // Call edge function to verify signup (captcha skipped)
        const { data, error: signUpError } = await supabase.functions.invoke('verify-signup-captcha', {
          body: {
            email: email.toLowerCase().trim(),
            password,
            fullName: fullName.trim(),
            companyName: companyName.trim(),
            role: selectedRole,
            captchaToken: "skipped"
          }
        });

        if (signUpError) {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: signUpError.message,
          });
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: data.error,
          });
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

      <section className="pt-32 pb-20 min-h-screen flex flex-col justify-center relative overflow-hidden bg-background">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-40" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-foreground">
              {selectedRole ? (isSignUp ? "Create Account" : "Welcome Back") : "Welcome to Ship AI"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {selectedRole ? `${isSignUp ? "Sign up" : "Log in"} as ${selectedRole === 'shipper' ? 'Shipper' : 'Carrier'}` : "Select your role to continue"}
            </p>
          </motion.div>

          {!selectedRole && mode === 'signup' ? (
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Shipper Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setSelectedRole('shipper')}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full bg-white/40 dark:bg-black/40 border-black/5 dark:border-white/10 p-8 backdrop-blur-md rounded-2xl hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-1 shadow-sm dark:shadow-none">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Package className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-foreground">I'm a Shipper</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Post loads, access enterprise assets, and automate your freight operations with AI.
                  </p>
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-white transition-all hover:bg-primary/10 text-primary">
                    Continue <span className="text-lg">→</span>
                  </Button>
                </Card>
              </motion.div>

              {/* Carrier Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setSelectedRole('carrier')}
                className="group relative cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full bg-white/40 dark:bg-black/40 border-black/5 dark:border-white/10 p-8 backdrop-blur-md rounded-2xl hover:border-secondary/50 transition-all duration-300 group-hover:-translate-y-1 shadow-sm dark:shadow-none">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                    <Truck className="w-7 h-7 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-foreground">I'm a Carrier</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Find high-value loads, bid instantly, and get paid faster with unified tools.
                  </p>
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-secondary group-hover:text-white transition-all hover:bg-secondary/10 text-secondary">
                    Continue <span className="text-lg">→</span>
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
              <Card className="bg-white/40 dark:bg-black/40 border-black/5 dark:border-white/10 p-8 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl">
                <div className="flex items-center justify-center mb-8">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${selectedRole === 'shipper' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                    {selectedRole === 'shipper' ? (
                      <Package className="w-8 h-8 text-primary" />
                    ) : (
                      <Truck className="w-8 h-8 text-secondary" />
                    )}
                  </div>
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

                  <div className="space-y-4">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 h-11 focus:border-primary/50 transition-colors text-foreground"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 h-11 focus:border-primary/50 transition-colors text-foreground pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-4 pt-2">
                      <p className="text-xs text-muted-foreground">
                        Protected by Ship AI Security.
                      </p>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full h-11 mt-2 text-base font-medium shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.7)] transition-all duration-300"
                    onClick={handleAuth}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      isSignUp ? "Create Account" : "Sign In"
                    )}
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
