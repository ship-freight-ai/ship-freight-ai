/**
 * Email Verification Step
 * 
 * Carriers must verify with a business email address before proceeding.
 * Rejects common personal email providers to ensure professional carriers.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Mail,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Building,
    Shield
} from "lucide-react";
import { useOnboardingStore, isBusinessEmail } from "@/stores/useOnboardingStore";
import { motion } from "framer-motion";

export const EmailVerificationStep = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const { verifyEmail } = useOnboardingStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsValidating(true);

        // Simulate brief validation delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = verifyEmail(email);
        if (!result.valid) {
            setError(result.error || "Invalid email address");
        }
        setIsValidating(false);
    };

    const emailDomain = email.includes('@') ? email.split('@')[1] : null;
    const isBusinessDomain = emailDomain ? isBusinessEmail(email) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Verify Your Work Email</h2>
                        <p className="text-muted-foreground">
                            Use your business email to get started
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Business Email Address</Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                placeholder="dispatch@yourcompany.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError(null);
                                }}
                                className={`pl-10 h-12 text-lg ${error ? 'border-destructive' : ''}`}
                                disabled={isValidating}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        </div>

                        {/* Domain validation feedback */}
                        {emailDomain && (
                            <div className="flex items-center gap-2 mt-2">
                                {isBusinessDomain ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-600">
                                            Business email detected
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm text-amber-600">
                                            Please use a business email (not {emailDomain})
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={!email || !isBusinessDomain || isValidating}
                    >
                        {isValidating ? (
                            "Verifying..."
                        ) : (
                            <>
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </form>

                {/* Why business email */}
                <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Why do we require a business email?
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>Helps verify legitimate motor carriers</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>Reduces fraud and identity theft</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>Ensures professional communication</span>
                        </li>
                    </ul>
                </div>

                {/* Accepted domains examples */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        <strong>Accepted:</strong> yourcompany.com, truckingllc.net, freightco.com
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        <strong>Not accepted:</strong> gmail.com, yahoo.com, hotmail.com
                    </p>
                </div>
            </Card>
        </motion.div>
    );
};
