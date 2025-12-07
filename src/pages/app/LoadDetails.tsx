import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLoadDetails, useDeleteLoad, useUpdateLoad } from "@/hooks/useLoads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadStatusBadge } from "@/components/app/LoadStatusBadge";
import { LoadStatusManager } from "@/components/app/LoadStatusManager";
import { LoadForm } from "@/components/app/LoadForm";
import { BidForm } from "@/components/app/BidForm";
import { BidsList } from "@/components/app/BidsList";
import PaymentEscrow from "@/components/app/PaymentEscrow";
import { BackButton } from "@/components/app/BackButton";
import { LoadDeleteDialog } from "@/components/app/LoadDeleteDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RatingDialog } from "@/components/app/RatingDialog";
import { useLoadRating } from "@/hooks/useRatings";
import { useGenerateLoadPDF, useDocuments } from "@/hooks/useDocuments";
import { generateLoadConfirmationPDF, generateBOLPDF, generateInvoicePDF } from "@/utils/pdfGenerator";
import { MapPin, Calendar, Package, DollarSign, FileText, Gavel, Edit, Send, Star, Download } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

function LoadDetailsContent() {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const { data: load, isLoading } = useLoadDetails(loadId || "");
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const { mutate: deleteLoad, isPending: isDeleting } = useDeleteLoad();
  const { mutate: updateLoad, isPending: isPosting } = useUpdateLoad(loadId || "");
  const { data: existingRating } = useLoadRating(loadId);
  const { mutate: generatePDF, isPending: isPDFGenerating } = useGenerateLoadPDF();
  const { data: loadDocuments } = useDocuments(loadId);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  const isShipper = profile?.role === "shipper";
  const isCarrier = profile?.role === "carrier";
  const canBid = isCarrier && load && ["posted", "bidding"].includes(load.status);
  const canRateCarrier = isShipper && load?.status === "completed" && load?.carrier_id && !existingRating;

  const handleDelete = () => {
    if (!loadId) return;
    deleteLoad(loadId, {
      onSuccess: () => {
        navigate("/app/loads");
      }
    });
  };

  const handlePostLoad = () => {
    updateLoad({ status: "posted" });
  };

  const handleDownloadPDF = async (type: 'confirmation' | 'bol' | 'invoice') => {
    if (!load) return;

    try {
      // Fetch required data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: shipperProfile } = await supabase
        .from("profiles")
        .select("full_name, company_name, email")
        .eq("user_id", load.shipper_id)
        .single();

      const { data: carrierProfile } = await supabase
        .from("carriers")
        .select("company_name, dot_number, mc_number")
        .eq("user_id", load.carrier_id || "")
        .single();

      const { data: bid } = await supabase
        .from("bids")
        .select("*")
        .eq("load_id", load.id)
        .eq("status", "accepted")
        .single();

      if (!shipperProfile || !carrierProfile || !bid) {
        throw new Error("Missing required data for PDF generation");
      }

      let pdfBlob: Blob;
      let fileName: string;
      let documentType: 'rate_confirmation' | 'bol' | 'other';

      if (type === 'confirmation') {
        pdfBlob = generateLoadConfirmationPDF(load, bid, shipperProfile, carrierProfile);
        fileName = `load-confirmation-${load.load_number}.pdf`;
        documentType = 'rate_confirmation';
      } else if (type === 'bol') {
        pdfBlob = generateBOLPDF(load, shipperProfile, carrierProfile);
        fileName = `bol-${load.load_number}.pdf`;
        documentType = 'bol';
      } else {
        pdfBlob = generateInvoicePDF(load, bid, shipperProfile, carrierProfile);
        fileName = `invoice-${load.load_number}.pdf`;
        documentType = 'other';
      }

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="space-y-6">
        <BackButton to="/app/loads" label="Back to Loads" />
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Load not found</h2>
          <p className="text-muted-foreground mb-6">
            The load you're looking for doesn't exist or you don't have access to it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/app/loads" label="Back to Loads" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Load Details</h1>
          <p className="text-muted-foreground">
            Load #{load.load_number || load.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LoadStatusBadge status={load.status} />
          {isShipper && load.status === "draft" && (
            <>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Load
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Load</DialogTitle>
                  </DialogHeader>
                  <LoadForm 
                    onSuccess={() => setEditDialogOpen(false)} 
                    initialData={load}
                    loadId={load.id}
                    isEditing={true}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={handlePostLoad} disabled={isPosting}>
                <Send className="w-4 h-4 mr-2" />
                {isPosting ? "Posting..." : "Post Load"}
              </Button>
            </>
          )}
          {load.status !== "draft" && load.status !== "posted" && load.carrier_id && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleDownloadPDF('confirmation')}
                disabled={isPDFGenerating}
              >
                <Download className="w-4 h-4 mr-2" />
                Confirmation
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDownloadPDF('bol')}
                disabled={isPDFGenerating}
              >
                <FileText className="w-4 h-4 mr-2" />
                BOL
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDownloadPDF('invoice')}
                disabled={isPDFGenerating}
              >
                <FileText className="w-4 h-4 mr-2" />
                Invoice
              </Button>
            </>
          )}
          {canRateCarrier && (
            <Button onClick={() => setRatingDialogOpen(true)} variant="default">
              <Star className="w-4 h-4 mr-2" />
              Rate Carrier
            </Button>
          )}
          {existingRating && isShipper && load?.status === "completed" && (
            <Button onClick={() => setRatingDialogOpen(true)} variant="outline">
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              View Rating
            </Button>
          )}
          {isShipper && <LoadStatusManager loadId={load.id} currentStatus={load.status} />}
          {isShipper && (
            <LoadDeleteDialog onConfirm={handleDelete} isDeleting={isDeleting} />
          )}
        </div>
      </div>

      <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Route Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">ORIGIN</h3>
                {load.origin_facility_name && (
                  <p className="font-semibold text-primary mb-1">{load.origin_facility_name}</p>
                )}
                <p className="font-medium">{load.origin_address}</p>
                <p>{load.origin_city}, {load.origin_state} {load.origin_zip}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">DESTINATION</h3>
                {load.destination_facility_name && (
                  <p className="font-semibold text-primary mb-1">{load.destination_facility_name}</p>
                )}
                <p className="font-medium">{load.destination_address}</p>
                <p>{load.destination_city}, {load.destination_state} {load.destination_zip}</p>
              </div>
            </div>
            {load.distance_miles && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Distance: <span className="font-semibold text-foreground">{load.distance_miles} miles</span>
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">PICKUP DATE</h3>
                <p className="font-medium">{format(new Date(load.pickup_date), "EEEE, MMMM dd, yyyy")}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">DELIVERY DATE</h3>
                <p className="font-medium">{format(new Date(load.delivery_date), "EEEE, MMMM dd, yyyy")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Load Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Equipment Type</h3>
                <p className="font-medium capitalize">{load.equipment_type.replace("_", " ")}</p>
              </div>
              {load.weight && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Weight</h3>
                  <p className="font-medium">{load.weight.toLocaleString()} lbs</p>
                </div>
              )}
              {load.length && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Length</h3>
                  <p className="font-medium">{load.length} ft</p>
                </div>
              )}
              {load.width && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Width</h3>
                  <p className="font-medium">{load.width} ft</p>
                </div>
              )}
              {load.height && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Height</h3>
                  <p className="font-medium">{load.height} ft</p>
                </div>
              )}
              {load.commodity && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Commodity</h3>
                  <p className="font-medium">{load.commodity}</p>
                </div>
              )}
              {load.temperature_min !== null && load.temperature_max !== null && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">Temperature Range</h3>
                  <p className="font-medium">{load.temperature_min}°F to {load.temperature_max}°F</p>
                </div>
              )}
            </div>
          </Card>

          {load.special_requirements && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Special Requirements
              </h2>
              <p className="text-muted-foreground">{load.special_requirements}</p>
            </Card>
          )}

          {load.posted_rate && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Rate Information
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${load.posted_rate.toLocaleString()}</span>
                {load.distance_miles && (
                  <span className="text-muted-foreground">
                    (${(load.posted_rate / load.distance_miles).toFixed(2)}/mile)
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* Bidding Section */}
          {(canBid || (isShipper && ["bidding", "booked"].includes(load.status))) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                Bidding
              </h2>

              <Tabs defaultValue={canBid ? "submit" : "bids"}>
                <TabsList className="grid w-full grid-cols-2">
                  {canBid && <TabsTrigger value="submit">Submit Bid</TabsTrigger>}
                  <TabsTrigger value="bids">
                    {isShipper ? "Manage Bids" : "View Bids"}
                  </TabsTrigger>
                </TabsList>

                {canBid && (
                  <TabsContent value="submit" className="mt-6">
                    <div className="max-w-md">
                      <BidForm
                        loadId={load.id}
                        postedRate={load.posted_rate || undefined}
                        onSuccess={() => setBidDialogOpen(false)}
                      />
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="bids" className="mt-6">
                  <BidsList loadId={load.id} isShipper={isShipper} />
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {/* Payment Section */}
          {load.status !== "draft" && load.status !== "posted" && (
            <PaymentEscrow
              loadId={load.id}
              loadStatus={load.status}
              isShipper={isShipper}
              isCarrier={isCarrier}
            />
          )}
        </div>

        {/* Rating Dialog */}
        {load && load.carrier_id && (
          <RatingDialog
            open={ratingDialogOpen}
            onOpenChange={setRatingDialogOpen}
            loadId={load.id}
            carrierId={load.carrier_id}
            carrierName="Carrier"
          />
        )}
    </div>
  );
}

export default function LoadDetails() {
  return (
    <ErrorBoundary>
      <LoadDetailsContent />
    </ErrorBoundary>
  );
}
