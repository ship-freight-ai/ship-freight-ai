import { ReactNode } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Package,
  MessageSquare,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  AlertCircle,
  Activity,
  LogOut,
  Search,
  Gavel,
  DollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import logo from "@/assets/logo.png";

import { useUnreadMessages } from "@/hooks/useMessages";

export const AppLayout = () => {
  const { data: roleData } = useUserRole();
  const { data: unreadCount } = useUnreadMessages();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/site/auth");
  };

  const shipperMenuItems = [
    { title: "Dashboard", url: "/app/dashboard/shipper", icon: LayoutDashboard },
    { title: "My Loads", url: "/app/loads", icon: Package },
    { title: "All Bids", url: "/app/shipper-bids", icon: Gavel },
    { title: "Carriers", url: "/app/carriers", icon: Truck },
    { title: "Messages", url: "/app/messages", icon: MessageSquare },
    { title: "Documents", url: "/app/documents", icon: FileText },
    { title: "Freight Payments", url: "/app/freight-payments", icon: DollarSign },
    { title: "Subscription", url: "/app/billing", icon: CreditCard },
    { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
    { title: "Settings", url: "/app/settings", icon: Settings },
  ];

  const carrierMenuItems = [
    { title: "Dashboard", url: "/app/dashboard/carrier", icon: LayoutDashboard },
    { title: "Find Loads", url: "/app/loads", icon: Search },
    { title: "My Bids", url: "/app/bids", icon: Gavel },
    { title: "Messages", url: "/app/messages", icon: MessageSquare },
    { title: "Documents", url: "/app/documents", icon: FileText },
    { title: "Freight Payments", url: "/app/freight-payments", icon: DollarSign },
    { title: "Subscription", url: "/app/billing", icon: CreditCard },
    { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
    { title: "Carrier Profile", url: "/app/carrier-profile", icon: Truck },
    { title: "Settings", url: "/app/settings", icon: Settings },
  ];

  const adminMenuItems = [
    { title: "Admin Dashboard", url: "/app/admin/dashboard", icon: Activity },
    { title: "User Management", url: "/app/admin/users", icon: Users },
    { title: "Dispute Resolution", url: "/app/admin/disputes", icon: AlertCircle },
    { title: "Platform Metrics", url: "/app/admin/metrics", icon: BarChart3 },
    { title: "All Loads", url: "/app/admin/loads", icon: Package },
    { title: "All Payments", url: "/app/admin/payments", icon: CreditCard },
  ];

  const getMenuItems = () => {
    if (roleData?.isAdmin) return adminMenuItems;
    if (roleData?.isCarrier) return carrierMenuItems;
    if (roleData?.isShipper) return shipperMenuItems;
    return shipperMenuItems; // Default
  };

  const getRoleLabel = () => {
    if (roleData?.isAdmin) return "Admin";
    if (roleData?.isCarrier) return "Carrier";
    if (roleData?.isShipper) return "Shipper";
    return "User";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/30">
        <Sidebar className="border-r border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/40 backdrop-blur-xl">
          <SidebarHeader className="p-5">
            <div className="flex items-center gap-3 px-1">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full" />
                <img src={logo} alt="Ship AI" className="h-9 w-auto relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-foreground">Ship AI</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{getRoleLabel()} Workspace</span>
              </div>
            </div>
          </SidebarHeader>

          <Separator className="bg-black/5 dark:bg-white/5 mx-4 w-auto" />

          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-4 mb-2">Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getMenuItems().map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="group/item">
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 group-hover/item:pl-4"
                          activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary pl-4"
                        >
                          <item.icon className="h-4 w-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                          <span className="flex-1">{item.title}</span>
                          {item.title === "Messages" && (unreadCount || 0) > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white shadow-sm ring-1 ring-white dark:ring-black">
                              {(unreadCount || 0) > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-black/20">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="w-full text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden bg-background transition-colors duration-300">
          <header className="h-14 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-2" />
            <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
          </header>

          <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Spotlight/Glow Effect for Dashboard content */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
