import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type LoadStatus = Database["public"]["Enums"]["load_status"];

const statusConfig: Record<LoadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  posted: { label: "Posted", variant: "secondary" },
  bidding: { label: "Bidding", variant: "default" },
  booked: { label: "Booked", variant: "default" },
  in_transit: { label: "In Transit", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface LoadStatusBadgeProps {
  status: LoadStatus;
}

export function LoadStatusBadge({ status }: LoadStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
