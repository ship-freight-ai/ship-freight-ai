import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadStatusBadge } from "./LoadStatusBadge";
import { Calendar, MapPin, Package, DollarSign, ArrowRight, Truck } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

type Load = Database["public"]["Tables"]["loads"]["Row"];

interface LoadCardProps {
  load: Load;
}

export function LoadCard({ load }: LoadCardProps) {
  const navigate = useNavigate();

  const formatEquipmentType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        onClick={() => navigate(`/app/loads/${load.id}`)}
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Load #{load.load_number || load.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 group-hover:text-primary transition-colors">
                <span className="font-semibold text-lg truncate">
                  {load.origin_city}, {load.origin_state}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
                <span className="text-muted-foreground sm:hidden text-sm">→</span>
                <span className="font-semibold text-lg truncate">
                  {load.destination_city}, {load.destination_state}
                </span>
              </div>
            </div>
            <LoadStatusBadge status={load.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
              <MapPin className="w-4 h-4 text-primary/70" />
              <span className="text-muted-foreground">
                {load.distance_miles ? `${load.distance_miles} mi` : "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span className="text-muted-foreground">
                {format(new Date(load.pickup_date), "MMM dd")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
              <Package className="w-4 h-4 text-primary/70" />
              <span className="text-muted-foreground truncate">
                {formatEquipmentType(load.equipment_type)}
              </span>
            </div>
            {load.posted_rate ? (
              <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">
                  ${load.posted_rate.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rate TBD</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/loads/${load.id}`);
            }}
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
