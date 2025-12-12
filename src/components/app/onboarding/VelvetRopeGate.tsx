/**
 * VelvetRopeGate Component
 * 
 * Displays the 4 validation gates with visual pass/fail indicators.
 * Shows detailed explanations for failed gates.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    CheckCircle2,
    XCircle,
    Shield,
    Truck,
    Calendar,
    AlertTriangle,
    Crown,
    ShieldAlert
} from "lucide-react";
import type { VelvetRopeResult } from "@/lib/api/carrier-ok";
import { motion } from "framer-motion";

interface VelvetRopeGateProps {
    result: VelvetRopeResult;
    carrierName: string;
}

export function VelvetRopeGate({ result, carrierName }: VelvetRopeGateProps) {
    const gates = [
        {
            id: 'age',
            label: 'Authority Age',
            icon: Calendar,
            passed: result.gates.age.passed,
            detail: result.gates.age.passed
                ? `${result.gates.age.value} years (4+ required)`
                : `Only ${result.gates.age.value} years old (need 4+ years)`,
        },
        {
            id: 'size',
            label: 'Fleet Size',
            icon: Truck,
            passed: result.gates.size.passed,
            detail: result.gates.size.passed
                ? `${result.gates.size.value} power units (5+ required)`
                : `Only ${result.gates.size.value} power unit(s) (need 5+)`,
        },
        {
            id: 'safety',
            label: 'Safety Rating',
            icon: Shield,
            passed: result.gates.safety.passed,
            detail: result.gates.safety.passed
                ? `${result.gates.safety.value}`
                : `${result.gates.safety.value} rating not acceptable`,
        },
        {
            id: 'stability',
            label: 'Identity Stability',
            icon: ShieldAlert,
            passed: result.gates.stability.passed,
            detail: result.gates.stability.passed
                ? 'No recent contact changes'
                : 'Contact info changed recently (fraud risk)',
        },
    ];

    const passedCount = gates.filter(g => g.passed).length;

    return (
        <div className="space-y-6">
            {/* Header with overall result */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {result.passed ? (
                    <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <Crown className="w-8 h-8 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                                🎉 Elite Partner Status
                            </CardTitle>
                            <CardDescription className="text-lg">
                                <span className="font-semibold">{carrierName}</span> meets all our quality standards!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center">
                                <Badge variant="default" className="bg-green-600 text-lg px-4 py-1">
                                    All {passedCount} Gates Passed
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Alert variant="destructive" className="border-red-500/50">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="text-lg">Criteria Not Met</AlertTitle>
                        <AlertDescription>
                            We're sorry, but <span className="font-semibold">{carrierName}</span> doesn't currently meet
                            our onboarding requirements. Please review the details below.
                        </AlertDescription>
                    </Alert>
                )}
            </motion.div>

            {/* Individual Gates */}
            <div className="grid gap-4 md:grid-cols-2">
                {gates.map((gate, index) => {
                    const Icon = gate.icon;
                    return (
                        <motion.div
                            key={gate.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className={`transition-all ${gate.passed
                                    ? 'border-green-500/30 hover:border-green-500/50'
                                    : 'border-red-500/30 hover:border-red-500/50'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${gate.passed
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold">{gate.label}</h4>
                                                {gate.passed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                            <p className={`text-sm ${gate.passed
                                                    ? 'text-muted-foreground'
                                                    : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {gate.detail}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Failed Reasons Summary */}
            {!result.passed && result.failedReasons.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">What This Means</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {result.failedReasons.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-red-500 mt-1">•</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 text-sm text-muted-foreground">
                                If you believe this is an error, please contact our support team with your
                                MC number and documentation proving your current status.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
