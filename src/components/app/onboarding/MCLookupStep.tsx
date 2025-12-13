/**
 * Carrier Lookup Step
 * 
 * Accepts MC or DOT number, validates against CarrierOK API
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Loader2,
    Building2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Shield,
    CreditCard,
    Truck,
    ArrowRight
} from "lucide-react";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { lookupCarrier, validateCarrier, normalizeIdentifier } from "@/lib/api/carrier-ok";
import { motion } from "framer-motion";

export function CarrierLookupStep() {
    const [input, setInput] = useState("");

    const {
        carrierProfile,
        validationResult,
        isLoading,
        error,
        setIdentifier,
        setLoading,
        setError,
        setCarrierData,
        setStep,
        reset
    } = useOnboardingStore();

    const handleLookup = async () => {
        if (!input.trim()) return;

        const { type, value } = normalizeIdentifier(input);
        setIdentifier(value, type);
        setLoading(true);

        try {
            const profile = await lookupCarrier(input);
            const validation = validateCarrier(profile);
            setCarrierData(profile, validation);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lookup failed");
        }
    };

    // Show results if we have carrier data
    if (carrierProfile && validationResult) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Validation Result */}
                {validationResult.passed ? (
                    <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                                ✅ Verification Passed
                            </h3>
                            <p className="text-muted-foreground">
                                {carrierProfile.legal_name} meets all requirements
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Alert variant="destructive">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Verification Failed</AlertTitle>
                        <AlertDescription>
                            {carrierProfile.legal_name} doesn't meet our requirements. See details below.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Validation Gates */}
                <div className="grid gap-3">
                    {validationResult.gates.map((gate, index) => (
                        <motion.div
                            key={gate.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className={`transition-all ${gate.passed
                                    ? 'border-green-500/30'
                                    : 'border-red-500/30 bg-red-500/5'
                                }`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {gate.passed ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                            <p className="font-medium">{gate.label}</p>
                                            <p className={`text-sm ${gate.passed ? 'text-muted-foreground' : 'text-red-600'}`}>
                                                {gate.message}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Carrier Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Carrier Details
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
                                <span className="text-muted-foreground">DOT Number</span>
                                <p className="font-medium">DOT-{carrierProfile.dot_number}</p>
                            </div>
                            {carrierProfile.mc_number && (
                                <div>
                                    <span className="text-muted-foreground">MC Number</span>
                                    <p className="font-medium">MC-{carrierProfile.mc_number}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">Location</span>
                                <p className="font-medium">
                                    {carrierProfile.address.city}, {carrierProfile.address.state}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Fleet Size</span>
                                <p className="font-medium">
                                    {carrierProfile.safer_trucks || 'N/A'} trucks, {carrierProfile.safer_drivers || 'N/A'} drivers
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => { reset(); setInput(''); }}>
                        Try Different Number
                    </Button>
                    {validationResult.passed && (
                        <Button onClick={() => setStep('bank_connection')}>
                            Continue to Bank Setup
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </motion.div>
        );
    }

    // Initial input form
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <Card className="max-w-xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Verify Your Carrier</CardTitle>
                    <CardDescription className="text-base">
                        Enter your MC or DOT number to verify your authority
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Input
                                placeholder="MC-123456 or DOT-1234567"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="text-lg h-12"
                                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                            />
                            <Button
                                size="lg"
                                onClick={handleLookup}
                                disabled={!input.trim() || isLoading}
                                className="h-12 px-6"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-5 h-5 mr-2" />
                                        Verify
                                    </>
                                )}
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Requirements Info */}
                    <div className="pt-4 border-t space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>Active operating authority</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-green-500" />
                                <span>Minimum $750k insurance coverage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-green-500" />
                                <span>No unsatisfactory safety rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Test Numbers */}
                    <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3">Test Numbers:</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setInput('777777')}
                                className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            >
                                777777 ✅
                            </button>
                            <button
                                onClick={() => setInput('111111')}
                                className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            >
                                111111 ✅
                            </button>
                            <button
                                onClick={() => setInput('999999')}
                                className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            >
                                999999 ❌
                            </button>
                            <button
                                onClick={() => setInput('888888')}
                                className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            >
                                888888 ❌
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
