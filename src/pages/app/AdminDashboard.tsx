import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Activity, Package, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlatformMetrics } from "@/hooks/useAdmin";
import { motion } from "framer-motion";
import StatCard from "@/components/app/analytics/StatCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = usePlatformMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor platform performance and manage users</p>
      </motion.div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={metrics?.total_users || 0}
          icon={Users}
          description={`${metrics?.total_shippers || 0} shippers, ${metrics?.total_carriers || 0} carriers`}
        />
        <StatCard
          title="Active Disputes"
          value={metrics?.active_disputes || 0}
          icon={AlertCircle}
          variant={metrics?.active_disputes > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Pending Verifications"
          value={metrics?.pending_verifications || 0}
          icon={Activity}
        />
        <StatCard
          title="Total Admins"
          value={metrics?.total_admins || 0}
          icon={Users}
        />
      </div>

      {/* Load & Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Loads"
          value={metrics?.total_loads || 0}
          icon={Package}
          description={`${metrics?.active_loads || 0} active, ${metrics?.completed_loads || 0} completed`}
        />
        <StatCard
          title="Total Revenue"
          value={`$${Number(metrics?.total_revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Platform Health"
          value="Excellent"
          icon={TrendingUp}
          description="All systems operational"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Admin management tools</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/app/admin/users")}>
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/admin/disputes")}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Resolve Disputes ({metrics?.active_disputes || 0})
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/admin/subscriptions")}>
            <DollarSign className="mr-2 h-4 w-4" />
            Manage Subscriptions
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/admin/metrics")}>
            <Activity className="mr-2 h-4 w-4" />
            View Metrics
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/admin/loads")}>
            <Package className="mr-2 h-4 w-4" />
            All Loads
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/admin/payments")}>
            <DollarSign className="mr-2 h-4 w-4" />
            All Payments
          </Button>
        </CardContent>
      </Card>

      {/* Platform Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest events across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Activity feed coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
