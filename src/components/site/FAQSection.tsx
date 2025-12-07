import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQSection = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
      
      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="q1" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            How do payments work?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Shippers are charged at booking. Funds are held in escrow (via Stripe Connect) and released to carriers only after the shipper approves the Proof of Delivery (POD). This protects both parties and ensures fair, transparent transactions. Deposit timing varies by your bank.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q2" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            How are carrier credentials verified?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            We collect MC numbers, DOT numbers, and verify safety ratings through integrated services. Carriers must provide valid credentials and pass our verification checks. Shippers see basic carrier info (legal name, MC/DOT, safety rating, address) before booking — enough to make informed decisions without overwhelming detail.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q3" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            What data is required to sign up?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Shippers need a work email (no personal providers like Gmail), company legal name, address, and contact info. Carriers need the same plus MC/DOT numbers, insurance details, and bank account info for payouts (via Stripe Connect onboarding). We verify all information to maintain platform integrity.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q4" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            Do you have live GPS tracking?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Not built-in. Carriers attach their own external tracking link when submitting a bid. Shippers click "Track Shipment" to view real-time updates via the carrier's system. This approach gives carriers flexibility while providing shippers with the visibility they need.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q5" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            Can shippers integrate their own TMS?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Yes. Connect via API keys, webhooks, or EDI (204/214) from the Integrations page in your dashboard. This allows seamless data flow between Ship AI and your existing transportation management system.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q6" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            What about refunds and cancellations?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            If a delivery is canceled or fails under our policies, we refund the shipper minus any processing fees. All transactions include clear audit logs for dispute resolution. Carriers are paid only after successful delivery and POD approval.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q7" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            Are brokers allowed on the platform?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            No. Ship AI is brokerless by design. Only shippers and asset-based carriers can join. This ensures direct relationships, transparent pricing, and fair rates for everyone.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="q8" className="glass-card px-6 rounded-lg border-none">
          <AccordionTrigger className="text-left font-semibold hover:no-underline">
            Can I use Ship AI if I'm outside the US?
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Ship AI currently serves the US market only (all 50 states). All pricing is in USD, and we focus on US-based carriers and shippers. International support is not available at this time.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};