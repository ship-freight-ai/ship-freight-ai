/**
 * Stripe Connect Step
 * 
 * Final step - connect bank account via Stripe for payouts
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Loader2,
    CheckCircle2,
    Zap,
    ArrowRight,
    ExternalLink,
    Shield
} from "lucide-react";
import { useOnboardingStore, useCanComplete } from "@/stores/useOnboardingStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function StripeConnectStep() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const navigate = useNavigate();

    const {
        carrierProfile,
        bankConnected,
        instantPayoutsEligible,
        setBankConnected,
        completeOnboarding,
        reset,
    } = useOnboardingStore();

    const canComplete = useCanComplete();

    if (!carrierProfile) return null;

    const handleConnectStripe = async () => {
        setIsConnecting(true);

        try {
            // In production, this would redirect to Stripe Connect onboarding
            // For now, we simulate a successful connection
            await new Promise(r => setTimeout(r, 2000));

            setBankConnected(true, true); // instant payouts eligible
            toast.success("Bank account connected successfully!");
        } catch (error) {
            toast.error("Failed to connect bank. Please try again.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Update carrier record with verified data
            const { error } = await supabase
                .from('carriers')
                .update({
                    dot_number: carrierProfile.dot_number,
                    mc_number: carrierProfile.mc_number,
                    company_name: carrierProfile.legal_name,
                    legal_name: carrierProfile.legal_name,
                    dba_name: carrierProfile.dba_name,
                    authority_status: carrierProfile.authority_status,
                    original_grant_date: carrierProfile.authority_granted_date,
                    safety_rating: carrierProfile.safety_rating,
                    reported_truck_count: carrierProfile.safer_trucks,
                    insurance_amount: carrierProfile.insurance_coverage_amount,
                    insurance_expiry: carrierProfile.insurance_expiration_date,
                    contact_email: carrierProfile.contact_email,
                    contact_phone: carrierProfile.contact_phone,
                    address_street: carrierProfile.address.street,
                    address_city: carrierProfile.address.city,
                    address_state: carrierProfile.address.state,
                    address_zip: carrierProfile.address.zip,
                    fmcsa_verified_at: new Date().toISOString(),
                    bank_verified_at: new Date().toISOString(),
                    onboarding_stage: 'completed',
                    verification_status: 'verified',
                })
                .eq('user_id', user.id);

            if (error) throw error;

            completeOnboarding();
            toast.success("🎉 Onboarding complete! You're now a verified carrier.");

            setTimeout(() => {
                reset();
                navigate('/app/dashboard/carrier');
            }, 2000);

        } catch (error) {
            console.error('Completion error:', error);
            toast.error("Failed to complete onboarding. Please try again.");
        } finally {
            setIsCompleting(false);
        }
    };

    // Bank connected - show completion option
    if (bankConnected) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                <Card className="max-w-xl mx-auto border-green-500/50">
                    <CardContent className="pt-8 pb-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                            Bank Connected!
                        </h3>

                        {instantPayoutsEligible && (
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Instant Payouts Enabled
                                </Badge>
                            </div>
                        )}

                        <p className="text-muted-foreground mb-6">
                            You'll receive payments within minutes of shipper approval!
                        </p>

                        {/* Summary */}
                        <Card className="mb-6 text-left">
                            <CardContent className="pt-4">
                                <h4 className="font-semibold mb-3">Verification Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Carrier</span>
                                        <span className="font-medium">{carrierProfile.legal_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">DOT</span>
                                        <span className="font-medium">{carrierProfile.dot_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Authority</span>
                                        <Badge variant="outline" className="text-green-600">{carrierProfile.authority_status}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Insurance</span>
                                        <span className="font-medium">${(carrierProfile.insurance_coverage_amount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            size="lg"
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="w-full"
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    Complete Verification
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Stripe Connect prompt
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Connect Your Bank</h2>
                <p className="text-muted-foreground">
                    Set up your payout method to receive payments
                </p>
            </div>

            <Card className="max-w-xl mx-auto border-2 border-primary/50 hover:border-primary transition-colors">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Connect with Stripe</CardTitle>
                    <CardDescription>
                        Securely link your bank account for instant payouts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Zap className="w-5 h-5 text-green-500" />
                            <span><strong>Instant Payouts</strong> - Get paid in minutes</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="w-5 h-5 text-green-500" />
                            <span>Bank-level security</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span>No setup fees</span>
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleConnectStripe}
                        disabled={isConnecting}
                        className="w-full"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                Connect Bank Account
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        You'll be redirected to Stripe's secure platform
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
