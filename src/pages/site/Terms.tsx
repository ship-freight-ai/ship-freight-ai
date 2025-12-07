import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SiteTerms() {
  return (
    <div className="min-h-screen">
      <NavSite />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </motion.div>

          <Card className="glass-card p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using Ship AI ("Platform"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, do not use the Platform.
              </p>
              <p className="text-muted-foreground">
                Ship AI is a brokerless freight marketplace connecting shippers with verified, asset-based carriers. 
                We are not a freight broker and do not take possession of, transport, or arrange for the transportation of any goods.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Eligibility & Account Registration</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Business Accounts Only:</strong> Ship AI is available only to businesses. You must register using a work email from a business domain. Personal email providers (e.g., Gmail, Yahoo, Hotmail) are blocked.</p>
                <p><strong>Role Selection:</strong> You must select either "Shipper" or "Carrier" during registration. Brokers are not permitted on the Platform.</p>
                <p><strong>Verification:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Shippers: Must provide company information and valid work email.</li>
                  <li>Carriers: Must provide MC number (U.S.) and/or Canadian carrier IDs (e.g., NSC/CVOR). DOT is optional. We may verify safety ratings through third-party providers.</li>
                </ul>
                <p><strong>Accurate Information:</strong> You are responsible for maintaining accurate, current account information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Roles & Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Shippers</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Post loads with accurate pickup/delivery details, equipment requirements, and rates.</li>
                    <li>Pay the agreed rate at booking (held in escrow via Stripe).</li>
                    <li>Approve or dispute Proof of Delivery (POD) documents.</li>
                    <li>Funds are released to carriers only after POD approval.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Carriers</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Maintain valid insurance, MC/DOT/Canadian IDs, and safety ratings.</li>
                    <li>Submit bids with required external tracking link (no built-in live tracking).</li>
                    <li>Deliver loads as agreed and upload POD documents.</li>
                    <li>You agree NOT to broker any loads obtained through Ship AI.</li>
                    <li>Complete Stripe Connect onboarding to receive payouts.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Pricing & Payment</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Subscription Fees:</strong></p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Shippers: $189/seat/month (USD) or $249 CAD/seat/month</li>
                  <li>Carriers: $49/seat/month (USD) or $65 CAD/seat/month</li>
                </ul>
                <p><strong>Transaction Flow (Escrow):</strong></p>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Shipper is charged the agreed rate at booking.</li>
                  <li>Funds are held in the platform's Stripe balance (escrow).</li>
                  <li>After delivery, carrier uploads POD.</li>
                  <li>Shipper approves POD (or disputes within policy timeframe).</li>
                  <li>Funds are transferred to carrier's connected Stripe account.</li>
                </ol>
                <p><strong>Platform Fee:</strong> Ship AI may deduct a small platform fee (if applicable) from each transaction as specified in environment settings.</p>
                <p><strong>Stripe Fees:</strong> Standard Stripe payment processing fees apply to all transactions.</p>
                <p><strong>Currency:</strong> USD and CAD are supported. All pricing is in the currency selected at signup/checkout.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Cancellations, Refunds & Disputes</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Load Cancellations:</strong> If a load is canceled before pickup (by shipper or carrier), the shipper will be refunded minus any processing fees.</p>
                <p><strong>Failed Deliveries:</strong> If a delivery fails under Platform policy (e.g., carrier no-show, cargo damage), shipper may dispute POD. Disputes are reviewed with audit logs and documentation.</p>
                <p><strong>Subscription Cancellations:</strong> You may cancel your subscription at any time via Stripe Customer Portal. No refunds for partial billing periods.</p>
                <p><strong>Chargebacks:</strong> Unauthorized chargebacks may result in account suspension pending investigation.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Tracking & Documentation</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>No Built-In Tracking:</strong> Ship AI does not provide built-in live GPS tracking. Carriers must attach an external tracking link with each bid. Shippers access tracking via that link.</p>
                <p><strong>Required Documents:</strong> Proof of Delivery (POD), Bill of Lading (BOL), and Certificate of Insurance (COI) may be required.</p>
                <p><strong>Document Storage:</strong> Documents are encrypted and stored securely. Access is restricted via Row Level Security (RLS) policies.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. AI Tools & Automation</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Ship AI offers AI-powered features (e.g., auto-followups, shipment creation from messages, rate suggestions, POD reminders). AI analyzes messages, documents, and metadata — it does NOT provide real-time location tracking.</p>
                <p>You are responsible for verifying AI-generated content before relying on it for critical decisions.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Prohibited Conduct</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Brokers are NOT allowed. Only shippers and asset-based carriers may use Ship AI.</li>
                <li>Carriers may NOT re-broker loads obtained through the Platform.</li>
                <li>No fraudulent, misleading, or inaccurate information (e.g., fake MC numbers, false safety ratings).</li>
                <li>No harassment, abuse, or inappropriate communication with other users.</li>
                <li>No circumventing payment systems or attempting to transact outside the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Data & Privacy</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Your privacy is important. Please review our <a href="/site/privacy" className="text-accent hover:underline">Privacy Policy</a> for details on how we collect, use, and protect your data.</p>
                <p><strong>Data Security:</strong> Documents (POD/BOL/COI) are encrypted at rest and in transit. Audit logs track all critical events.</p>
                <p><strong>Public Carrier Information:</strong> Shippers can view basic carrier info (legal/DBA name, HQ address, MC/DOT/Canadian ID, safety rating, one "other basic info" line). Full contact details are hidden until booking.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Integrations (TMS, API, EDI)</h2>
              <p className="text-muted-foreground">
                Shippers may connect their own Transportation Management Systems (TMS) via API keys, webhooks, or EDI (204/214) from the Integrations page. 
                You are responsible for maintaining secure API credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Geographic Scope</h2>
              <p className="text-muted-foreground">
                Ship AI currently operates in the United States and Canada. State/province, ZIP/postal code, and phone number (E.164 format) are required. 
                We support USD and CAD currencies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Ship AI is a technology platform connecting shippers and carriers. We are NOT responsible for:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Actual transportation, cargo damage, delays, or loss.</li>
                  <li>Carrier performance, insurance coverage, or safety compliance.</li>
                  <li>Disputes between shippers and carriers (though we provide audit logs and documentation tools).</li>
                </ul>
                <p className="font-semibold">TO THE FULLEST EXTENT PERMITTED BY LAW, SHIP AI'S LIABILITY IS LIMITED TO THE FEES PAID BY YOU IN THE 12 MONTHS PRECEDING ANY CLAIM.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Ship AI from any claims, damages, or expenses arising from your use of the Platform, 
                violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Termination</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We may suspend or terminate your account if you:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Violate these Terms</li>
                  <li>Provide false or misleading information</li>
                  <li>Engage in prohibited conduct (e.g., brokering loads as a carrier)</li>
                  <li>Fail to pay subscription fees</li>
                </ul>
                <p>You may cancel your account at any time via the Stripe Customer Portal.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">15. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. Changes will be posted on this page with a new "Last updated" date. 
                Continued use of the Platform after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">16. Governing Law & Disputes</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of [Your Jurisdiction]. Any disputes arising from these Terms or your use of Ship AI 
                will be resolved through binding arbitration in [Your Jurisdiction], except where prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">17. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at: <a href="mailto:go@shipfreight.ai" className="text-accent hover:underline">go@shipfreight.ai</a>
              </p>
            </section>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By using Ship AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
