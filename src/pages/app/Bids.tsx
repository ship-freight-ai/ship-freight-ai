import { Card } from "@/components/ui/card";
import { useCarrierBids } from "@/hooks/useBids";
import { BidCard } from "@/components/app/BidCard";
import { Badge } from "@/components/ui/badge";
import { Gavel, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppBids() {
  const { data: bids, isLoading } = useCarrierBids();

  const pendingBids = bids?.filter((b) => b.status === "pending") || [];
  const acceptedBids = bids?.filter((b) => b.status === "accepted") || [];
  const otherBids = bids?.filter((b) => !["pending", "accepted"].includes(b.status)) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bids</h1>
          <p className="text-muted-foreground">Track and manage your load bids</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold">Pending</h3>
            </div>
            <p className="text-3xl font-bold">{pendingBids.length}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Accepted</h3>
            </div>
            <p className="text-3xl font-bold">{acceptedBids.length}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Total Bids</h3>
            </div>
            <p className="text-3xl font-bold">{bids?.length || 0}</p>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingBids.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedBids.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              Other ({otherBids.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingBids.length > 0 ? (
              <div className="space-y-4">
                {pendingBids.map((bid) => (
                  <Card key={bid.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {bid.loads?.origin_city}, {bid.loads?.origin_state} → {bid.loads?.destination_city}, {bid.loads?.destination_state}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{bid.status}</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {bid.loads?.equipment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${bid.bid_amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Your bid</p>
                      </div>
                    </div>
                    {bid.notes && (
                      <div className="p-3 bg-muted rounded-lg mb-3">
                        <p className="text-sm">{bid.notes}</p>
                      </div>
                    )}
                    {bid.tracking_url && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <a 
                          href={bid.tracking_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          🚛 Track Truck
                        </a>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending bids</h3>
                <p className="text-muted-foreground">Browse available loads to submit bids</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-6">
            {acceptedBids.length > 0 ? (
              <div className="space-y-4">
                {acceptedBids.map((bid) => (
                  <Card key={bid.id} className="p-6 border-green-500/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {bid.loads?.origin_city}, {bid.loads?.origin_state} → {bid.loads?.destination_city}, {bid.loads?.destination_state}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Accepted</Badge>
                          <Badge variant="secondary" className="capitalize">
                            {bid.loads?.equipment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${bid.bid_amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Accepted bid</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accepted bids</h3>
                <p className="text-muted-foreground">Keep bidding on loads to win contracts</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="other" className="mt-6">
            {otherBids.length > 0 ? (
              <div className="space-y-4">
                {otherBids.map((bid) => (
                  <Card key={bid.id} className="p-6 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {bid.loads?.origin_city}, {bid.loads?.origin_state} → {bid.loads?.destination_city}, {bid.loads?.destination_state}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={bid.status === "rejected" ? "destructive" : "secondary"}>
                            {bid.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {bid.loads?.equipment_type.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${bid.bid_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No other bids</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
