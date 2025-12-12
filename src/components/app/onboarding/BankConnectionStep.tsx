/**
 * Bank Connection Step Component
 * 
 * Two options:
 * 1. Preferred: Connect via Stripe (Instant Payouts eligible)
 * 2. Fallback: Manual document upload (Standard terms)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    CreditCard,
    Upload,
    Loader2,
    CheckCircle2,
    Zap,
    FileText,
    ArrowRight,
    Clock,
    Sparkles
} from "lucide-react";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

export function BankConnectionStep() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [showManualUpload, setShowManualUpload] = useState(false);

    const {
        carrierProfile,
        bankMethod,
        bankConnected,
        instantPayoutsEligible,
        uploadedDocuments,
        setBankMethod,
        setBankConnected,
        setDocumentUploaded,
        setStep,
    } = useOnboardingStore();

    if (!carrierProfile) return null;

    const handleStripeConnect = async () => {
        setIsConnecting(true);
        setBankMethod('stripe_connect');

        // Simulate Stripe Connect flow
        await new Promise(r => setTimeout(r, 2000));

        setBankConnected(true, true); // true for instant payouts eligible
        setIsConnecting(false);
    };

    const handleManualUpload = () => {
        setBankMethod('manual_upload');
        setShowManualUpload(true);
    };

    const allDocsUploaded = uploadedDocuments.w9 && uploadedDocuments.voidedCheck;

    // Success state
    if (bankConnected) {
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
                            {bankMethod === 'stripe_connect' ? 'Bank Connected!' : 'Documents Uploaded!'}
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
                            {bankMethod === 'stripe_connect'
                                ? "You'll receive payments within minutes of release!"
                                : "Your documents are under review. Standard 2-3 day payout terms apply."}
                        </p>

                        <Button onClick={() => setStep('review')}>
                            Continue to Review
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Manual upload flow
    if (showManualUpload) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-xl mx-auto"
            >
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Standard Payment Terms</AlertTitle>
                    <AlertDescription>
                        Manual verification takes 1-2 business days. Payouts will be processed every 2-3 days.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Required Documents</CardTitle>
                        <CardDescription>
                            Upload W9 and voided check to complete verification
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DocumentUploader
                            label="W9 Tax Form"
                            uploaded={uploadedDocuments.w9}
                            onUpload={() => setDocumentUploaded('w9', true)}
                        />
                        <DocumentUploader
                            label="Voided Check"
                            uploaded={uploadedDocuments.voidedCheck}
                            onUpload={() => setDocumentUploaded('voidedCheck', true)}
                        />

                        <div className="pt-4">
                            <Button
                                onClick={() => setBankConnected(true, false)}
                                disabled={!allDocsUploaded}
                                className="w-full"
                            >
                                {allDocsUploaded ? (
                                    <>
                                        Submit Documents
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    'Upload both documents to continue'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <button
                        onClick={() => setShowManualUpload(false)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        ← Back to payment options
                    </button>
                </div>
            </motion.div>
        );
    }

    // Options selection
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Connect Your Bank</h2>
                <p className="text-muted-foreground">
                    Choose how you want to receive payments
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Option A: Stripe Connect (Preferred) */}
                <Card className="relative overflow-hidden border-2 border-primary/50 hover:border-primary transition-colors cursor-pointer group"
                    onClick={handleStripeConnect}
                >
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                        Recommended
                    </div>
                    <CardHeader className="pt-8">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="flex items-center gap-2">
                            Connect with Stripe
                            <Sparkles className="w-4 h-4 text-primary" />
                        </CardTitle>
                        <CardDescription>
                            Securely link your bank account in seconds
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm mb-6">
                            <li className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-green-500" />
                                <span><strong>Instant Payouts</strong> - Get paid in minutes</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Bank-level security</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>No document uploads needed</span>
                            </li>
                        </ul>
                        <Button className="w-full" disabled={isConnecting}>
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    Connect Bank
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Option B: Manual Upload */}
                <Card className="hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onClick={handleManualUpload}
                >
                    <CardHeader className="pt-8">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Manual Verification</CardTitle>
                        <CardDescription>
                            Upload documents for traditional verification
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm mb-6 text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Standard 2-3 day payouts</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span>Requires W9 and voided check</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>1-2 day review period</span>
                            </li>
                        </ul>
                        <Button variant="outline" className="w-full">
                            Upload Documents
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}

// Document uploader component
function DocumentUploader({
    label,
    uploaded,
    onUpload
}: {
    label: string;
    uploaded: boolean;
    onUpload: () => void;
}) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: () => onUpload(),
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg'],
        },
        maxFiles: 1,
    });

    if (uploaded) {
        return (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">{label}</span>
                <Badge variant="secondary" className="ml-auto">Uploaded</Badge>
            </div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
        >
            <input {...getInputProps()} />
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop file here' : 'Click or drag to upload'}
            </p>
        </div>
    );
}
