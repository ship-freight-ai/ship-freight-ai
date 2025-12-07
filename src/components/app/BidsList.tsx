import { Card } from "@/components/ui/card";
import { BidCard } from "./BidCard";
import { FileText } from "lucide-react";
import { useLoadBids } from "@/hooks/useBids";
import { useLoadDetails } from "@/hooks/useLoads";

interface BidsListProps {
  loadId: string;
  isShipper?: boolean;
}

export function BidsList({ loadId, isShipper }: BidsListProps) {
  const { data: bids, isLoading } = useLoadBids(loadId);
  const { data: load } = useLoadDetails(loadId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-48 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (!bids || bids.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
        <p className="text-muted-foreground">
          {isShipper
            ? "Waiting for carriers to submit bids"
            : "Be the first to submit a bid on this load"}
        </p>
      </Card>
    );
  }

  const pendingBids = bids.filter((b) => b.status === "pending");
  const otherBids = bids.filter((b) => b.status !== "pending");

  return (
    <div className="space-y-6">
      {pendingBids.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Pending Bids ({pendingBids.length})
          </h3>
          <div className="space-y-4">
            {pendingBids.map((bid) => (
              <BidCard key={bid.id} bid={bid} isShipper={isShipper} loadId={loadId} load={load} />
            ))}
          </div>
        </div>
      )}

      {otherBids.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Previous Bids ({otherBids.length})
          </h3>
          <div className="space-y-4">
            {otherBids.map((bid) => (
              <BidCard key={bid.id} bid={bid} isShipper={isShipper} loadId={loadId} load={load} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
