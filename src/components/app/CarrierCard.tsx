import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Truck, Shield } from "lucide-react";
import { CarrierRatingBadge } from "@/components/app/CarrierRatingBadge";
import type { Database } from "@/integrations/supabase/types";

type Carrier = Database["public"]["Tables"]["carriers"]["Row"];

interface CarrierCardProps {
  carrier: Carrier;
}

export function CarrierCard({ carrier }: CarrierCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">{carrier.company_name}</h3>
            <div className="flex items-center gap-2 mb-2">
              {carrier.verification_status === "verified" && (
                <Badge variant="default" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <CarrierRatingBadge
              rating={carrier.rating}
              totalLoads={carrier.total_loads}
              onTimePercentage={carrier.on_time_percentage}
              variant="compact"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-muted-foreground" />
          <span>{carrier.capacity} trucks</span>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Equipment Types:</p>
          <div className="flex flex-wrap gap-1">
            {carrier.equipment_types.slice(0, 3).map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace("_", " ")}
              </Badge>
            ))}
            {carrier.equipment_types.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{carrier.equipment_types.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {carrier.service_areas && carrier.service_areas.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Service Areas:</p>
            <div className="flex flex-wrap gap-1">
              {carrier.service_areas.slice(0, 5).map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
              {carrier.service_areas.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{carrier.service_areas.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
