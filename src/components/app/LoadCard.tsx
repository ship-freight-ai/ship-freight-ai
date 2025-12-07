import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadStatusBadge } from "./LoadStatusBadge";
import { Calendar, MapPin, Package, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Load = Database["public"]["Tables"]["loads"]["Row"];

interface LoadCardProps {
  load: Load;
}

export function LoadCard({ load }: LoadCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/app/loads/${load.id}`)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">
            {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
          </h3>
          <p className="text-sm text-muted-foreground">
            Load #{load.load_number || load.id.slice(0, 8)}
          </p>
        </div>
        <LoadStatusBadge status={load.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{load.distance_miles ? `${load.distance_miles} miles` : "Distance TBD"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>Pickup: {format(new Date(load.pickup_date), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="capitalize">{load.equipment_type.replace("_", " ")}</span>
          {load.weight && <span>• {load.weight} lbs</span>}
        </div>
        {load.posted_rate && (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>${load.posted_rate.toLocaleString()}</span>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/app/loads/${load.id}`);
        }}
      >
        View Details
      </Button>
    </Card>
  );
}
