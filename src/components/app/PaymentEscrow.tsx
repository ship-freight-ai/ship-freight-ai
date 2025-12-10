import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Lock, Unlock, AlertTriangle, CheckCircle, FileText, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  useLoadPayment,
  useReleasePayment,
  useDisputePayment,
  useResolveDispute,
} from "@/hooks/usePayments";
import { useCreateCarrierPayout } from "@/hooks/useStripeConnect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentEscrowProps {
  loadId: string;
  loadStatus: string;
  isShipper: boolean;
  isCarrier: boolean;
}

export default function PaymentEscrow({
  loadId,
  loadStatus,
  isShipper,
  isCarrier,
}: PaymentEscrowProps) {
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  // New state for payout adjustment
  const [finalPayoutAmount, setFinalPayoutAmount] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState("");

  const { data: payment, isLoading } = useLoadPayment(loadId);
  const releaseMutation = useReleasePayment();
  const disputeMutation = useDisputePayment();
  const resolveMutation = useResolveDispute();
  const createPayout = useCreateCarrierPayout();

  const { data: userRole } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return data?.role || null;
    },
  });

  // Check if BOL/POD is approved
  const { data: bolDocument } = useQuery({
    queryKey: ["bol-document", loadId],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("load_id", loadId)
        .in("document_type", ["bol", "pod"])
        .eq("approved", true)
        .maybeSingle();

      return data;
    },
    enabled: !!loadId && payment?.status === "held_in_escrow",
  });

  const isAdmin = userRole === "admin";

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading payment information...</p>;
  }

  if (!payment) {
    return null;
  }

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending", variant: "secondary", icon: DollarSign },
      held_in_escrow: { label: "Held in Escrow", variant: "default", icon: Lock },
      released: { label: "Released", variant: "default", icon: Unlock },
      completed: { label: "Completed", variant: "default", icon: CheckCircle },
      disputed: { label: "Disputed", variant: "destructive", icon: AlertTriangle },
      failed: { label: "Failed", variant: "destructive", icon: AlertTriangle },
    };

    const config = statusConfig[payment.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleReleaseClick = () => {
    if (payment) {
      setFinalPayoutAmount(payment.amount);
    }
    setShowReleaseDialog(true);
  };

  const handleRelease = async () => {
    // Try Stripe Connect payout first, fallback to regular release
    try {
      // Note: Passing extra params to releaseMutation which needs updating
      await releaseMutation.mutateAsync({
        loadId,
        finalAmount: finalPayoutAmount,
        notes: releaseNotes
      });
    } catch (error) {
      // Error handled in hook
    }
    setShowReleaseDialog(false);
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    await disputeMutation.mutateAsync({ loadId, reason: disputeReason });
    setShowDisputeDialog(false);
    setDisputeReason("");
  };

  const handleResolve = async (releaseToCarrier: boolean) => {
    await resolveMutation.mutateAsync({ loadId, releaseToCarrier });
    setShowResolveDialog(false);
  };

  const canRelease = isShipper && payment.status === "held_in_escrow" && loadStatus === "delivered" && (!!bolDocument || isAdmin);
  const canDispute = (isShipper || isCarrier) && ["held_in_escrow", "released"].includes(payment.status);
  const canResolve = isAdmin && payment.status === "disputed";

  const autoReleaseDate = payment.escrow_held_at ? addDays(new Date(payment.escrow_held_at), 7) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Payment Escrow
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">${payment.amount.toLocaleString()}</p>
            </div>
            {payment.escrow_held_at && (
              <div>
                <p className="text-sm text-muted-foreground">Held Since</p>
                <p className="font-medium">
                  {format(new Date(payment.escrow_held_at), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {payment.released_at && (
              <div>
                <p className="text-sm text-muted-foreground">Released On</p>
                <p className="font-medium">
                  {format(new Date(payment.released_at), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          {payment.dispute_reason && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">Dispute Reason:</p>
              <p className="text-sm">{payment.dispute_reason}</p>
            </div>
          )}

          {payment.status === "held_in_escrow" && (
            <div className="space-y-3">
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Funds Secured in Escrow</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bolDocument
                        ? "BOL approved. Payment can be released to carrier."
                        : "Payment will be released when BOL is approved."}
                    </p>
                  </div>
                </div>
              </div>

              {!bolDocument && autoReleaseDate && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-300">Auto-Release Scheduled</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                        Payment will automatically release on {format(autoReleaseDate, "MMM dd, yyyy")} (7 days after delivery) unless disputed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!bolDocument && isShipper && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">BOL Approval Required</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        To release payment, please approve the Bill of Lading (BOL) document uploaded by the carrier.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {canRelease && (
              <Button
                onClick={handleReleaseClick}
                disabled={releaseMutation.isPending || (!bolDocument && !isAdmin)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Release Payment
              </Button>
            )}

            {!bolDocument && isShipper && payment.status === "held_in_escrow" && !isAdmin && (
              <p className="text-sm text-muted-foreground italic">
                BOL approval required to release payment
              </p>
            )}

            {canDispute && (
              <Button
                variant="destructive"
                onClick={() => setShowDisputeDialog(true)}
                disabled={disputeMutation.isPending}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Dispute Payment
              </Button>
            )}

            {canResolve && (
              <Button
                onClick={() => setShowResolveDialog(true)}
                variant="default"
              >
                Resolve Dispute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Release Payment Dialog */}
      <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Payment to Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              This will release funds from escrow to the carrier.
              Please confirm the load has been verified and Delivered.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Final Payout Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={finalPayoutAmount}
                  onChange={(e) => setFinalPayoutAmount(Number(e.target.value))}
                  max={payment.amount}
                />
              </div>
              <p className="text-xs text-muted-foreground">Original escrow amount: ${payment.amount.toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes / Adjustments</label>
              <Textarea
                placeholder="Reason for adjustment (e.g. lumper fees deduction, damaged goods)"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </div>

            {finalPayoutAmount < payment.amount && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                <p className="font-semibold">Partial Release Warning</p>
                <p>You are releasing less than the escrowed amount. The remaining ${(payment.amount - finalPayoutAmount).toFixed(2)} will be returned to your balance/card (depending on Stripe config).</p>
              </div>
            )}
            {finalPayoutAmount > payment.amount && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                <p className="font-semibold">Error</p>
                <p>You cannot release more than the escrowed amount ($ {payment.amount}) in this step. Please create a separate miscellaneous payment for additional charges.</p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRelease}
              className="bg-green-500 hover:bg-green-600"
              disabled={finalPayoutAmount <= 0 || finalPayoutAmount > payment.amount}
            >
              Confirm Release ${finalPayoutAmount.toLocaleString()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispute Payment Dialog */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dispute Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a detailed reason for disputing this payment. An admin will review your case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter dispute reason..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDispute} disabled={!disputeReason.trim()}>
              Submit Dispute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve Dispute Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Payment Dispute</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how to resolve this dispute. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {payment.dispute_reason && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Dispute Reason:</p>
              <p className="text-sm">{payment.dispute_reason}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleResolve(false)}
              disabled={resolveMutation.isPending}
            >
              Refund Shipper
            </Button>
            <Button
              onClick={() => handleResolve(true)}
              disabled={resolveMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              Release to Carrier
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
