/**
 * Carrier Onboarding Page (Enhanced 4-Step Flow)
 * 
 * Step 1: Email Verification (business email)
 * Step 2: MC/DOT Lookup → Validation
 * Step 3: Document Upload (COI, W-9)
 * Step 4: Stripe Connect → Done
 */

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Search,
    FileText,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Shield,
    Truck
} from "lucide-react";
import { useOnboardingStore, useOnboardingProgress } from "@/stores/useOnboardingStore";
import { EmailVerificationStep } from "@/components/app/onboarding/EmailVerificationStep";
import { CarrierLookupStep } from "@/components/app/onboarding/MCLookupStep";
import { DocumentUploadStep } from "@/components/app/onboarding/DocumentUploadStep";
import { StripeConnectStep } from "@/components/app/onboarding/StripeConnectStep";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const steps = [
    { id: 'email_verification', label: 'Email', icon: Mail },
    { id: 'lookup', label: 'Verify Carrier', icon: Search },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'bank_connection', label: 'Bank Setup', icon: CreditCard },
];

export default function CarrierOnboarding() {
    const navigate = useNavigate();
    const { currentStep, validationResult, reset } = useOnboardingStore();
    const progress = useOnboardingProgress();

    // Completed state
    if (currentStep === 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <Truck className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                        🎉 Welcome to Ship AI!
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        You're now a verified carrier. Start bidding on loads!
                    </p>
                    <Button size="lg" onClick={() => navigate('/app/dashboard/carrier')}>
                        Go to Dashboard
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Rejected state - just show the lookup step which displays rejection
    if (currentStep === 'rejected') {
        return (
            <div className="min-h-screen bg-background">
                <div className="border-b bg-card">
                    <div className="max-w-3xl mx-auto px-8 py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/app/dashboard/carrier')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Carrier Verification</h1>
                                <p className="text-sm text-muted-foreground">
                                    Verification requirements not met
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-8 py-8">
                    <CarrierLookupStep />
                </div>
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="max-w-3xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Carrier Verification</h1>
                                <p className="text-sm text-muted-foreground">
                                    4-step verification to start hauling
                                </p>
                            </div>
                        </div>
                        {validationResult?.passed && (
                            <Badge className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Carrier Verified
                            </Badge>
                        )}
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = step.id === currentStep;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors flex-1 ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : isCompleted
                                            ? 'bg-green-500/10 text-green-600'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isActive
                                            ? 'bg-primary-foreground/20'
                                            : isCompleted
                                                ? 'bg-green-500/20'
                                                : 'bg-muted-foreground/10'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            ) : (
                                                <Icon className="w-3.5 h-3.5" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium hidden sm:inline">
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`h-0.5 w-4 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-muted'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Bar */}
                    <Progress value={progress.percentage} className="mt-4 h-2" />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-8 py-8">
                {currentStep === 'email_verification' && <EmailVerificationStep />}
                {currentStep === 'lookup' && <CarrierLookupStep />}
                {currentStep === 'documents' && <DocumentUploadStep />}
                {currentStep === 'bank_connection' && <StripeConnectStep />}
            </div>
        </div>
    );
}
