import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payment } from "@/hooks/usePayments";
import { DollarSign, Truck, Package, AlertCircle, CheckCircle, Clock, HelpCircle, ChevronDown, ChevronUp, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

export default function FreightPayments() {
  const { data: roleData } = useUserRole();
  const [activeTab, setActiveTab] = useState("all");
  const [showPaymentHelp, setShowPaymentHelp] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["freight-payments"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          loads!inner(
            id,
            load_number,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            commodity,
            equipment_type,
            status
          )
        `)
        .or(`shipper_id.eq.${user.id},carrier_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "held_in_escrow":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "disputed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "released":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      held_in_escrow: "secondary",
      released: "default",
      completed: "default",
      failed: "destructive",
      disputed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  const filterPayments = (payments: any[], status?: string) => {
    if (!status || status === "all") return payments;
    return payments.filter((p) => p.status === status);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Freight Payments</h1>
            <p className="text-muted-foreground">Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalEarnings = payments
    ?.filter((p) => p.status === "completed" && p.carrier_id)
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const totalPaid = payments
    ?.filter((p) => p.status === "completed" && p.shipper_id)
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const escrowAmount = payments
    ?.filter((p) => p.status === "held_in_escrow")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Freight Payments</h1>
          <p className="text-muted-foreground">Track payment status for all loads</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {roleData?.role === "carrier" ? "Total Earnings" : "Total Paid"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((roleData?.role === "carrier" ? totalEarnings : totalPaid) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(escrowAmount / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting release</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">With payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Carrier Payment Help Section */}
      {roleData?.role === "carrier" && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowPaymentHelp(!showPaymentHelp)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">How Carrier Payments Work</CardTitle>
              </div>
              {showPaymentHelp ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              Learn about our secure escrow payment system and how you get paid
            </CardDescription>
          </CardHeader>

          {showPaymentHelp && (
            <CardContent className="space-y-6">
              {/* Payment Flow */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Payment Flow
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">1</div>
                    <div>
                      <p className="font-medium">Bid Accepted</p>
                      <p className="text-sm text-muted-foreground">When a shipper accepts your bid, payment is secured in escrow immediately.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-600">2</div>
                    <div>
                      <p className="font-medium">Complete Delivery</p>
                      <p className="text-sm text-muted-foreground">Deliver the load and upload your Proof of Delivery (POD) and Bill of Lading.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-600">3</div>
                    <div>
                      <p className="font-medium">Payment Released</p>
                      <p className="text-sm text-muted-foreground">Once the shipper approves delivery, funds are released to your Stripe Connect account.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stripe Connect Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Getting Paid via Stripe Connect
                </h3>
                <div className="p-4 rounded-lg border bg-background/50 space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Instant Payouts Available!</p>
                      <p className="text-sm text-green-600 dark:text-green-500">Link a debit card in Stripe to receive payouts within <span className="font-semibold">minutes</span>, not days.</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Standard Payout:</span> Bank accounts receive funds in <span className="text-primary font-semibold">2-3 business days</span>.
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Instant Payout:</span> Debit cards receive funds in <span className="text-primary font-semibold">minutes</span>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No minimum payout - you get paid for every completed load. Platform fee: 3%.
                  </p>
                </div>
              </div>

              {/* Escrow Protection */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Escrow Protection
                </h3>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Funds are secured before you start driving</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>If there's a dispute, funds are held until resolution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>No more chasing shippers for unpaid invoices</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Payment List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({payments?.length || 0})</TabsTrigger>
          <TabsTrigger value="held_in_escrow">
            Escrow ({filterPayments(payments || [], "held_in_escrow").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterPayments(payments || [], "completed").length})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({filterPayments(payments || [], "disputed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {filterPayments(payments || [], activeTab).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No payments found</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "all"
                    ? "No payment records available"
                    : `No ${activeTab.replace(/_/g, " ")} payments`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filterPayments(payments || [], activeTab).map((payment: any) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Load #{payment.loads.load_number || payment.load_id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {payment.loads.origin_city}, {payment.loads.origin_state} →{" "}
                        {payment.loads.destination_city}, {payment.loads.destination_state}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">
                        ${(payment.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Equipment</p>
                      <p className="font-medium capitalize">
                        {payment.loads.equipment_type?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commodity</p>
                      <p className="font-medium">{payment.loads.commodity || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(payment.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {payment.stripe_payment_intent_id && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Stripe Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Payment Intent: </span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {payment.stripe_payment_intent_id.slice(0, 20)}...
                          </code>
                        </div>
                        {payment.stripe_transfer_id && (
                          <div>
                            <span className="text-muted-foreground">Transfer ID: </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.stripe_transfer_id.slice(0, 20)}...
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {payment.status === "held_in_escrow" && payment.escrow_held_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Held since {format(new Date(payment.escrow_held_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}

                  {payment.status === "released" && payment.released_at && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Released on {format(new Date(payment.released_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  )}

                  {payment.status === "disputed" && payment.dispute_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-destructive">Dispute Reason</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {payment.dispute_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
