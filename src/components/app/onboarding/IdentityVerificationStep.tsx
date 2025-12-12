/**
 * Identity Verification Step Component
 * 
 * Two paths:
 * 1. Primary: Email OTP verification
 * 2. Fallback: Insurance Agent verification request
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Mail,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    AlertCircle,
    HelpCircle
} from "lucide-react";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { sendVerificationOTP, verifyOTP, sendInsuranceAgentRequest } from "@/lib/api/carrier-ok";
import { motion } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function IdentityVerificationStep() {
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isSendingAgentRequest, setIsSendingAgentRequest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAgentPath, setShowAgentPath] = useState(false);

    const {
        carrierProfile,
        emailOtpSent,
        emailVerified,
        insuranceAgentRequested,
        setIdentityMethod,
        setEmailOtpSent,
        setEmailVerified,
        setInsuranceAgentRequested,
        setStep,
    } = useOnboardingStore();

    if (!carrierProfile) return null;

    const handleSendOTP = async () => {
        setIsSendingOTP(true);
        setError(null);

        try {
            await sendVerificationOTP(carrierProfile.contact_email);
            setIdentityMethod('email_otp');
            setEmailOtpSent(true);
        } catch (err) {
            setError("Failed to send verification code. Please try again.");
        } finally {
            setIsSendingOTP(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) return;

        setIsVerifying(true);
        setError(null);

        try {
            const valid = await verifyOTP(carrierProfile.contact_email, otpCode);
            if (valid) {
                setEmailVerified(true);
            } else {
                setError("Invalid code. Please check and try again.");
            }
        } catch (err) {
            setError("Verification failed. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleInsuranceAgentRequest = async () => {
        setIsSendingAgentRequest(true);
        setError(null);

        try {
            await sendInsuranceAgentRequest(
                carrierProfile.insurance_agent_email,
                carrierProfile.legal_name
            );
            setIdentityMethod('insurance_agent');
            setInsuranceAgentRequested(true);
        } catch (err) {
            setError("Failed to send request. Please try again.");
        } finally {
            setIsSendingAgentRequest(false);
        }
    };

    // Email verified - show success
    if (emailVerified) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <Card className="max-w-xl mx-auto border-green-500/50">
                    <CardContent className="pt-8 pb-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                            Email Verified!
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Your identity has been confirmed via {carrierProfile.contact_email}
                        </p>
                        <Button onClick={() => setStep('financials')}>
                            Continue to Bank Connection
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Insurance agent request sent
    if (insuranceAgentRequested) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <Card className="max-w-xl mx-auto border-blue-500/50">
                    <CardContent className="pt-8 pb-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            Verification Request Sent
                        </h3>
                        <p className="text-muted-foreground mb-2">
                            We've contacted your insurance agent at:
                        </p>
                        <Badge variant="secondary" className="mb-6 text-base">
                            {carrierProfile.insurance_agent_email}
                        </Badge>
                        <p className="text-sm text-muted-foreground mb-6">
                            Please ask them to reply with your Certificate of Insurance (COI).
                            You can continue with the onboarding while we wait.
                        </p>
                        <Button onClick={() => setStep('financials')}>
                            Continue to Bank Connection
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-xl mx-auto"
        >
            {/* Primary Path: Email OTP */}
            <Card className={showAgentPath ? 'opacity-50' : ''}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Verify Your Email
                    </CardTitle>
                    <CardDescription>
                        We'll send a 6-digit code to your registered email address
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Sending code to:</p>
                        <p className="font-medium">{carrierProfile.contact_email}</p>
                    </div>

                    {!emailOtpSent ? (
                        <Button
                            onClick={handleSendOTP}
                            disabled={isSendingOTP || showAgentPath}
                            className="w-full"
                        >
                            {isSendingOTP ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4 mr-2" />
                            )}
                            Send Verification Code
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={setOtpCode}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                Test code: <code className="bg-muted px-2 py-1 rounded">123456</code>
                            </p>
                            <Button
                                onClick={handleVerifyOTP}
                                disabled={otpCode.length !== 6 || isVerifying}
                                className="w-full"
                            >
                                {isVerifying ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Verify Code
                            </Button>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Fallback Path Toggle */}
            <div className="text-center">
                <button
                    onClick={() => setShowAgentPath(!showAgentPath)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 mx-auto"
                >
                    <HelpCircle className="w-4 h-4" />
                    {showAgentPath ? "Use email verification instead" : "I can't access that email address"}
                </button>
            </div>

            {/* Fallback Path: Insurance Agent */}
            {showAgentPath && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    <Card className="border-amber-500/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <ShieldCheck className="w-5 h-5" />
                                Alternative: Insurance Agent Verification
                            </CardTitle>
                            <CardDescription>
                                We'll contact your insurance agent to verify your identity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>How it works</AlertTitle>
                                <AlertDescription>
                                    We'll send an email to your insurance agent asking them to confirm
                                    your identity by replying with your Certificate of Insurance.
                                </AlertDescription>
                            </Alert>

                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Agent email:</p>
                                <p className="font-medium">{carrierProfile.insurance_agent_email}</p>
                            </div>

                            <Button
                                onClick={handleInsuranceAgentRequest}
                                disabled={isSendingAgentRequest}
                                variant="outline"
                                className="w-full border-amber-500/50 hover:bg-amber-500/10"
                            >
                                {isSendingAgentRequest ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                )}
                                Request Agent Verification
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
