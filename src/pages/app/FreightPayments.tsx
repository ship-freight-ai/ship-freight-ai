import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payment } from "@/hooks/usePayments";
import { DollarSign, Truck, Package, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

export default function FreightPayments() {
  const { data: roleData } = useUserRole();
  const [activeTab, setActiveTab] = useState("all");

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
