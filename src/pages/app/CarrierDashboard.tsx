import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Gavel, Package, DollarSign, Upload, ArrowRight, Zap, FileText, Settings, MessageSquare, MapPin, TrendingUp } from "lucide-react";
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
  const { data: assignedLoads, isLoading: loadingAssigned } = useQuery({
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
  const { data: availableLoads, isLoading: loadingAvailable } = useQuery({
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
  const inTransitLoads = assignedLoads?.filter(l => l.status === "in_transit") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Carrier Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover loads, manage bids, and track your earnings
          </p>
        </div>
        <Button
          onClick={() => navigate("/app/loads")}
          size="lg"
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Search className="mr-2 h-5 w-5" />
          Find Loads
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Available Loads"
          value={availableLoads?.length || 0}
          icon={MapPin}
          description="Open for bidding"
        />
        <StatCard
          title="Active Bids"
          value={activeBids.length}
          icon={Gavel}
          description="Awaiting response"
        />
        <StatCard
          title="In Transit"
          value={inTransitLoads.length}
          icon={Package}
          description="Currently hauling"
          trend={inTransitLoads.length > 0 ? { value: 15, isPositive: true } : undefined}
        />
        <StatCard
          title="Total Earnings"
          value={`$${totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          description="All-time revenue"
          trend={totalEarnings > 0 ? { value: 22, isPositive: true } : undefined}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used tools and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate("/app/bids")}
              >
                <Gavel className="h-5 w-5 text-primary" />
                <span className="text-sm">My Bids</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate("/app/documents")}
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm">Documents</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate("/app/messages")}
              >
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-sm">Messages</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => navigate("/app/settings")}
              >
                <Settings className="h-5 w-5 text-primary" />
                <span className="text-sm">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Available Loads */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Loads</CardTitle>
              <CardDescription>Loads open for bidding in your area</CardDescription>
            </div>
            {availableLoads && availableLoads.length > 3 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/loads")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loadingAvailable ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : availableLoads && availableLoads.length > 0 ? (
              <div className="space-y-4">
                {availableLoads.slice(0, 3).map((load) => (
                  <LoadCard key={load.id} load={load} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No loads available</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Check back soon or adjust your service area to see more loads
                </p>
                <Button variant="outline" onClick={() => navigate("/app/settings")}>
                  Update Preferences
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Your Active Loads */}
      {assignedLoads && assignedLoads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Your Active Loads
                </CardTitle>
                <CardDescription>Loads you're currently hauling</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedLoads.slice(0, 3).map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
