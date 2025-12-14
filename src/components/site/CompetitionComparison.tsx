import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    Zap,
    Shield,
    DollarSign,
    Clock,
    Bot,
    Users,
    AlertTriangle
} from "lucide-react";

interface ComparisonRow {
    feature: string;
    shipAI: boolean | string;
    dat: boolean | string;
    truckstop: boolean | string;
    traditionalBrokers: boolean | string;
    digitalBrokers: boolean | string;
}

const comparisonData: ComparisonRow[] = [
    {
        feature: "Direct Shipper-Carrier Matching",
        shipAI: true,
        dat: false,
        truckstop: false,
        traditionalBrokers: false,
        digitalBrokers: "Partial",
    },
    {
        feature: "Zero Broker Commissions",
        shipAI: true,
        dat: false,
        truckstop: false,
        traditionalBrokers: false,
        digitalBrokers: false,
    },
    {
        feature: "AI-Powered Automation",
        shipAI: true,
        dat: false,
        truckstop: "Limited",
        traditionalBrokers: false,
        digitalBrokers: "Limited",
    },
    {
        feature: "Built-in Fraud Prevention",
        shipAI: true,
        dat: "Limited",
        truckstop: "Limited",
        traditionalBrokers: false,
        digitalBrokers: "Partial",
    },
    {
        feature: "Fast Carrier Payouts",
        shipAI: "2-3 Days",
        dat: false,
        truckstop: false,
        traditionalBrokers: "30-60 Days",
        digitalBrokers: "7-14 Days",
    },
    {
        feature: "Full Pricing Transparency",
        shipAI: true,
        dat: false,
        truckstop: false,
        traditionalBrokers: false,
        digitalBrokers: "Partial",
    },
    {
        feature: "Real-Time Load Tracking",
        shipAI: true,
        dat: false,
        truckstop: "Add-on",
        traditionalBrokers: "Manual",
        digitalBrokers: true,
    },
    {
        feature: "Automated Documentation",
        shipAI: true,
        dat: false,
        truckstop: false,
        traditionalBrokers: false,
        digitalBrokers: "Partial",
    },
];

const CellValue = ({ value }: { value: boolean | string }) => {
    if (value === true) {
        return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
        return <XCircle className="w-5 h-5 text-red-400 mx-auto" />;
    }
    return (
        <span className="text-xs font-medium text-muted-foreground">{value}</span>
    );
};

export const CompetitionComparison = () => {
    return (
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm rounded-full border-primary/30 bg-primary/5 text-primary">
                        <Zap className="w-3.5 h-3.5 mr-2" />
                        Why Choose Ship AI
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Compare Your Options
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        See how Ship AI stacks up against load boards and brokerages
                    </p>
                </motion.div>

                {/* Key Advantages Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="grid md:grid-cols-4 gap-4 mb-12"
                >
                    <Card className="glass-card p-6 text-center border-green-500/20 bg-green-500/5">
                        <DollarSign className="w-10 h-10 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-1">Save 15-60%</h3>
                        <p className="text-sm text-muted-foreground">
                            No broker markups eating your margins
                        </p>
                    </Card>
                    <Card className="glass-card p-6 text-center border-blue-500/20 bg-blue-500/5">
                        <Bot className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-1">AI Automation</h3>
                        <p className="text-sm text-muted-foreground">
                            Automated matching, tracking, and docs
                        </p>
                    </Card>
                    <Card className="glass-card p-6 text-center border-purple-500/20 bg-purple-500/5">
                        <Shield className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-1">Fraud Prevention</h3>
                        <p className="text-sm text-muted-foreground">
                            Verified carriers, secure escrow payments
                        </p>
                    </Card>
                    <Card className="glass-card p-6 text-center border-orange-500/20 bg-orange-500/5">
                        <Clock className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-1">Fast Payouts</h3>
                        <p className="text-sm text-muted-foreground">
                            2-3 days vs industry 30-60 day standard
                        </p>
                    </Card>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Card className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                                        <th className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge className="bg-primary text-primary-foreground">Ship AI</Badge>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center">
                                            <span className="text-sm font-medium text-muted-foreground">DAT</span>
                                        </th>
                                        <th className="p-4 text-center">
                                            <span className="text-sm font-medium text-muted-foreground">Truckstop</span>
                                        </th>
                                        <th className="p-4 text-center">
                                            <span className="text-sm font-medium text-muted-foreground">Traditional Brokers</span>
                                        </th>
                                        <th className="p-4 text-center">
                                            <span className="text-sm font-medium text-muted-foreground">Digital Brokers</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, index) => (
                                        <tr
                                            key={row.feature}
                                            className={`border-b border-border/30 ${index % 2 === 0 ? "bg-muted/20" : ""
                                                } hover:bg-muted/40 transition-colors`}
                                        >
                                            <td className="p-4 font-medium text-foreground">{row.feature}</td>
                                            <td className="p-4 text-center bg-primary/5">
                                                <CellValue value={row.shipAI} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <CellValue value={row.dat} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <CellValue value={row.truckstop} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <CellValue value={row.traditionalBrokers} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <CellValue value={row.digitalBrokers} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center mt-10"
                >
                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Still paying broker fees? You're leaving money on the table.</span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
