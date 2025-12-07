import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/app/analytics/StatCard";
import LoadStatsChart from "@/components/app/analytics/LoadStatsChart";
import RevenueChart from "@/components/app/analytics/RevenueChart";
import StatusPieChart from "@/components/app/analytics/StatusPieChart";
import {
  useLoadAnalytics,
  useRevenueAnalytics,
  usePerformanceMetrics,
  useBidAnalytics,
} from "@/hooks/useAnalytics";
import {
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Gavel,
  Star,
  Target,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppAnalytics() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
  });

  const { data: loadAnalytics, isLoading: loadLoading } = useLoadAnalytics();
  const { data: revenueAnalytics, isLoading: revenueLoading } = useRevenueAnalytics();
  const { data: performanceMetrics, isLoading: performanceLoading } = usePerformanceMetrics();
  const { data: bidAnalytics, isLoading: bidLoading } = useBidAnalytics();

  const isShipper = profile?.role === "shipper";
  const isCarrier = profile?.role === "carrier";

  if (loadLoading || revenueLoading || performanceLoading || bidLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
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
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            {isShipper ? "Track your shipment performance and spending" : "Monitor your carrier performance and earnings"}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loads">Loads</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Loads"
                value={loadAnalytics?.totalLoads || 0}
                icon={Package}
                iconColor="text-primary"
              />
              <StatCard
                title="Active Loads"
                value={loadAnalytics?.activeLoads || 0}
                icon={Clock}
                iconColor="text-yellow-500"
              />
              <StatCard
                title="Completed Loads"
                value={loadAnalytics?.completedLoads || 0}
                icon={CheckCircle}
                iconColor="text-green-500"
              />
              <StatCard
                title={isShipper ? "Total Spent" : "Total Earned"}
                value={`$${(revenueAnalytics?.totalRevenue || 0).toLocaleString()}`}
                icon={DollarSign}
                iconColor="text-green-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadAnalytics && <LoadStatsChart data={loadAnalytics.monthlyData} />}
              {revenueAnalytics && <RevenueChart data={revenueAnalytics.monthlyRevenue} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadAnalytics?.statusBreakdown && (
                <StatusPieChart data={loadAnalytics.statusBreakdown} title="Load Status Distribution" />
              )}
              {bidAnalytics?.statusBreakdown && (
                <StatusPieChart data={bidAnalytics.statusBreakdown} title="Bid Status Distribution" />
              )}
            </div>
          </TabsContent>

          {/* Loads Tab */}
          <TabsContent value="loads" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Loads"
                value={loadAnalytics?.totalLoads || 0}
                icon={Package}
                iconColor="text-primary"
              />
              <StatCard
                title="Active"
                value={loadAnalytics?.activeLoads || 0}
                icon={TrendingUp}
                iconColor="text-blue-500"
              />
              <StatCard
                title="Completed"
                value={loadAnalytics?.completedLoads || 0}
                icon={CheckCircle}
                iconColor="text-green-500"
              />
              <StatCard
                title="Cancelled"
                value={loadAnalytics?.cancelledLoads || 0}
                icon={XCircle}
                iconColor="text-red-500"
              />
            </div>

            {loadAnalytics && <LoadStatsChart data={loadAnalytics.monthlyData} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadAnalytics?.statusBreakdown && (
                <StatusPieChart data={loadAnalytics.statusBreakdown} title="Status Breakdown" />
              )}
              {loadAnalytics?.equipmentBreakdown && (
                <StatusPieChart data={loadAnalytics.equipmentBreakdown} title="Equipment Type Distribution" />
              )}
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title={isShipper ? "Total Spent" : "Total Revenue"}
                value={`$${(revenueAnalytics?.totalRevenue || 0).toLocaleString()}`}
                icon={DollarSign}
                iconColor="text-green-500"
              />
              <StatCard
                title="Paid"
                value={`$${(revenueAnalytics?.paidAmount || 0).toLocaleString()}`}
                icon={CheckCircle}
                iconColor="text-green-500"
              />
              <StatCard
                title="In Escrow"
                value={`$${(revenueAnalytics?.escrowAmount || 0).toLocaleString()}`}
                icon={Clock}
                iconColor="text-blue-500"
              />
              <StatCard
                title="Pending"
                value={`$${(revenueAnalytics?.pendingAmount || 0).toLocaleString()}`}
                icon={Clock}
                iconColor="text-yellow-500"
              />
            </div>

            {revenueAnalytics && <RevenueChart data={revenueAnalytics.monthlyRevenue} />}

            {revenueAnalytics?.statusBreakdown && (
              <StatusPieChart data={revenueAnalytics.statusBreakdown} title="Payment Status Distribution" />
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6 mt-6">
            {isCarrier && performanceMetrics?.type === "carrier" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="On-Time Performance"
                    value={`${performanceMetrics.onTimePercentage}%`}
                    icon={Target}
                    iconColor="text-green-500"
                  />
                  <StatCard
                    title="Rating"
                    value={performanceMetrics.rating.toFixed(1)}
                    icon={Star}
                    iconColor="text-yellow-500"
                    description="Out of 5.0"
                  />
                  <StatCard
                    title="Win Rate"
                    value={`${performanceMetrics.winRate}%`}
                    icon={Award}
                    iconColor="text-blue-500"
                  />
                  <StatCard
                    title="Total Loads"
                    value={performanceMetrics.totalLoads}
                    icon={Package}
                    iconColor="text-primary"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Bidding Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bids</p>
                        <p className="text-2xl font-bold">{performanceMetrics.totalBidsSubmitted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accepted</p>
                        <p className="text-2xl font-bold text-green-500">{performanceMetrics.acceptedBids}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-2xl font-bold text-blue-500">{performanceMetrics.winRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {isShipper && performanceMetrics?.type === "shipper" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Bids Received"
                    value={performanceMetrics.totalBidsReceived}
                    icon={Gavel}
                    iconColor="text-primary"
                  />
                  <StatCard
                    title="Loads with Bids"
                    value={performanceMetrics.loadsWithBids}
                    icon={CheckCircle}
                    iconColor="text-green-500"
                  />
                  <StatCard
                    title="Avg Bids per Load"
                    value={performanceMetrics.avgBidsPerLoad}
                    icon={TrendingUp}
                    iconColor="text-blue-500"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Bidding Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      On average, you receive {performanceMetrics.avgBidsPerLoad} bids per load. 
                      {performanceMetrics.avgBidsPerLoad < 3 && " Consider increasing your posted rates to attract more carriers."}
                      {performanceMetrics.avgBidsPerLoad >= 3 && performanceMetrics.avgBidsPerLoad < 5 && " You're getting good carrier interest."}
                      {performanceMetrics.avgBidsPerLoad >= 5 && " Excellent carrier engagement on your loads!"}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {bidAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title="Total Bids"
                  value={bidAnalytics.totalBids}
                  icon={Gavel}
                  iconColor="text-primary"
                />
                <StatCard
                  title="Accepted"
                  value={bidAnalytics.acceptedBids}
                  icon={CheckCircle}
                  iconColor="text-green-500"
                />
                <StatCard
                  title="Pending"
                  value={bidAnalytics.pendingBids}
                  icon={Clock}
                  iconColor="text-yellow-500"
                />
                <StatCard
                  title="Rejected"
                  value={bidAnalytics.rejectedBids}
                  icon={XCircle}
                  iconColor="text-red-500"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
