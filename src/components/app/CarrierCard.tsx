import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Truck, Shield, MapPin, Star } from "lucide-react";
import type { CarrierProfile } from "@/data/mockCarriers";

interface CarrierCardProps {
  carrier: CarrierProfile;
}

export function CarrierCard({ carrier }: CarrierCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">{carrier.company_name}</h3>
            <div className="flex items-center gap-2 mb-2">
              {carrier.verified && (
                <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                DOT {carrier.dot_number}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold">{carrier.rating}</span>
              <span className="text-muted-foreground">({carrier.reviews_count} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span>{carrier.fleet_size} Trucks</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{carrier.city}, {carrier.state}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Equipment Types:</p>
          <div className="flex flex-wrap gap-1">
            {carrier.equipment_types.slice(0, 3).map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type.replace("_", " ")}
              </Badge>
            ))}
            {carrier.equipment_types.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{carrier.equipment_types.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {carrier.lanes && carrier.lanes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Primary Lanes:</p>
            <div className="flex flex-wrap gap-2">
              {carrier.lanes.slice(0, 2).map((lane, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {lane.origin} → {lane.dest}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
