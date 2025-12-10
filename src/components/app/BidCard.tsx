import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Clock, Check, X, ExternalLink, Truck, Download, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { useAcceptBid, useRejectBid } from "@/hooks/useBids";
import { useStorePDFDocument } from "@/hooks/useDocuments";
import { generateLoadConfirmationPDF } from "@/utils/pdfGenerator";
import { LoadPaymentModal } from "@/components/app/LoadPaymentModal";
import { useCreatePaymentIntent } from "@/hooks/usePayments";
import { CarrierRatingBadge } from "@/components/app/CarrierRatingBadge";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type BidStatus = Database["public"]["Enums"]["bid_status"];

interface BidCardProps {
  bid: any;
  isShipper?: boolean;
  loadId: string;
  load?: any;
}

const statusConfig: Record<BidStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  countered: { label: "Countered", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
};

export function BidCard({ bid, isShipper, loadId, load }: BidCardProps) {
  const acceptBid = useAcceptBid();
  const rejectBid = useRejectBid();
  const storePDF = useStorePDFDocument();
  const [isDownloading, setIsDownloading] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | undefined>(undefined);
  const [paymentIntentId, setPaymentIntentId] = useState<string | undefined>(undefined);
  const createPaymentIntent = useCreatePaymentIntent(); // Using hook from usePayments

  const config = statusConfig[bid.status];
  const isExpired = bid.expires_at && new Date(bid.expires_at) < new Date();

  const handleInitiateAccept = async () => {
    // 1. Create Payment Intent first
    try {
      if (bid.bid_amount && load) { // Added load check for load.id
        const result = await createPaymentIntent.mutateAsync({ // Kept mutateAsync as it was originally
          loadId: load.id, // Changed from loadId to load.id
          amount: bid.bid_amount,
          carrierId: bid.carrier_id,
          bidId: bid.id, // Added this
        });

        setPaymentClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
        setIsPaymentModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to initiate payment:", error);
    }
  };

  const onPaymentSuccess = async () => {
    setIsPaymentModalOpen(false);
    toast.success("Payment secured and Bid Accepted!");

    // Generate PDF (keep existing logic)
    if (load) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const { data: carrier } = await supabase
          .from("carriers")
          .select("*")
          .eq("user_id", bid.carrier_id)
          .single();

        if (profile && carrier) {
          const pdfBlob = generateLoadConfirmationPDF(load, bid, profile, carrier);
          const fileName = `load-confirmation-${load.load_number}-${Date.now()}.pdf`;

          await storePDF.mutateAsync({
            pdfBlob,
            fileName,
            loadId: load.id,
          });

          toast.success("Load confirmation PDF generated");
        }
      } catch (error) {
        console.error("Failed to generate PDF:", error);
      }
    }
  };

  const handleReject = () => {
    rejectBid.mutate({
      bidId: bid.id,
      loadId: loadId,
    });
  };

  const handleDownloadPDF = async () => {
    if (!load) return;

    setIsDownloading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: carrier } = await supabase
        .from("carriers")
        .select("*")
        .eq("user_id", bid.carrier_id)
        .single();

      if (profile && carrier) {
        const pdfBlob = generateLoadConfirmationPDF(load, bid, profile, carrier);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `load-confirmation-${load.load_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {bid.carriers?.company_name || bid.carrier?.company_name || "Carrier"}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={config.variant}>{config.label}</Badge>
                {isExpired && bid.status === "pending" && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {(bid.carriers?.verification_status === "verified" || bid.carrier?.verification_status === "verified") && (
                  <Badge variant="outline" className="text-xs">Verified</Badge>
                )}
              </div>
              <CarrierRatingBadge
                rating={bid.carriers?.rating || bid.carrier?.rating}
                totalLoads={bid.carriers?.total_loads || bid.carrier?.total_loads}
                onTimePercentage={bid.carriers?.on_time_percentage || bid.carrier?.on_time_percentage}
                variant="compact"
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${bid.bid_amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Submitted {format(new Date(bid.created_at), "MMM dd, yyyy 'at' h:mm a")}</span>
          </div>
          {bid.tracking_url && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-primary" />
              <a
                href={bid.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Track Truck
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {bid.notes && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm">{bid.notes}</p>
          </div>
        )}

        {isShipper && bid.status === "pending" && !isExpired && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="default" className="flex-1" onClick={handleInitiateAccept} disabled={createPaymentIntent.isPending}>
                <Check className="w-4 h-4 mr-2" />
                {createPaymentIntent.isPending ? "Initializing..." : "Accept Bid"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject this bid?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reject the bid from {bid.carriers?.company_name || bid.carrier?.company_name}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject}>
                      Reject Bid
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => window.location.href = `/app/messages?loadId=${loadId}&userId=${bid.carrier_id}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Carrier
            </Button>
          </div>
        )}

        {bid.status === "accepted" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Generating PDF..." : "Download Confirmation"}
          </Button>
        )}
      </Card>

      <LoadPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientSecret={paymentClientSecret}
        paymentIntentId={paymentIntentId}
        loadId={loadId}
        bidId={bid.id}
        amount={bid.bid_amount}
        onSuccess={onPaymentSuccess}
      />
    </>
  );
}
