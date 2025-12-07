import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCarrierProfile } from "@/hooks/useCarriers";
import { CarrierProfileForm } from "@/components/app/CarrierProfileForm";
import { useMyRatings } from "@/hooks/useRatings";
import { CarrierRatingBadge } from "@/components/app/CarrierRatingBadge";
import { StripeConnectCard } from "@/components/app/StripeConnectCard";
import { Building2, Shield, Truck, FileText, Calendar, MessageSquare } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function CarrierProfile() {
  const { data: carrier, isLoading } = useCarrierProfile();
  const { data: ratings } = useMyRatings();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
          <Card className="p-6 h-64 bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Carrier Profile</h1>
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Complete Your Carrier Profile</h2>
            <p className="text-muted-foreground mb-6">
              Create your carrier profile to start bidding on loads
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">Create Carrier Profile</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Carrier Profile</DialogTitle>
                </DialogHeader>
                <CarrierProfileForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
    );
  }

  const verificationColors = {
    verified: "default",
    pending: "secondary",
    unverified: "outline",
  } as const;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Carrier Profile</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Carrier Profile</DialogTitle>
              </DialogHeader>
              <CarrierProfileForm initialData={carrier} onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {/* Stripe Connect Section */}
          <StripeConnectCard />

          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{carrier.company_name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={verificationColors[carrier.verification_status]}>
                    {carrier.verification_status === "verified" && <Shield className="w-3 h-3 mr-1" />}
                    {carrier.verification_status.charAt(0).toUpperCase() + carrier.verification_status.slice(1)}
                  </Badge>
                </div>
                <CarrierRatingBadge
                  rating={carrier.rating}
                  totalLoads={carrier.total_loads}
                  onTimePercentage={carrier.on_time_percentage}
                  variant="detailed"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  DOT Number
                </h3>
                <p className="font-medium">{carrier.dot_number}</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  MC Number
                </h3>
                <p className="font-medium">{carrier.mc_number}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Fleet Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Fleet Capacity</h3>
                <p className="font-medium">{carrier.capacity} trucks</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Total Loads Completed</h3>
                <p className="font-medium">{carrier.total_loads}</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">On-Time Delivery</h3>
                <p className="font-medium">{carrier.on_time_percentage}%</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Equipment Types</h3>
                <div className="flex flex-wrap gap-2">
                  {carrier.equipment_types.map((type) => (
                    <Badge key={type} variant="outline">
                      {type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {carrier.service_areas && carrier.service_areas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {carrier.service_areas.map((area) => (
                  <Badge key={area} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Insurance Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {carrier.insurance_amount && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">Coverage Amount</h3>
                  <p className="font-medium">${carrier.insurance_amount.toLocaleString()}</p>
                </div>
              )}
              {carrier.insurance_expiry && (
                <div>
                  <h3 className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expiry Date
                  </h3>
                  <p className="font-medium">{format(new Date(carrier.insurance_expiry), "MMMM dd, yyyy")}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Ratings Section */}
          {ratings && ratings.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Recent Ratings ({ratings.length})
              </h2>
              <div className="space-y-4">
                {ratings.slice(0, 5).map((rating) => (
                  <div key={rating.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <CarrierRatingBadge
                        rating={rating.overall_rating}
                        totalLoads={null}
                        onTimePercentage={null}
                        variant="compact"
                      />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(rating.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      {rating.on_time && (
                        <Badge variant="outline" className="text-green-600">On-time</Badge>
                      )}
                      {rating.communication_rating && (
                        <span className="text-muted-foreground">
                          Communication: {rating.communication_rating.toFixed(1)}
                        </span>
                      )}
                      {rating.professionalism_rating && (
                        <span className="text-muted-foreground">
                          Professionalism: {rating.professionalism_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {rating.comments && (
                      <p className="text-sm text-muted-foreground italic">{rating.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
