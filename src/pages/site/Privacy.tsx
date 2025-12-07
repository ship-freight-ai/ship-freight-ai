import { NavSite } from "@/components/site/NavSite";
import { FooterSite } from "@/components/site/FooterSite";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SitePrivacy() {
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
            <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </motion.div>

          <Card className="glass-card p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Ship AI ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, store, and share your personal information when you use our brokerless freight marketplace ("Platform").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Account Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Email address (business domain only)</li>
                    <li>Password (encrypted)</li>
                    <li>Company name, legal/DBA name, website</li>
                    <li>Headquarters address, state/province, ZIP/postal code</li>
                    <li>Phone number (E.164 format)</li>
                    <li>Role (Shipper or Carrier)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Carrier-Specific Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>MC number (U.S.) and/or Canadian carrier IDs (e.g., NSC/CVOR)</li>
                    <li>DOT number (optional)</li>
                    <li>Insurance expiration dates</li>
                    <li>Safety ratings and out-of-service information (via third-party verification providers)</li>
                    <li>Stripe Connect account details for payouts</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Shipper-Specific Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Payment methods (stored securely by Stripe)</li>
                    <li>Billing address and EIN (optional)</li>
                    <li>TMS integration credentials (API keys, webhooks, EDI settings)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Load & Transaction Data</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Load details (pickup/delivery addresses, dates, equipment, weight, rates)</li>
                    <li>Bids and booking information</li>
                    <li>External tracking links provided by carriers</li>
                    <li>Messages exchanged between shippers and carriers</li>
                    <li>Documents uploaded (POD, BOL, COI) — encrypted at rest and in transit</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Usage Data</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>IP address, browser type, device information</li>
                    <li>Pages visited, features used, time spent on Platform</li>
                    <li>AI tool usage (auto-followups, shipment creation, rate suggestions, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Newsletter Subscribers</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Email address (for product updates and freight insights)</li>
                    <li>Source (e.g., website signup form)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Platform Operations:</strong> To facilitate load posting, bidding, booking, tracking (via external links), and payments.</li>
                <li><strong>Verification:</strong> To verify carrier credentials (MC/DOT/Canadian IDs, safety ratings) via third-party providers.</li>
                <li><strong>Payments & Escrow:</strong> To process subscription fees (Stripe) and hold/release transaction funds in escrow.</li>
                <li><strong>AI Automation:</strong> To analyze messages, documents, and metadata for AI features (followups, shipment creation, rate suggestions, POD reminders).</li>
                <li><strong>Communication:</strong> To send transactional emails (booking confirmations, POD approvals, payout notifications), newsletters (if subscribed), and Platform updates.</li>
                <li><strong>Security & Compliance:</strong> To maintain audit logs, detect fraud, enforce Terms of Service, and comply with legal obligations.</li>
                <li><strong>Improvements:</strong> To analyze usage patterns and improve Platform features.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">With Other Users (Limited Disclosure)</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li><strong>Shippers can view carrier:</strong> Legal/DBA name, HQ address, MC/DOT/Canadian ID, safety rating, one "other basic info" line. Full contact details are hidden until booking.</li>
                    <li><strong>Carriers can view load:</strong> Pickup/delivery details, equipment, rates. Shipper contact details are revealed upon booking.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">With Service Providers</h3>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li><strong>Stripe:</strong> For payment processing, subscription management, and escrow/payout transfers.</li>
                    <li><strong>Supabase (Lovable Cloud):</strong> For database, authentication, storage, and edge functions (backend infrastructure).</li>
                    <li><strong>Carrier Verification Providers:</strong> (e.g., CarrierOK/Highway) to verify MC/DOT/Canadian IDs and safety ratings.</li>
                    <li><strong>Email Providers:</strong> For transactional emails and newsletters.</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    Service providers are contractually required to protect your data and use it only for the purposes we specify.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">For Legal Compliance</h3>
                  <p className="text-muted-foreground">
                    We may disclose your information if required by law, regulation, legal process, or government request 
                    (e.g., subpoenas, court orders, law enforcement investigations).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Business Transfers</h3>
                  <p className="text-muted-foreground">
                    If Ship AI is acquired, merged, or undergoes a business transfer, your information may be transferred to the new entity.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">With Your Consent</h3>
                  <p className="text-muted-foreground">
                    We may share your information for other purposes with your explicit consent.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Encryption:</strong> Documents (POD/BOL/COI) are encrypted at rest and in transit using industry-standard protocols (AES-256, TLS).</li>
                <li><strong>Access Controls:</strong> Row Level Security (RLS) policies restrict data access to authorized users only.</li>
                <li><strong>Audit Logs:</strong> All critical actions (bookings, POD approvals, payouts) are logged for accountability.</li>
                <li><strong>Payment Security:</strong> Payment details are handled by Stripe (PCI-DSS compliant). We do NOT store credit card numbers.</li>
                <li><strong>Regular Security Audits:</strong> We conduct periodic security reviews and vulnerability assessments.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                While we implement strong security measures, no system is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Data:</strong> Retained for the duration of your account and up to 7 years after account closure (for legal/tax compliance).</li>
                <li><strong>Transaction Data:</strong> Retained for up to 7 years to comply with financial regulations and dispute resolution.</li>
                <li><strong>Documents (POD/BOL/COI):</strong> Retained for up to 7 years for audit and legal purposes.</li>
                <li><strong>Audit Logs:</strong> Retained indefinitely for security and compliance.</li>
                <li><strong>Newsletter Subscribers:</strong> Email addresses retained until you unsubscribe.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
              
              <div className="space-y-3">
                <p className="text-muted-foreground">Depending on your location, you may have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information via your account settings.</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements).</li>
                  <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails at any time (transactional emails required for Platform operation cannot be opted out).</li>
                  <li><strong>Objection/Restriction:</strong> Object to or restrict certain processing of your data (e.g., AI analysis for non-essential features).</li>
                </ul>
                <p className="text-muted-foreground">
                  To exercise these rights, contact us at <a href="mailto:go@shipfreight.ai" className="text-accent hover:underline">go@shipfreight.ai</a>. 
                  We will respond within 30 days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Cookies & Tracking Technologies</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintain session state (login, preferences)</li>
                  <li>Analyze usage patterns (e.g., most-used features, page views)</li>
                  <li>Improve Platform performance and user experience</li>
                </ul>
                <p>
                  You can manage cookie preferences via your browser settings. Disabling cookies may affect Platform functionality (e.g., login sessions).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Third-Party Links</h2>
              <p className="text-muted-foreground">
                The Platform may contain links to external websites (e.g., carrier tracking links, TMS integrations, investor sites). 
                We are NOT responsible for the privacy practices of these third-party sites. Review their privacy policies before providing personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Ship AI is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. 
                If you believe a child has provided us with personal information, contact us immediately at <a href="mailto:go@shipfreight.ai" className="text-accent hover:underline">go@shipfreight.ai</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Ship AI operates in the U.S. and Canada. If you access the Platform from outside these regions, your information may be transferred to, 
                stored, and processed in the U.S. or Canada. By using Ship AI, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. California Privacy Rights (CCPA)</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Right to know what personal information we collect, use, and share.</li>
                  <li>Right to delete personal information (subject to exceptions).</li>
                  <li>Right to opt-out of "sales" of personal information (we do NOT sell your data).</li>
                  <li>Right to non-discrimination for exercising your CCPA rights.</li>
                </ul>
                <p>
                  To exercise your CCPA rights, contact us at <a href="mailto:go@shipfreight.ai" className="text-accent hover:underline">go@shipfreight.ai</a>.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. GDPR (European Users)</h2>
              <p className="text-muted-foreground">
                If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), 
                including the right to access, rectify, erase, restrict processing, data portability, and object to processing. 
                Our legal basis for processing is contract performance (Terms of Service) and legitimate interests (Platform operations, security).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">14. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with a new "Last updated" date. 
                Material changes will be communicated via email or Platform notification. Continued use of Ship AI after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">15. Contact Us</h2>
              <div className="text-muted-foreground space-y-2">
                <p>For questions, concerns, or requests regarding this Privacy Policy or your personal information, contact us at:</p>
                <p>
                  <strong>Email:</strong> <a href="mailto:go@shipfreight.ai" className="text-accent hover:underline">go@shipfreight.ai</a>
                </p>
                <p>
                  <strong>Mail:</strong> Ship AI Privacy Team, [Your Business Address]
                </p>
              </div>
            </section>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By using Ship AI, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <FooterSite />
    </div>
  );
}
