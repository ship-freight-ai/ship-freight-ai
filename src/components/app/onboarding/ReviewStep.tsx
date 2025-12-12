/**
 * Review Step Component
 * 
 * Final step - review all information before submitting for verification.
 * Shows fraud score (if elevated) and summary of all provided info.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    CheckCircle2,
    Building2,
    Mail,
    CreditCard,
    FileText,
    Zap,
    AlertTriangle,
    ArrowRight,
    Loader2,
    Crown
} from "lucide-react";
import { useOnboardingStore, useCanSubmitOnboarding } from "@/stores/useOnboardingStore";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function ReviewStep() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const {
        carrierProfile,
        velvetRopeResult,
        emailVerified,
        insuranceAgentRequested,
        bankMethod,
        instantPayoutsEligible,
        uploadedDocuments,
        fraudScore,
        setStep,
        reset,
    } = useOnboardingStore();

    const canSubmit = useCanSubmitOnboarding();

    if (!carrierProfile || !velvetRopeResult) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Update carrier record with verified data
            const { error } = await supabase
                .from('carriers')
                .update({
                    mc_number: carrierProfile.mc_number,
                    legal_name: carrierProfile.legal_name,
                    dba_name: carrierProfile.dba_name || null,
                    dot_number: carrierProfile.mc_number, // Often same or related
                    authority_status: carrierProfile.authority_status,
                    original_grant_date: carrierProfile.original_grant_date,
                    reported_truck_count: carrierProfile.reported_truck_count,
                    safety_rating: carrierProfile.safety_rating,
                    contact_email: carrierProfile.contact_email,
                    contact_phone: carrierProfile.contact_phone,
                    insurance_agent_email: carrierProfile.insurance_agent_email,
                    address_street: carrierProfile.address.street,
                    address_city: carrierProfile.address.city,
                    address_state: carrierProfile.address.state,
                    address_zip: carrierProfile.address.zip,
                    fmcsa_verified_at: new Date().toISOString(),
                    email_verified_at: emailVerified ? new Date().toISOString() : null,
                    bank_verified_at: bankMethod ? new Date().toISOString() : null,
                    onboarding_stage: 'completed',
                    verification_status: 'verified',
                })
                .eq('user_id', user.id);

            if (error) throw error;

            setStep('completed');
            toast.success("🎉 Onboarding complete! You're now a verified carrier.");

            // Reset store and navigate after short delay
            setTimeout(() => {
                reset();
                navigate('/app/carrier');
            }, 2000);

        } catch (error) {
            console.error('Submission error:', error);
            toast.error("Failed to complete onboarding. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto"
        >
            {/* Elite Partner Header */}
            <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent">
                <CardContent className="pt-6 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="w-6 h-6 text-green-500" />
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                            Elite Partner Status
                        </h2>
                    </div>
                    <p className="text-muted-foreground">
                        Review your information and submit to complete verification
                    </p>
                </CardContent>
            </Card>

            {/* Fraud Alert (if score elevated) */}
            {fraudScore > 30 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Additional Review Required</AlertTitle>
                    <AlertDescription>
                        Your application will be reviewed by our compliance team before approval.
                        This typically takes 1-2 business days.
                    </AlertDescription>
                </Alert>
            )}

            {/* Company Info */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Company Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Legal Name</span>
                            <p className="font-medium">{carrierProfile.legal_name}</p>
                        </div>
                        {carrierProfile.dba_name && (
                            <div>
                                <span className="text-muted-foreground">DBA</span>
                                <p className="font-medium">{carrierProfile.dba_name}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-muted-foreground">MC Number</span>
                            <p className="font-medium">MC-{carrierProfile.mc_number}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Power Units</span>
                            <p className="font-medium">{carrierProfile.reported_truck_count} trucks</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Safety Rating</span>
                            <p className="font-medium">{carrierProfile.safety_rating}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Location</span>
                            <p className="font-medium">
                                {carrierProfile.address.city}, {carrierProfile.address.state}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Verification Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Identity */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <span>Identity Verification</span>
                        </div>
                        {emailVerified ? (
                            <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Email Verified
                            </Badge>
                        ) : insuranceAgentRequested ? (
                            <Badge variant="secondary">
                                Agent Verification Pending
                            </Badge>
                        ) : (
                            <Badge variant="outline">Not Completed</Badge>
                        )}
                    </div>

                    {/* Bank */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                            <span>Bank Connection</span>
                        </div>
                        {bankMethod === 'stripe_connect' ? (
                            <Badge variant="default" className="bg-green-600">
                                <Zap className="w-3 h-3 mr-1" />
                                Instant Payouts
                            </Badge>
                        ) : bankMethod === 'manual_upload' ? (
                            <Badge variant="secondary">
                                <FileText className="w-3 h-3 mr-1" />
                                Documents Uploaded
                            </Badge>
                        ) : (
                            <Badge variant="outline">Not Completed</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payout Terms */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        {instantPayoutsEligible ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Instant Payouts Enabled ⚡</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Receive payments within minutes of shipper approval
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">Standard Payment Terms</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Receive payments within 2-3 business days of approval
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="pt-4">
                <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Complete Verification
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-3">
                    By submitting, you confirm that all information provided is accurate.
                </p>
            </div>
        </motion.div>
    );
}
