/**
 * Carrier Onboarding Page
 * 
 * Multi-step wizard for the "Velvet Rope" carrier verification system.
 * 
 * Steps:
 * 1. MC Lookup - Verify carrier against CarrierOK/FMCSA
 * 2. Identity - Email OTP or Insurance Agent verification
 * 3. Financials - Stripe Connect or Manual document upload
 * 4. Review - Confirm and submit
 */

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Search,
    UserCheck,
    CreditCard,
    CheckCircle,
    ArrowLeft,
    Shield,
    Crown
} from "lucide-react";
import { useOnboardingStore, useOnboardingProgress } from "@/stores/useOnboardingStore";
import { MCLookupStep } from "@/components/app/onboarding/MCLookupStep";
import { IdentityVerificationStep } from "@/components/app/onboarding/IdentityVerificationStep";
import { BankConnectionStep } from "@/components/app/onboarding/BankConnectionStep";
import { ReviewStep } from "@/components/app/onboarding/ReviewStep";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const steps = [
    { id: 'mc_lookup', label: 'MC Verification', icon: Search },
    { id: 'identity', label: 'Identity', icon: UserCheck },
    { id: 'financials', label: 'Bank Setup', icon: CreditCard },
    { id: 'review', label: 'Review', icon: CheckCircle },
];

export default function CarrierOnboarding() {
    const navigate = useNavigate();
    const { currentStep, velvetRopeResult, setStep, reset } = useOnboardingStore();
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
                        <Crown className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                        🎉 Welcome to Ship AI!
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        You're now a verified Elite Partner carrier.
                    </p>
                    <Button size="lg" onClick={() => navigate('/app/carrier')}>
                        Go to Dashboard
                    </Button>
                </motion.div>
            </div>
        );
    }

    // Rejected state
    if (currentStep === 'rejected') {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <Button variant="ghost" onClick={() => navigate('/app/carrier')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>

                    <MCLookupStep />

                    <div className="mt-8 text-center">
                        <Button variant="outline" onClick={reset}>
                            Try Different MC Number
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="max-w-4xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Carrier Verification</h1>
                                <p className="text-sm text-muted-foreground">
                                    Complete verification to become an Elite Partner
                                </p>
                            </div>
                        </div>
                        {velvetRopeResult?.passed && (
                            <Badge className="bg-green-600">
                                <Crown className="w-3 h-3 mr-1" />
                                Elite Partner
                            </Badge>
                        )}
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = step.id === currentStep;
                            const isCompleted = index < currentStepIndex;
                            const isAccessible = index <= currentStepIndex;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <button
                                        onClick={() => isAccessible && index < currentStepIndex && setStep(step.id as any)}
                                        disabled={!isAccessible || index >= currentStepIndex}
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors w-full ${isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : isCompleted
                                                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isActive
                                                ? 'bg-primary-foreground/20'
                                                : isCompleted
                                                    ? 'bg-green-500/20'
                                                    : 'bg-muted-foreground/10'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Icon className="w-4 h-4" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium hidden md:block">
                                            {step.label}
                                        </span>
                                    </button>
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
            <div className="max-w-4xl mx-auto px-8 py-8">
                {currentStep === 'mc_lookup' && <MCLookupStep />}
                {currentStep === 'identity' && <IdentityVerificationStep />}
                {currentStep === 'financials' && <BankConnectionStep />}
                {currentStep === 'review' && <ReviewStep />}
            </div>
        </div>
    );
}
