import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Shield, DollarSign, Lock, Link as LinkIcon, CheckCircle2, FileCheck, Award, AlertCircle, ArrowRight, CreditCard, Eye, UserCheck } from "lucide-react";
export default function SiteTrust() {
  return <div className="min-h-screen">
      <NavSite />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Your Security is Our Priority
            </Badge>
            <h1 className="text-5xl font-bold mb-4">Trust & Safety</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade security, verified users, and protected payments — built into every transaction
            </p>
          </motion.div>

          {/* Trust Pillars */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card p-6 h-full hover:border-accent/50 transition-all">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <UserCheck className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">User Verification</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Shippers verified via work-email domains. Carriers provide MC/DOT/Canadian credentials.
                </p>
                <Badge variant="secondary">100% verified users</Badge>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card p-6 h-full hover:border-accent/50 transition-all">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CreditCard className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Escrow Payments</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Funds held securely until POD approval — protecting both shippers and carriers.
                </p>
                <Badge variant="secondary" className="bg-green-500/10 text-green-700">Fully protected</Badge>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card p-6 h-full hover:border-accent/50 transition-all">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Data Security</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  End-to-end encryption for all documents. Auditable event logs for compliance.
                </p>
                <Badge variant="secondary">Bank-grade encryption</Badge>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card p-6 h-full hover:border-accent/50 transition-all">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Eye className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Track every step with carrier links. Complete audit trail on all transactions.
                </p>
                <Badge variant="secondary">100% transparent</Badge>
              </Card>
            </motion.div>
          </div>

          {/* Payment Security Flow */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">How Payment Security Works</h2>
            <Card className="glass-card p-8 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-accent">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Shipper Books Load</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment is securely charged and held in escrow — carrier can see funds are reserved
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-accent" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-accent">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Carrier Delivers & Uploads POD</h4>
                    <p className="text-sm text-muted-foreground">
                      Proof of delivery is uploaded with photos, signatures, or documents
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-accent" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-accent">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Shipper Reviews & Approves POD</h4>
                    <p className="text-sm text-muted-foreground">
                      Shipper verifies delivery completion — typically within 1-2 days
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-accent" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Payment Released to Carrier</h4>
                    <p className="text-sm text-muted-foreground">
                      Funds are instantly released — carrier receives payment within 2-3 days total
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-background/50 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Dispute Protection</p>
                    <p className="text-sm text-muted-foreground">
                      If there's a dispute, funds remain in escrow while both parties provide evidence. Clear audit logs help resolve issues fairly.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Security Certifications */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Security & Compliance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass-card p-6 text-center">
                <Award className="w-12 h-12 text-accent mx-auto mb-3" />
                <h4 className="font-bold mb-2">Payment Security</h4>
                <p className="text-sm text-muted-foreground">PCI DSS compliant payment processing via Stripe</p>
              </Card>
              <Card className="glass-card p-6 text-center">
                <Lock className="w-12 h-12 text-accent mx-auto mb-3" />
                <h4 className="font-bold mb-2">Data Encryption</h4>
                <p className="text-sm text-muted-foreground">AES-256 encryption at rest, TLS 1.3 in transit</p>
              </Card>
              <Card className="glass-card p-6 text-center">
                <FileCheck className="w-12 h-12 text-accent mx-auto mb-3" />
                <h4 className="font-bold mb-2">Audit Trails</h4>
                <p className="text-sm text-muted-foreground">Complete event logging for compliance & disputes</p>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">Frequently Asked Questions</h2>
            <p className="text-center text-muted-foreground mb-8">
              Everything you need to know about security, payments, and verification
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="q1" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q1: How do payments work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Shippers are charged at booking. Funds are held in the platform balance (Stripe Connect) and released to carriers after POD approval. Deposit timing varies by bank and currency (USD/CAD).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q2: Where do you verify carrier credentials?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We collect MC (U.S.) and/or Canadian carrier IDs (e.g., NSC/CVOR) and can display safety basics and a verification badge via connected providers (e.g., CarrierOK/Highway or equivalent). Shippers see only basic info.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q3: Do you have live tracking?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Carriers add their own external tracking link with each bid. Shippers click "Track Shipment" to open that link.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q4: Can shippers use their own TMS?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Connect via API keys, webhooks, or EDI (204/214) from the dashboard's Integrations page.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q5" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q5: What's the pricing?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Shippers $189/seat/month, Carriers $49/seat/month in USD/CAD. Manage seats from Billing.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q6" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q6: Refunds & cancellations?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  If a delivery is canceled or fails under policy, we refund the shipper minus any processing fees. Disputes include clear audit logs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q7" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q7: Who can sign up?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Only businesses. Work-email domains required; personal email providers are blocked. Subdomains allowed.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q8" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q8: Are brokers allowed?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No — Ship AI is brokerless (shippers & asset-based carriers only).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q9" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q9: What data do shippers see about carriers?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Legal/DBA name, HQ address, MC/DOT/Canadian ID, safety rating, and one "other basic info" line — nothing more until booking.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q10" className="glass-card px-6 rounded-lg">
                <AccordionTrigger className="text-left font-semibold">
                  Q10: Which countries are supported?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  U.S. & Canada (states/provinces, ZIP/postal, USD/CAD).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <FooterSite />
    </div>;
}