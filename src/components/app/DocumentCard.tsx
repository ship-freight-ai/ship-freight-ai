import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText, Download, Check, X, History, Eye, Unlock } from "lucide-react";
import { format } from "date-fns";
import {
  Document,
  useApproveDocument,
  useRejectDocument,
  useDeleteDocument,
  useDocumentVersions,
} from "@/hooks/useDocuments";
import { useReleasePayment, useLoadPayment } from "@/hooks/usePayments";
import { toast } from "sonner";

interface DocumentCardProps {
  document: Document;
  showActions?: boolean;
  isAdmin?: boolean;
  isShipper?: boolean;
  loadId?: string;
}

export default function DocumentCard({ 
  document, 
  showActions = true, 
  isAdmin = false,
  isShipper = false,
  loadId 
}: DocumentCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useApproveDocument();
  const rejectMutation = useRejectDocument();
  const deleteMutation = useDeleteDocument();
  const { data: versions } = useDocumentVersions(document.id);
  const releaseMutation = useReleasePayment();
  const { data: payment } = useLoadPayment(loadId || "");

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pod: "Proof of Delivery",
      bol: "Bill of Lading",
      insurance: "Certificate of Insurance",
      rate_confirmation: "Rate Confirmation",
      mc_authority: "MC Authority",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getStatusBadge = () => {
    if (document.approved === true) {
      return <Badge variant="default" className="bg-green-500">Approved</Badge>;
    }
    if (document.approved === false) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  const handleApprove = async () => {
    await approveMutation.mutateAsync(document.id);
    
    // If this is a BOL/POD document and payment is in escrow, auto-release payment
    if (
      (document.document_type === "bol" || document.document_type === "pod") &&
      loadId &&
      payment?.status === "held_in_escrow"
    ) {
      try {
        await releaseMutation.mutateAsync(loadId);
        toast.success("BOL approved and payment released to carrier");
      } catch (error) {
        toast.error("BOL approved but payment release failed");
      }
    }
    
    setShowApproveDialog(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectMutation.mutateAsync({
      documentId: document.id,
      reason: rejectReason,
    });
    setShowRejectDialog(false);
    setRejectReason("");
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(document.id);
    setShowDeleteDialog(false);
  };

  const handleDownload = () => {
    window.open(document.file_url, "_blank");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{document.file_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getDocumentTypeLabel(document.document_type)}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Uploaded:</span>
              <p>{format(new Date(document.created_at), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <p>{document.file_size ? (document.file_size / 1024).toFixed(2) + " KB" : "N/A"}</p>
            </div>
            {document.version > 1 && (
              <div>
                <span className="text-muted-foreground">Version:</span>
                <p>{document.version}</p>
              </div>
            )}
          </div>

          {document.rejected_reason && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-md">
              <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
              <p className="text-sm">{document.rejected_reason}</p>
            </div>
          )}

          {document.approved_at && (
            <p className="text-xs text-muted-foreground">
              Approved on {format(new Date(document.approved_at), "MMM dd, yyyy")}
            </p>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            {document.file_type === 'application/pdf' && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Eye className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
            )}

            {versions && versions.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)}>
                <History className="w-4 h-4 mr-2" />
                Versions ({versions.length})
              </Button>
            )}

            {isAdmin && document.approved === null && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={approveMutation.isPending}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {isShipper && document.approved === null && (document.document_type === "bol" || document.document_type === "pod") && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                disabled={approveMutation.isPending || releaseMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
              >
                {payment?.status === "held_in_escrow" ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Approve BOL & Release Payment
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Approve BOL
                  </>
                )}
              </Button>
            )}

            {!isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Versions List */}
      {showVersions && versions && versions.length > 0 && (
        <Card className="ml-8 mt-2">
          <CardHeader>
            <CardTitle className="text-sm">Version History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between text-sm p-2 border rounded">
                <div>
                  <p className="font-medium">Version {version.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.open(version.file_url, "_blank")}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Document</AlertDialogTitle>
            <AlertDialogDescription>
              {payment?.status === "held_in_escrow" && (document.document_type === "bol" || document.document_type === "pod") ? (
                <>
                  Approving this BOL will automatically release <span className="font-semibold">${payment.amount.toLocaleString()}</span> from escrow to the carrier. 
                  This action cannot be undone.
                </>
              ) : (
                "Are you sure you want to approve this document?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-500 hover:bg-green-600"
            >
              {payment?.status === "held_in_escrow" && (document.document_type === "bol" || document.document_type === "pod") 
                ? "Approve & Release Payment" 
                : "Approve Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Document</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason.trim()}>
              Reject Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}