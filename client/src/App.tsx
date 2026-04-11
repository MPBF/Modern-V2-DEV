import { lazy, Suspense } from "react";
import { Route, Switch, Redirect } from "wouter";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useTranslation } from "react-i18next";
import InstallPrompt from "./components/pwa/InstallPrompt";
import { MobileAutoRedirect } from "./hooks/use-mobile-redirect";

function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: any) => {
      const isChunkError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("Loading CSS chunk") ||
        error?.name === "ChunkLoadError";

      if (isChunkError) {
        const reloadKey = "chunk_reload_" + window.location.pathname;
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
          return new Promise(() => {});
        }
      }

      throw error;
    })
  );
}

const Dashboard = lazyWithRetry(() => import("./pages/dashboard"));
const Orders = lazyWithRetry(() => import("./pages/orders"));
const Production = lazyWithRetry(() => import("./pages/production"));
const ProductionOrdersManagement = lazyWithRetry(() => import("./pages/ProductionOrdersManagement"));
const ProductionQueues = lazyWithRetry(() => import("./pages/ProductionQueues"));
const Quality = lazyWithRetry(() => import("./pages/quality"));
const Warehouse = lazyWithRetry(() => import("./pages/warehouse"));
const Maintenance = lazyWithRetry(() => import("./pages/maintenance"));
const HR = lazyWithRetry(() => import("./pages/hr"));
const Reports = lazyWithRetry(() => import("./pages/reports"));
const Settings = lazyWithRetry(() => import("./pages/settings"));
const Definitions = lazyWithRetry(() => import("./pages/definitions"));
const UserDashboard = lazyWithRetry(() => import("./pages/user-dashboard"));
const NotFound = lazyWithRetry(() => import("./pages/not-found"));
const Notifications = lazyWithRetry(() => import("./pages/notifications"));
const AlertsCenter = lazyWithRetry(() => import("./pages/AlertsCenter"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const ProductionMonitoring = lazyWithRetry(() => import("./pages/production-monitoring"));
const MetaWhatsAppSetup = lazyWithRetry(() => import("./pages/meta-whatsapp-setup"));
const WhatsAppSetup = lazyWithRetry(() => import("./pages/whatsapp-setup"));
const WhatsAppTest = lazyWithRetry(() => import("./pages/whatsapp-test"));
const WhatsAppTroubleshoot = lazyWithRetry(() => import("./pages/whatsapp-troubleshoot"));
const WhatsAppProductionSetup = lazyWithRetry(() => import("./pages/whatsapp-production-setup"));
const WhatsAppFinalSetup = lazyWithRetry(() => import("./pages/whatsapp-final-setup"));
const TwilioContentTemplate = lazyWithRetry(() => import("./pages/twilio-content-template"));
const WhatsAppTemplateTest = lazyWithRetry(() => import("./pages/whatsapp-template-test"));
const WhatsAppWebhooks = lazyWithRetry(() => import("./pages/whatsapp-webhooks"));
const ToolsPage = lazyWithRetry(() => import("./pages/tools_page"));
const FilmOperatorDashboard = lazyWithRetry(() => import("./pages/FilmOperatorDashboard"));
const PrintingOperatorDashboard = lazyWithRetry(() => import("./pages/PrintingOperatorDashboard"));
const CuttingOperatorDashboard = lazyWithRetry(() => import("./pages/CuttingOperatorDashboard"));
const ProductionDashboard = lazyWithRetry(() => import("./pages/ProductionDashboard"));
const RollSearch = lazyWithRetry(() => import("./pages/RollSearch"));
const ProductionReports = lazyWithRetry(() => import("./pages/ProductionReports"));
const SystemMonitoring = lazyWithRetry(() => import("./pages/system-monitoring"));
const AiAgent = lazyWithRetry(() => import("./pages/ai-agent"));
const AiAgentSettings = lazyWithRetry(() => import("./pages/ai-agent-settings"));
const FactorySimulation3D = lazyWithRetry(() => import("./pages/FactorySimulation3D"));
const CompanySetup = lazyWithRetry(() => import("./pages/company-setup"));
const DisplayScreen = lazyWithRetry(() => import("./pages/DisplayScreen"));
const DisplayControlPanel = lazyWithRetry(() => import("./pages/DisplayControlPanel"));
const FactoryFloor = lazyWithRetry(() => import("./pages/FactoryFloor"));
const MaterialMixing = lazyWithRetry(() => import("./pages/material-mixing"));
const WarehouseMobile = lazyWithRetry(() => import("./pages/warehouse-mobile"));
const ProductionMobile = lazyWithRetry(() => import("./pages/production-mobile"));
const UserDashboardMobile = lazyWithRetry(() => import("./pages/user-dashboard-mobile"));
const MyOrders = lazyWithRetry(() => import("./pages/my-orders"));
const OrdersMobile = lazyWithRetry(() => import("./pages/orders-mobile"));
const ProductionDashboardMobile = lazyWithRetry(() => import("./pages/production-dashboard-mobile"));
const McpSettings = lazyWithRetry(() => import("./pages/mcp-settings"));

function PageLoadingFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>جاري تحميل الصفحة...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <Redirect to="/" /> : <Login />}
        </Route>

        <Route path="/setup">
          <CompanySetup />
        </Route>
        <Route path="/tools">
          <ProtectedRoute path="/tools">
            <ToolsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/">
          <ProtectedRoute path="/">
            <Dashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/orders">
          <ProtectedRoute path="/orders">
            <MobileAutoRedirect path="/orders" />
            <Orders />
          </ProtectedRoute>
        </Route>

        <Route path="/my-orders">
          <ProtectedRoute path="/my-orders">
            <MyOrders />
          </ProtectedRoute>
        </Route>

        <Route path="/production">
          <ProtectedRoute path="/production">
            <MobileAutoRedirect path="/production" />
            <Production />
          </ProtectedRoute>
        </Route>

        {/* Redirects from old routes to Orders page with tabs */}
        <Route path="/production-orders-management">
          <Redirect to="/orders?tab=production-orders" />
        </Route>

        <Route path="/production-queues">
          <Redirect to="/orders?tab=production-queues" />
        </Route>

        <Route path="/roll-search">
          <Redirect to="/orders?tab=roll-search" />
        </Route>

        {/* Production Dashboard - Unified operators dashboard */}
        <Route path="/production-dashboard">
          <ProtectedRoute path="/production-dashboard">
            <MobileAutoRedirect path="/production-dashboard" />
            <ProductionDashboard />
          </ProtectedRoute>
        </Route>

        {/* Redirect old operator routes to new unified dashboard */}
        <Route path="/film-operator">
          <Redirect to="/production-dashboard" />
        </Route>

        <Route path="/printing-operator">
          <Redirect to="/production-dashboard" />
        </Route>

        <Route path="/cutting-operator">
          <Redirect to="/production-dashboard" />
        </Route>

        <Route path="/quality">
          <ProtectedRoute path="/quality">
            <Quality />
          </ProtectedRoute>
        </Route>

        <Route path="/warehouse">
          <ProtectedRoute path="/warehouse">
            <MobileAutoRedirect path="/warehouse" />
            <Warehouse />
          </ProtectedRoute>
        </Route>

        <Route path="/maintenance">
          <ProtectedRoute path="/maintenance">
            <Maintenance />
          </ProtectedRoute>
        </Route>

        <Route path="/hr">
          <ProtectedRoute path="/hr">
            <HR />
          </ProtectedRoute>
        </Route>

        <Route path="/reports">
          <ProtectedRoute path="/reports">
            <Reports />
          </ProtectedRoute>
        </Route>

        <Route path="/production-reports">
          <Redirect to="/orders?tab=production-reports" />
        </Route>

        <Route path="/settings">
          <ProtectedRoute path="/settings">
            <Settings />
          </ProtectedRoute>
        </Route>

        <Route path="/definitions">
          <ProtectedRoute path="/definitions">
            <Definitions />
          </ProtectedRoute>
        </Route>

        <Route path="/user-dashboard">
          <ProtectedRoute path="/user-dashboard">
            <MobileAutoRedirect path="/user-dashboard" />
            <UserDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/notifications">
          <ProtectedRoute path="/notifications">
            <Notifications />
          </ProtectedRoute>
        </Route>

        <Route path="/alerts">
          <ProtectedRoute path="/alerts">
            <AlertsCenter />
          </ProtectedRoute>
        </Route>

        <Route path="/system-health">
          <ProtectedRoute path="/system-health">
            <SystemHealth />
          </ProtectedRoute>
        </Route>

        <Route path="/production-monitoring">
          <ProtectedRoute path="/production-monitoring">
            <ProductionMonitoring />
          </ProtectedRoute>
        </Route>

        <Route path="/meta-whatsapp-setup">
          <ProtectedRoute path="/meta-whatsapp-setup">
            <MetaWhatsAppSetup />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-setup">
          <ProtectedRoute path="/whatsapp-setup">
            <WhatsAppSetup />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-test">
          <ProtectedRoute path="/whatsapp-test">
            <WhatsAppTest />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-troubleshoot">
          <ProtectedRoute path="/whatsapp-troubleshoot">
            <WhatsAppTroubleshoot />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-production-setup">
          <ProtectedRoute path="/whatsapp-production-setup">
            <WhatsAppProductionSetup />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-final-setup">
          <ProtectedRoute path="/whatsapp-final-setup">
            <WhatsAppFinalSetup />
          </ProtectedRoute>
        </Route>

        <Route path="/twilio-content">
          <ProtectedRoute path="/twilio-content">
            <TwilioContentTemplate />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-template-test">
          <ProtectedRoute path="/whatsapp-template-test">
            <WhatsAppTemplateTest />
          </ProtectedRoute>
        </Route>

        <Route path="/whatsapp-webhooks">
          <ProtectedRoute path="/whatsapp-webhooks">
            <WhatsAppWebhooks />
          </ProtectedRoute>
        </Route>

        <Route path="/system-monitoring">
          <ProtectedRoute path="/system-monitoring">
            <SystemMonitoring />
          </ProtectedRoute>
        </Route>

        <Route path="/ai-agent">
          <ProtectedRoute path="/ai-agent">
            <AiAgent />
          </ProtectedRoute>
        </Route>

        <Route path="/ai-agent-settings">
          <ProtectedRoute path="/ai-agent-settings">
            <AiAgentSettings />
          </ProtectedRoute>
        </Route>

        <Route path="/factory-simulation">
          <ProtectedRoute path="/factory-simulation">
            <FactorySimulation3D />
          </ProtectedRoute>
        </Route>

        <Route path="/display-screen">
          <DisplayScreen />
        </Route>

        <Route path="/display-control">
          <ProtectedRoute path="/display-control">
            <DisplayControlPanel />
          </ProtectedRoute>
        </Route>

        <Route path="/factory-floor">
          <ProtectedRoute path="/factory-floor">
            <FactoryFloor />
          </ProtectedRoute>
        </Route>

        <Route path="/material-mixing">
          <ProtectedRoute path="/material-mixing">
            <MaterialMixing />
          </ProtectedRoute>
        </Route>

        <Route path="/warehouse-mobile">
          <ProtectedRoute path="/warehouse-mobile">
            <WarehouseMobile />
          </ProtectedRoute>
        </Route>

        <Route path="/production-mobile">
          <ProtectedRoute path="/production-mobile">
            <ProductionMobile />
          </ProtectedRoute>
        </Route>

        <Route path="/user-dashboard-mobile">
          <ProtectedRoute path="/user-dashboard-mobile">
            <UserDashboardMobile />
          </ProtectedRoute>
        </Route>

        <Route path="/orders-mobile">
          <ProtectedRoute path="/orders-mobile">
            <OrdersMobile />
          </ProtectedRoute>
        </Route>

        <Route path="/production-dashboard-mobile">
          <ProtectedRoute path="/production-dashboard-mobile">
            <ProductionDashboardMobile />
          </ProtectedRoute>
        </Route>

        <Route path="/mcp-settings">
          <ProtectedRoute path="/mcp-settings">
            <McpSettings />
          </ProtectedRoute>
        </Route>

        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary fallback="page" showReload>
      <AuthProvider>
        <AppRoutes />
        <InstallPrompt />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
