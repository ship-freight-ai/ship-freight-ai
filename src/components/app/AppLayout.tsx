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

export const AppLayout = () => {
  const { data: roleData } = useUserRole();
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
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Ship AI" className="h-14 w-auto" />
              <div>
                <h2 className="font-semibold text-sm">Ship AI</h2>
                <Badge variant="secondary" className="text-xs">{getRoleLabel()}</Badge>
              </div>
            </div>
          </SidebarHeader>

          <Separator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getMenuItems().map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 hover:bg-accent/50 transition-colors"
                          activeClassName="bg-accent text-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b bg-card flex items-center px-4 gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Ship AI Platform</h1>
          </header>
          
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
