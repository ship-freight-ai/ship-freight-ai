import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, FileText, DollarSign, Plus, Upload, BarChart3, Clock, ArrowRight, Zap, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OnboardingTour, TourStep } from "@/components/ui/onboarding-tour";
import { useLoadsList } from "@/hooks/useLoads";
import { useDocuments } from "@/hooks/useDocuments";
import { useUserPayments } from "@/hooks/usePayments";
import { motion } from "framer-motion";
import StatCard from "@/components/app/analytics/StatCard";
import { LoadCard } from "@/components/app/LoadCard";

const tourSteps: TourStep[] = [
  {
    targetId: "create-load-btn",
    title: "Post Your First Load",
    content: "Click here to create a new shipment requirement. You'll specify origin, destination, and freight details.",
    position: "bottom"
  },
  {
    targetId: "active-loads-card",
    title: "Track Active Loads",
    content: "Monitor your ongoing shipments here. You'll see real-time status updates from carriers.",
    position: "right"
  },
  {
    targetId: "ai-insights-card",
    title: "AI Insights",
    content: "Get predictive analytics and market rate suggestions powered by our AI engine.",
    position: "left"
  }
];

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const { data: loadsData, isLoading } = useLoadsList("shipper");
  const { data: documents } = useDocuments();
  const { data: payments } = useUserPayments();

  const loads = loadsData?.data || [];

  const activeLoads = loads.filter(l => l.status === "in_transit" || l.status === "booked");
  const pendingBookings = loads.filter(l => l.status === "posted" || l.status === "bidding");
  const completedLoads = loads.filter(l => l.status === "delivered");
  const totalSpent = payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const recentLoads = loads.slice(0, 3);

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
            Shipper Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage shipments, track performance, and optimize your freight operations
          </p>
        </div>
        <Button
          onClick={() => navigate("/app/loads?new=true")}
          id="create-load-btn"
          size="lg"
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Load
        </Button>
      </motion.div>

      <OnboardingTour tourId="shipper-dashboard-v1" steps={tourSteps} />

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          id="active-loads-card"
          title="Active Loads"
          value={activeLoads.length}
          icon={Package}
          description="Currently in transit"
          trend={activeLoads.length > 0 ? { value: 12, isPositive: true } : undefined}
        />
        <StatCard
          title="Awaiting Bids"
          value={pendingBookings.length}
          icon={Clock}
          description="Posted & collecting bids"
        />
        <StatCard
          title="Completed"
          value={completedLoads.length}
          icon={TruckIcon}
          description="Successfully delivered"
        />
        <StatCard
          id="ai-insights-card"
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          icon={DollarSign}
          description="All-time freight spend"
        />
      </motion.div>

      {/* Quick Actions - Redesigned */}
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
                onClick={() => navigate("/app/loads")}
              >
                <Package className="h-5 w-5 text-primary" />
                <span className="text-sm">My Loads</span>
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

      {/* Recent Loads - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Loads</CardTitle>
              <CardDescription>Your latest shipment activity</CardDescription>
            </div>
            {loads.length > 3 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/app/loads")}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : recentLoads.length > 0 ? (
              <div className="space-y-4">
                {recentLoads.map((load) => (
                  <LoadCard key={load.id} load={load} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No loads yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first load to start connecting with carriers and moving freight
                </p>
                <Button onClick={() => navigate("/app/loads?new=true")} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Load
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
