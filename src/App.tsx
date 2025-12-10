import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MagicCursor } from "@/components/ui/magic-cursor";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui/loading-spinner";

// Site pages (marketing)
import SiteHome from "./pages/site/Home";
import SitePricing from "./pages/site/Pricing";
import SiteRoles from "./pages/site/Roles";
import SiteTrust from "./pages/site/Trust";
import SiteAbout from "./pages/site/About";
import SiteAuth from "./pages/site/Auth";
import SiteROICalculator from "./pages/site/ROICalculatorPage";
import SiteTerms from "./pages/site/Terms";
import SitePrivacy from "./pages/site/Privacy";
import SiteContact from "./pages/site/Contact";

// App pages (dashboard)
import { AppLayout } from "./components/app/AppLayout";
import ShipperDashboard from "./pages/app/ShipperDashboard";
import CarrierDashboard from "./pages/app/CarrierDashboard";
import AdminDashboard from "./pages/app/AdminDashboard";
import AdminUserManagement from "./pages/app/admin/UserManagement";
import AdminDisputeResolution from "./pages/app/admin/DisputeResolution";
import AdminSubscriptionManagement from "./pages/app/admin/SubscriptionManagement";
import AppLoads from "./pages/app/Loads";
import AppLoadDetails from "./pages/app/LoadDetails";
import AppCarrierProfile from "./pages/app/CarrierProfile";
import AppCarriers from "./pages/app/Carriers";
import AppBids from "./pages/app/Bids";
import ShipperBids from "./pages/app/ShipperBids";
import AppMessages from "./pages/app/Messages";
import AppDocuments from "./pages/app/Documents";
import AppBilling from "./pages/app/Billing";
import AppFreightPayments from "./pages/app/FreightPayments";
import AppSettings from "./pages/app/Settings";
import AppIntegrations from "./pages/app/Integrations";
import AppAITools from "./pages/app/AITools";
import AppAnalytics from "./pages/app/Analytics";

// Onboarding pages
import OnboardingCheckStatus from "./pages/app/onboarding/CheckStatus";
import OnboardingSelectPlan from "./pages/app/onboarding/SelectPlan";
import OnboardingTrialStarted from "./pages/app/onboarding/TrialStarted";
import ClaimSeat from "./pages/app/ClaimSeat";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <ScrollProgress />
          <ScrollToTop />
          <MagicCursor />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <BrowserRouter>
                <Routes>
                  {/* Site routes (marketing) */}
                  <Route path="/" element={<Navigate to="/site" replace />} />
                  <Route path="/site" element={<SiteHome />} />
                  <Route path="/site/pricing" element={<SitePricing />} />
                  <Route path="/site/roles" element={<SiteRoles />} />
                  <Route path="/site/trust" element={<SiteTrust />} />
                  <Route path="/site/about" element={<SiteAbout />} />
                  <Route path="/site/roi-calculator" element={<SiteROICalculator />} />
                  <Route path="/site/auth" element={<SiteAuth />} />
                  <Route path="/site/terms" element={<SiteTerms />} />
                  <Route path="/site/privacy" element={<SitePrivacy />} />
                  <Route path="/site/contact" element={<SiteContact />} />

                  {/* Protected app routes */}
                  <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    {/* Onboarding routes - don't require subscription */}
                    <Route path="onboarding/check-status" element={<OnboardingCheckStatus />} />
                    <Route path="onboarding/select-plan" element={<OnboardingSelectPlan />} />
                    <Route path="onboarding/trial-started" element={<OnboardingTrialStarted />} />
                    <Route path="claim-seat" element={<ClaimSeat />} />

                    {/* Dashboard routes - require subscription */}
                    <Route index element={<Navigate to="/app/onboarding/check-status" replace />} />
                    <Route path="dashboard/shipper" element={<ShipperDashboard />} />
                    <Route path="dashboard/carrier" element={<CarrierDashboard />} />

                    {/* Admin routes */}
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                    <Route path="admin/users" element={<AdminUserManagement />} />
                    <Route path="admin/disputes" element={<AdminDisputeResolution />} />
                    <Route path="admin/subscriptions" element={<AdminSubscriptionManagement />} />
                    <Route path="admin/metrics" element={<AdminDashboard />} />
                    <Route path="admin/loads" element={<AppLoads />} />
                    <Route path="admin/payments" element={<AppBilling />} />

                    {/* Shared routes */}
                    <Route path="loads" element={<AppLoads />} />
                    <Route path="loads/:loadId" element={<AppLoadDetails />} />
                    <Route path="carrier-profile" element={<AppCarrierProfile />} />
                    <Route path="carriers" element={<AppCarriers />} />
                    <Route path="bids" element={<AppBids />} />
                    <Route path="shipper-bids" element={<ShipperBids />} />
                    <Route path="messages" element={<AppMessages />} />
                    <Route path="documents" element={<AppDocuments />} />
                    <Route path="freight-payments" element={<AppFreightPayments />} />
                    <Route path="billing" element={<AppBilling />} />
                    <Route path="billing/success" element={<AppBilling />} />
                    <Route path="billing/canceled" element={<AppBilling />} />
                    <Route path="settings" element={<AppSettings />} />
                    <Route path="integrations" element={<AppIntegrations />} />
                    <Route path="ai-tools" element={<AppAITools />} />
                    <Route path="analytics" element={<AppAnalytics />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </Suspense>
          </ErrorBoundary>
        </SubscriptionProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
