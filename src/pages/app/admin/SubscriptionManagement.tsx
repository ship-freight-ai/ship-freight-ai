import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscriptionAnalytics, useAllSubscriptions } from "@/hooks/useSubscriptionAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, AlertCircle, CreditCard, Calendar } from "lucide-react";
import StatCard from "@/components/app/analytics/StatCard";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function SubscriptionManagement() {
  const { data: analytics, isLoading: analyticsLoading } = useSubscriptionAnalytics();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useAllSubscriptions();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      canceled: "outline",
      incomplete: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPlanBadge = (planType: string) => {
    return (
      <Badge variant={planType === "shipper" ? "default" : "secondary"}>
        {planType}
      </Badge>
    );
  };

  if (analyticsLoading) {
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
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">Monitor and manage all platform subscriptions</p>
      </motion.div>

      {/* Revenue & Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`$${Number(analytics?.monthly_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="MRR from active subscriptions"
        />
        <StatCard
          title="Annual Revenue"
          value={`$${Number(analytics?.annual_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Total ARR projection"
        />
        <StatCard
          title="Active Subscriptions"
          value={analytics?.active_subscriptions || 0}
          icon={Users}
          description={`${analytics?.trial_subscriptions || 0} trials active`}
        />
        <StatCard
          title="Total Seats"
          value={analytics?.total_seats || 0}
          icon={CreditCard}
          description={`${Number(analytics?.avg_seats_per_subscription || 0).toFixed(1)} avg per sub`}
        />
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Current subscription states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active</span>
              <Badge variant="default">{analytics?.active_subscriptions || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Trialing</span>
              <Badge variant="secondary">{analytics?.trial_subscriptions || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Canceled (end of period)</span>
              <Badge variant="outline">{analytics?.canceled_subscriptions || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Past Due</span>
              <Badge variant="destructive">{analytics?.past_due_subscriptions || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Subscriptions by plan type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Shipper Plans</span>
              <Badge variant="default">{analytics?.shipper_subscriptions || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Carrier Plans</span>
              <Badge variant="secondary">{analytics?.carrier_subscriptions || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Subscriptions</span>
              <Badge>{analytics?.total_subscriptions || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Complete list of platform subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions && subscriptions.length > 0 ? (
                    subscriptions.map((sub: any) => {
                      const monthlyRevenue = sub.billing_cycle === 'monthly'
                        ? (sub.plan_type === 'shipper' ? 189 : 49) * sub.seats
                        : (sub.plan_type === 'shipper' ? 1814.40 : 470.40) * sub.seats / 12;

                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sub.profiles?.full_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{sub.profiles?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getPlanBadge(sub.plan_type)}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.billing_cycle}</Badge>
                          </TableCell>
                          <TableCell>{sub.seats}</TableCell>
                          <TableCell>${monthlyRevenue.toFixed(2)}/mo</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (sub.stripe_customer_id) {
                                  window.open(`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`, '_blank');
                                }
                              }}
                            >
                              View in Stripe
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
