import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Gavel, Package, DollarSign, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCarrierBids } from "@/hooks/useBids";
import { useUserPayments } from "@/hooks/usePayments";
import { motion } from "framer-motion";
import StatCard from "@/components/app/analytics/StatCard";
import { LoadCard } from "@/components/app/LoadCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function CarrierDashboard() {
  const navigate = useNavigate();
  const { data: bids } = useCarrierBids();
  const { data: payments } = useUserPayments();

  // Fetch loads assigned to carrier
  const { data: assignedLoads } = useQuery({
    queryKey: ["carrier-assigned-loads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("carrier_id", user.id)
        .order("pickup_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch available loads
  const { data: availableLoads } = useQuery({
    queryKey: ["available-loads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .in("status", ["posted", "bidding"])
        .order("pickup_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const activeBids = bids?.filter(b => b.status === "pending") || [];
  const acceptedBids = bids?.filter(b => b.status === "accepted") || [];
  const totalEarnings = payments?.filter(p => p.status === "completed" || p.status === "released")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Carrier Dashboard</h1>
        <p className="text-muted-foreground">Find loads and track your earnings</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Loads"
          value={availableLoads?.length || 0}
          icon={Search}
        />
        <StatCard
          title="Active Bids"
          value={activeBids.length}
          icon={Gavel}
        />
        <StatCard
          title="Accepted Loads"
          value={acceptedBids.length}
          icon={Package}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Total Earnings"
          value={`$${totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 22, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/app/loads")}>
            <Search className="mr-2 h-4 w-4" />
            Find Loads
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/bids")}>
            <Gavel className="mr-2 h-4 w-4" />
            View My Bids
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/documents")}>
            <Upload className="mr-2 h-4 w-4" />
            Upload POD/BOL
          </Button>
        </CardContent>
      </Card>

      {/* Available Loads */}
      <Card>
        <CardHeader>
          <CardTitle>Available Loads</CardTitle>
          <CardDescription>Loads you can bid on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableLoads && availableLoads.length > 0 ? (
            availableLoads.slice(0, 3).map((load) => (
              <LoadCard key={load.id} load={load} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No available loads at the moment</p>
            </div>
          )}
          {availableLoads && availableLoads.length > 3 && (
            <Button variant="outline" className="w-full" onClick={() => navigate("/app/loads")}>
              View All Available Loads
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Loads */}
      {assignedLoads && assignedLoads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Loads</CardTitle>
            <CardDescription>Loads assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedLoads.slice(0, 3).map((load) => (
              <LoadCard key={load.id} load={load} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
