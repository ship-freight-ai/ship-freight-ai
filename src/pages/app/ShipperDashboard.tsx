import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TruckIcon, FileText, DollarSign, Plus, Upload } from "lucide-react";
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
  const { data: loadsData } = useLoadsList("shipper");
  const { data: documents } = useDocuments();
  const { data: payments } = useUserPayments();

  const loads = loadsData?.data || [];

  const activeLoads = loads.filter(l => l.status === "in_transit" || l.status === "booked");
  const pendingBookings = loads.filter(l => l.status === "posted" || l.status === "bidding");
  const totalSpent = payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const recentLoads = loads.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipper Dashboard</h1>
          <p className="text-muted-foreground">Manage your shipments and track performance</p>
        </div>
        <Button onClick={() => navigate("/app/loads/new")} id="create-load-btn">
          <Plus className="mr-2 h-4 w-4" />
          Create New Load
        </Button>
      </div>

      <OnboardingTour tourId="shipper-dashboard-v1" steps={tourSteps} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          id="active-loads-card"
          title="Active Loads"
          value={activeLoads.length}
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Pending Bookings"
          value={pendingBookings.length}
          icon={TruckIcon}
        />
        <StatCard
          title="Documents"
          value={documents?.length || 0}
          icon={FileText}
        />
        <StatCard
          id="ai-insights-card"
          title="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8, isPositive: false }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/app/loads/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Post New Load
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/documents")}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/carriers")}>
            <TruckIcon className="mr-2 h-4 w-4" />
            Browse Carriers
          </Button>
        </CardContent>
      </Card>

      {/* Recent Loads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Loads</CardTitle>
          <CardDescription>Your latest shipments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentLoads.length > 0 ? (
            recentLoads.map((load) => (
              <LoadCard key={load.id} load={load} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No loads yet. Create your first load to get started!</p>
              <Button className="mt-4" onClick={() => navigate("/app/loads/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Load
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
