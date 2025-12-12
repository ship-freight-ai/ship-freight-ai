import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Truck, Eye, EyeOff, CheckCircle, AlertCircle, Building2, Shield, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// reCAPTCHA Enterprise Site Key
const RECAPTCHA_SITE_KEY = "6Lc_sScsAAAAAJ3NGZ0VO54XmInfSYne4W0mX3MH";

// Block common free email providers
const PUBLIC_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "protonmail.com"];

const isBusinessEmail = (email: string) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return !PUBLIC_DOMAINS.includes(domain.toLowerCase());
};

const emailSchema = z.string().email("Invalid email address").refine(isBusinessEmail, {
  message: "Please use a business email address (no Gmail, Yahoo, etc.)"
});

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

  // Carrier Verification State
  const [dotNumber, setDotNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCarrier, setVerifiedCarrier] = useState<any>(null);

  // reCAPTCHA Enterprise State
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Load reCAPTCHA Enterprise script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(() => setCaptchaReady(true), 500);
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src*="recaptcha/enterprise"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Update isSignUp when URL mode parameter changes
  useEffect(() => {
    const newIsSignUp = mode === 'signup';
    setIsSignUp(newIsSignUp);
    // Reset role selection when switching modes
    if (mode === 'login') {
      setSelectedRole('shipper');
    } else {
      setSelectedRole(null);
    }
  }, [mode]);


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

  const handleVerifyCarrier = async () => {
    if (!dotNumber || dotNumber.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid DOT Number",
        description: "Please enter a valid USDOT Number",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-carrier', {
        body: { dotNumber }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerifiedCarrier(data);
      setCompanyName(data.companyName); // Auto-fill company name
      toast({
        title: "Carrier Verified",
        description: `Verified as ${data.companyName}`,
      });
    } catch (error: any) {
      console.error("Verification failed:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Could not verify DOT number. Please try again.",
      });
      setVerifiedCarrier(null);
    } finally {
      setIsVerifying(false);
    }
  };

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

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Execute reCAPTCHA Enterprise
      const action = isSignUp ? "signup" : "login";
      const token = await executeRecaptcha(action);
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token with backend (optional - can also verify in signup function)
      // For now, we'll pass the token to the signup function
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

        if (selectedRole === 'carrier' && !verifiedCarrier) {
          toast({
            variant: "destructive",
            title: "Verification Required",
            description: "Please verify your DOT number before signing up.",
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
            captchaToken: token,
            carrierDetails: verifiedCarrier ? {
              dotNumber: verifiedCarrier.dotNumber,
              mcNumber: verifiedCarrier.mcNumber,
              companyName: verifiedCarrier.companyName,
              safetyRating: verifiedCarrier.safetyRating,
              address: verifiedCarrier.address
            } : undefined
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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address",
      });
      return;
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid business email address",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/site/auth?mode=reset`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
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

          {!selectedRole ? (
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
          ) : showForgotPassword ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <Card className="bg-white/40 dark:bg-black/40 border-black/5 dark:border-white/10 p-8 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                  <p className="text-muted-foreground">
                    {resetEmailSent
                      ? "Check your email for a password reset link"
                      : "Enter your email address and we'll send you a reset link"}
                  </p>
                </div>

                {resetEmailSent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-700 dark:text-green-300">Email Sent!</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Check your inbox for instructions to reset your password.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                    >
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 h-11"
                      />
                    </div>
                    <Button
                      className="w-full h-11"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
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

                  {/* Carrier Verification Step */}
                  {isSignUp && selectedRole === 'carrier' && !verifiedCarrier && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <h3 className="font-medium text-foreground">Verify your Authority</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Enter your DOT number to verify your carrier status and auto-fill your company details.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="USDOT Number"
                          value={dotNumber}
                          onChange={(e) => setDotNumber(e.target.value)}
                        />
                        <Button
                          onClick={handleVerifyCarrier}
                          disabled={isVerifying || !dotNumber}
                        >
                          {isVerifying ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verified Carrier Info */}
                  {isSignUp && verifiedCarrier && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3 animate-in fade-in">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">Verified Carrier</p>
                        <p className="text-sm text-muted-foreground">{verifiedCarrier.companyName}</p>
                        <p className="text-xs text-muted-foreground">DOT: {verifiedCarrier.dotNumber} • MC: {verifiedCarrier.mcNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-auto p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setVerifiedCarrier(null);
                          setCompanyName("");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  {/* Standard Fields */}
                  {(!isSignUp || (selectedRole !== 'carrier' || verifiedCarrier)) && (
                    <>
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
                              readOnly={selectedRole === 'carrier'} // Carrier name is auto-filled
                              className={selectedRole === 'carrier' ? "bg-muted text-muted-foreground" : ""}
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-4">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 h-11 focus:border-primary/50 transition-colors text-foreground"
                        />
                        {isSignUp && email && !isBusinessEmail(email) && (
                          <div className="text-xs text-destructive flex items-center gap-1 animate-in fade-in">
                            <AlertCircle className="w-3 h-3" />
                            Please use a business email address
                          </div>
                        )}
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
                    </>
                  )}

                  {/* reCAPTCHA Enterprise Badge */}
                  <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Protected by reCAPTCHA Enterprise</span>
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
                    disabled={isLoading || (isSignUp && selectedRole === 'carrier' && !verifiedCarrier)}
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
                    {!isSignUp && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary"
                      >
                        Forgot your password?
                      </Button>
                    )}
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
                        setVerifiedCarrier(null);
                        setDotNumber("");
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
              <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
              {" "}and{" "}
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
