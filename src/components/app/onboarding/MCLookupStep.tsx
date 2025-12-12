/**
 * MC Lookup Step Component
 * 
 * First step of carrier onboarding - enter MC number and validate against CarrierOK.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, Building2, AlertCircle } from "lucide-react";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { getCarrierProfile, validateVelvetRope } from "@/lib/api/carrier-ok";
import { VelvetRopeGate } from "./VelvetRopeGate";
import { motion } from "framer-motion";

export function MCLookupStep() {
    const [mcInput, setMcInput] = useState("");
    const {
        mcNumber,
        carrierProfile,
        velvetRopeResult,
        isLookingUp,
        lookupError,
        setMCNumber,
        setLookupState,
        setCarrierData,
        reset
    } = useOnboardingStore();

    const handleLookup = async () => {
        if (!mcInput.trim()) return;

        setMCNumber(mcInput.trim());
        setLookupState(true);

        try {
            const profile = await getCarrierProfile(mcInput.trim());
            const result = validateVelvetRope(profile);
            setCarrierData(profile, result);
        } catch (error) {
            setLookupState(false, error instanceof Error ? error.message : "Lookup failed");
        } finally {
            setLookupState(false);
        }
    };

    const handleReset = () => {
        reset();
        setMcInput("");
    };

    // Show results if we have carrier data
    if (carrierProfile && velvetRopeResult) {
        return (
            <div className="space-y-6">
                <VelvetRopeGate
                    result={velvetRopeResult}
                    carrierName={carrierProfile.legal_name}
                />

                {/* Carrier Info Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Carrier Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Legal Name:</span>
                                <p className="font-medium">{carrierProfile.legal_name}</p>
                            </div>
                            {carrierProfile.dba_name && (
                                <div>
                                    <span className="text-muted-foreground">DBA:</span>
                                    <p className="font-medium">{carrierProfile.dba_name}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">MC Number:</span>
                                <p className="font-medium">MC-{carrierProfile.mc_number}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Authority Status:</span>
                                <p className={`font-medium ${carrierProfile.authority_status === 'ACTIVE'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                    {carrierProfile.authority_status}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Location:</span>
                                <p className="font-medium">
                                    {carrierProfile.address.city}, {carrierProfile.address.state}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Contact Email:</span>
                                <p className="font-medium">{carrierProfile.contact_email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <Button variant="outline" onClick={handleReset}>
                        Start Over with Different MC
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <Card className="max-w-xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Carrier Verification</CardTitle>
                    <CardDescription className="text-base">
                        Enter your MC number to begin the verification process.
                        We'll validate your authority with the FMCSA database.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    MC-
                                </span>
                                <Input
                                    placeholder="Enter MC number"
                                    value={mcInput}
                                    onChange={(e) => setMcInput(e.target.value.replace(/\D/g, ''))}
                                    className="pl-12 text-lg h-12"
                                    maxLength={8}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                />
                            </div>
                            <Button
                                size="lg"
                                onClick={handleLookup}
                                disabled={!mcInput.trim() || isLookingUp}
                                className="h-12 px-6"
                            >
                                {isLookingUp ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="w-5 h-5 mr-2" />
                                        Verify
                                    </>
                                )}
                            </Button>
                        </div>

                        {lookupError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{lookupError}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Test MC Numbers Helper */}
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">
                            <strong>Test MC Numbers:</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                onClick={() => setMcInput('777777')}
                                className="px-3 py-2 rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors text-left"
                            >
                                <span className="font-mono">777777</span> - Elite Partner ✅
                            </button>
                            <button
                                onClick={() => setMcInput('111111')}
                                className="px-3 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-left"
                            >
                                <span className="font-mono">111111</span> - Too Small ❌
                            </button>
                            <button
                                onClick={() => setMcInput('999999')}
                                className="px-3 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-left"
                            >
                                <span className="font-mono">999999</span> - Fraud Risk ❌
                            </button>
                            <button
                                onClick={() => setMcInput('222222')}
                                className="px-3 py-2 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-left"
                            >
                                <span className="font-mono">222222</span> - Too New ❌
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
