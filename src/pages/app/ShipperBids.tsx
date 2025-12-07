import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/app/BackButton";
import { BidCard } from "@/components/app/BidCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ShipperBids() {
  const { data: bids, isLoading } = useQuery({
    queryKey: ["shipper-all-bids"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get all loads for this shipper
      const { data: loads } = await supabase
        .from("loads")
        .select("id")
        .eq("shipper_id", user.id);

      if (!loads || loads.length === 0) return [];

      const loadIds = loads.map(l => l.id);

      // Get all bids for these loads
      const { data: bidsData } = await supabase
        .from("bids")
        .select(`
          *,
          load:loads(
            id,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            equipment_type,
            posted_rate
          ),
          carrier:profiles!bids_carrier_id_fkey(
            full_name,
            company_name
          )
        `)
        .in("load_id", loadIds)
        .order("created_at", { ascending: false });

      return bidsData || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackButton />
        <h1 className="text-4xl font-bold mb-2">All Bids</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const pendingBids = bids?.filter((b) => b.status === "pending") || [];
  const acceptedBids = bids?.filter((b) => b.status === "accepted") || [];
  const rejectedBids = bids?.filter((b) => b.status === "rejected") || [];
  const otherBids = bids?.filter((b) => !["pending", "accepted", "rejected"].includes(b.status)) || [];

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-4xl font-bold mb-2">All Bids</h1>
        <p className="text-muted-foreground">View and manage all bids on your loads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-3xl font-bold text-primary">{pendingBids.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-green-600">{acceptedBids.length}</div>
          <div className="text-sm text-muted-foreground">Accepted</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-red-600">{rejectedBids.length}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold">{bids?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Bids</div>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingBids.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({acceptedBids.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedBids.length})</TabsTrigger>
          <TabsTrigger value="other">Other ({otherBids.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} isShipper={true} loadId={bid.load_id} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending bids</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-6">
          {acceptedBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} isShipper={true} loadId={bid.load_id} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No accepted bids</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} isShipper={true} loadId={bid.load_id} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rejected bids</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-4 mt-6">
          {otherBids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherBids.map((bid) => (
                <BidCard key={bid.id} bid={bid} isShipper={true} loadId={bid.load_id} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No other bids</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
