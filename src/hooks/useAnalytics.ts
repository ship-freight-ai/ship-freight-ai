import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const useLoadAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "loads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isShipper = profile?.role === "shipper";
      const isCarrier = profile?.role === "carrier";

      let query = supabase.from("loads").select("*");

      if (isShipper) {
        query = query.eq("shipper_id", user.id);
      } else if (isCarrier) {
        query = query.eq("carrier_id", user.id);
      }

      const { data: loads, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const totalLoads = loads?.length || 0;
      const activeLoads = loads?.filter(l => ["posted", "bidding", "booked", "in_transit"].includes(l.status)).length || 0;
      const completedLoads = loads?.filter(l => l.status === "completed").length || 0;
      const cancelledLoads = loads?.filter(l => l.status === "cancelled").length || 0;

      // Status breakdown
      const statusBreakdown = loads?.reduce((acc, load) => {
        acc[load.status] = (acc[load.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Monthly trends (last 6 months)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthLoads = loads?.filter(l => {
          const createdAt = new Date(l.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }) || [];

        monthlyData.push({
          month: format(monthDate, "MMM yyyy"),
          total: monthLoads.length,
          completed: monthLoads.filter(l => l.status === "completed").length,
          cancelled: monthLoads.filter(l => l.status === "cancelled").length,
        });
      }

      // Equipment type breakdown
      const equipmentBreakdown = loads?.reduce((acc, load) => {
        acc[load.equipment_type] = (acc[load.equipment_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalLoads,
        activeLoads,
        completedLoads,
        cancelledLoads,
        statusBreakdown,
        monthlyData,
        equipmentBreakdown,
      };
    },
  });
};

export const useRevenueAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "revenue"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isShipper = profile?.role === "shipper";
      const isCarrier = profile?.role === "carrier";

      let query = supabase.from("payments").select("*");

      if (isShipper) {
        query = query.eq("shipper_id", user.id);
      } else if (isCarrier) {
        query = query.eq("carrier_id", user.id);
      }

      const { data: payments, error } = await query;
      if (error) throw error;

      // Calculate totals
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const paidAmount = payments?.filter(p => ["completed", "released"].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0) || 0;
      const pendingAmount = payments?.filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0) || 0;
      const escrowAmount = payments?.filter(p => p.status === "held_in_escrow")
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      // Monthly revenue trends (last 6 months)
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthPayments = payments?.filter(p => {
          const createdAt = new Date(p.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }) || [];

        monthlyRevenue.push({
          month: format(monthDate, "MMM yyyy"),
          revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
          completed: monthPayments.filter(p => ["completed", "released"].includes(p.status))
            .reduce((sum, p) => sum + p.amount, 0),
        });
      }

      // Status breakdown
      const statusBreakdown = payments?.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalRevenue,
        paidAmount,
        pendingAmount,
        escrowAmount,
        monthlyRevenue,
        statusBreakdown,
      };
    },
  });
};

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ["analytics", "performance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isCarrier = profile?.role === "carrier";

      if (!isCarrier) {
        // For shippers, show bid metrics
        const { data: loads } = await supabase
          .from("loads")
          .select(`
            *,
            bids (*)
          `)
          .eq("shipper_id", user.id);

        const totalBidsReceived = loads?.reduce((sum, load) => sum + (load.bids?.length || 0), 0) || 0;
        const loadsWithBids = loads?.filter(l => l.bids && l.bids.length > 0).length || 0;
        const avgBidsPerLoad = loadsWithBids > 0 ? totalBidsReceived / loadsWithBids : 0;

        return {
          totalBidsReceived,
          avgBidsPerLoad: Number(avgBidsPerLoad.toFixed(1)),
          loadsWithBids,
          type: "shipper" as const,
        };
      } else {
        // For carriers, show carrier metrics
        const { data: carrier } = await supabase
          .from("carriers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: bids } = await supabase
          .from("bids")
          .select("*")
          .eq("carrier_id", user.id);

        const totalBidsSubmitted = bids?.length || 0;
        const acceptedBids = bids?.filter(b => b.status === "accepted").length || 0;
        const winRate = totalBidsSubmitted > 0 ? (acceptedBids / totalBidsSubmitted) * 100 : 0;

        return {
          onTimePercentage: carrier?.on_time_percentage || 0,
          totalLoads: carrier?.total_loads || 0,
          rating: carrier?.rating || 0,
          totalBidsSubmitted,
          acceptedBids,
          winRate: Number(winRate.toFixed(1)),
          type: "carrier" as const,
        };
      }
    },
  });
};

export const useBidAnalytics = () => {
  return useQuery({
    queryKey: ["analytics", "bids"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const isCarrier = profile?.role === "carrier";

      let query = supabase.from("bids").select("*");

      if (isCarrier) {
        query = query.eq("carrier_id", user.id);
      } else {
        // For shippers, get bids on their loads
        const { data: loads } = await supabase
          .from("loads")
          .select("id")
          .eq("shipper_id", user.id);

        const loadIds = loads?.map(l => l.id) || [];
        if (loadIds.length === 0) {
          return {
            totalBids: 0,
            acceptedBids: 0,
            rejectedBids: 0,
            pendingBids: 0,
            statusBreakdown: {},
          };
        }

        query = query.in("load_id", loadIds);
      }

      const { data: bids, error } = await query;
      if (error) throw error;

      const totalBids = bids?.length || 0;
      const acceptedBids = bids?.filter(b => b.status === "accepted").length || 0;
      const rejectedBids = bids?.filter(b => b.status === "rejected").length || 0;
      const pendingBids = bids?.filter(b => b.status === "pending").length || 0;

      const statusBreakdown = bids?.reduce((acc, bid) => {
        acc[bid.status] = (acc[bid.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalBids,
        acceptedBids,
        rejectedBids,
        pendingBids,
        statusBreakdown,
      };
    },
  });
};
