import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ChevronDown } from "lucide-react";
import { useUpdateLoadStatus } from "@/hooks/useLoads";
import type { Database } from "@/integrations/supabase/types";

type LoadStatus = Database["public"]["Enums"]["load_status"];

interface LoadStatusManagerProps {
  loadId: string;
  currentStatus: LoadStatus;
}

const statusTransitions: Record<LoadStatus, LoadStatus[]> = {
  draft: ["posted"],
  posted: ["bidding", "cancelled"],
  bidding: ["booked", "cancelled"],
  booked: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

const statusLabels: Record<LoadStatus, string> = {
  draft: "Draft",
  posted: "Posted",
  bidding: "Bidding",
  booked: "Booked",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function LoadStatusManager({ loadId, currentStatus }: LoadStatusManagerProps) {
  const [confirmStatus, setConfirmStatus] = useState<LoadStatus | null>(null);
  const updateStatus = useUpdateLoadStatus(loadId);

  const availableTransitions = statusTransitions[currentStatus];

  if (availableTransitions.length === 0) {
    return null;
  }

  const handleStatusChange = (newStatus: LoadStatus) => {
    const criticalTransitions: LoadStatus[] = ["booked", "delivered", "completed", "cancelled"];
    
    if (criticalTransitions.includes(newStatus)) {
      setConfirmStatus(newStatus);
    } else {
      updateStatus.mutate(newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (confirmStatus) {
      updateStatus.mutate(confirmStatus);
      setConfirmStatus(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Update Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableTransitions.map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
            >
              {statusLabels[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirmStatus} onOpenChange={() => setConfirmStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to{" "}
              <strong>{confirmStatus && statusLabels[confirmStatus]}</strong>?
              {confirmStatus === "cancelled" && " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
