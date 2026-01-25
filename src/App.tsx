import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { NotificationProvider } from '@/hooks/useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { RoleBasedRedirect } from '@/components/RoleBasedRedirect';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionProtectedRoute from '@/components/SubscriptionProtectedRoute';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import CookieConsent from '@/components/CookieConsent';
import { isVanguardDomain, isSafeSuiteDomain } from '@/utils/subdomain';
import { SafeSuiteSubdomainRoutes } from '@/components/SubdomainRouter';
import { VanguardLayout } from '@/components/vanguard/VanguardLayout';
import { getVanguardProtectedRoutes, getVanguardPublicRoutes } from '@/routes/vanguardRoutes';

// SafeSuite imports
import SafeSuiteLayout from '@/layouts/SafeSuiteLayout';
import SafeSuiteLanding from '@/pages/safesuite/SafeSuiteLanding';
import SafeSuiteAuth from '@/pages/safesuite/SafeSuiteAuth';
import SafeSuiteDashboard from '@/pages/safesuite/SafeSuiteDashboard';
import SafeSuiteBilling from '@/pages/safesuite/SafeSuiteBilling';
import SafeSuiteSettings from '@/pages/safesuite/SafeSuiteSettings';
import SafeSuitePass from '@/pages/safesuite/SafeSuitePass';
import SafeSuiteScan from '@/pages/safesuite/SafeSuiteScan';
import SafeSuiteWeb from '@/pages/safesuite/SafeSuiteWeb';
import SafeSuiteTrack from '@/pages/safesuite/SafeSuiteTrack';
import SafePassSettings from '@/pages/safesuite/SafePassSettings';
import SafePassReminders from '@/pages/safesuite/SafePassReminders';
import SafePassBreach from '@/pages/safesuite/SafePassBreach';
import SafePassShared from '@/pages/safesuite/SafePassShared';
import SafePassEmergency from '@/pages/safesuite/SafePassEmergency';
import SafePassExtension from '@/pages/safesuite/SafePassExtension';
import SafeScanSettings from '@/pages/safesuite/SafeScanSettings';
import SafeWebSettings from '@/pages/safesuite/SafeWebSettings';
import SafeTrackSettings from '@/pages/safesuite/SafeTrackSettings';
import ForgotPasswordPage from '@/pages/safesuite/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/safesuite/ResetPasswordPage';
import MFARecoveryPage from '@/pages/safesuite/MFARecoveryPage';
import SafePassProduct from '@/pages/safesuite/products/SafePassProduct';
import SafeScanProduct from '@/pages/safesuite/products/SafeScanProduct';
import SafeWebProduct from '@/pages/safesuite/products/SafeWebProduct';
import SafeTrackProduct from '@/pages/safesuite/products/SafeTrackProduct';
import Index from '@/pages/Index';
import { Agent } from '@/pages/Agent';
import Reports from '@/pages/Reports';
import Analytics from '@/pages/Analytics';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import ProductHub from '@/pages/ProductHub';
import GPTChat from '@/pages/GPTChat';
import NotFound from '@/pages/NotFound';
import ProfilePage from '@/pages/ProfilePage';

import Pricing from '@/pages/Pricing';
import MSPPricing from '@/pages/MSPPricing';
import UltriumGPT from '@/pages/UltriumGPT';
import Solutions from '@/pages/Solutions';
import LiveDemos from '@/pages/LiveDemos';

import ProductsPage from '@/pages/ProductsPage';
import Docs from '@/pages/Docs';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Security from '@/pages/Security';
import SmallBusiness from '@/pages/SmallBusiness';
import MediumBusiness from '@/pages/MediumBusiness';
import Enterprise from '@/pages/Enterprise';
import MSPs from '@/pages/MSPs';
import MSPSolutions from '@/pages/MSPSolutions';
import BusinessSolutions from '@/pages/BusinessSolutions';
import TegrityDashboardPage from '@/pages/TegrityDashboardPage';
import KaseyaDashboardPage from '@/pages/KaseyaDashboardPage';
import QuickBooksDashboardPage from '@/pages/QuickBooksDashboardPage';
import PSATicketingPage from '@/pages/PSATicketingPage';
import RMMScriptPage from '@/pages/RMMScriptPage';
import MSSPs from '@/pages/MSSPs';
import CreditsPurchase from '@/pages/CreditsPurchase';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import Features from '@/pages/Features';
import Profile from '@/pages/Profile';
import Blog from '@/pages/Blog';
import Documentation from '@/pages/Documentation';
import OnboardingFlow from '@/components/OnboardingFlow';
import SafeScanDemoPage from '@/pages/demos/SafeScanDemoPage';

import { SafeShieldApp } from '@/components/apps/SafeShieldApp';
import SafePassDemoPage from '@/pages/demos/SafePassDemoPage';
import SafeScoreDemoPage from '@/pages/demos/SafeScoreDemoPage';
import SafeNetDemoPage from '@/pages/demos/SafeNetDemoPage';
import VanguardDemoPage from '@/pages/demos/VanguardDemoPage';
import UltriumGPTDemoPage from '@/pages/demos/UltriumGPTDemoPage';
import CustomGPTBuilderDemoPage from '@/pages/demos/CustomGPTBuilderDemoPage';
import DarkWebDemoPage from '@/pages/demos/DarkWebDemoPage';
import RMMDemoPage from '@/pages/demos/RMMDemoPage';
import TicketingDemoPage from '@/pages/demos/TicketingDemoPage';
import AntivirusDemoPage from '@/pages/demos/AntivirusDemoPage';
import SafeMDRDemoPage from '@/pages/demos/SafeMDRDemoPage';
import SafeCenterDemoPage from '@/pages/demos/SafeCenterDemoPage';
import SafeLinkDemoPage from '@/pages/demos/SafeLinkDemoPage';
import SafeMailDemoPage from '@/pages/demos/SafeMailDemoPage';
import SafeDocDemoPage from '@/pages/demos/SafeDocDemoPage';
import SafeKBDemoPage from '@/pages/demos/SafeKBDemoPage';
import SafeSOCDemoPage from '@/pages/demos/SafeSOCDemoPage';
import SafeMailEmbedDemo from '@/pages/SafeMailEmbedDemo';
import SecuritySuitePage from '@/pages/products/SecuritySuitePage';
import OperationsSuitePage from '@/pages/products/OperationsSuitePage';
import HelpdeskPage from '@/pages/products/HelpdeskPage';
import RMMPage from '@/pages/products/RMMPage';
import SafeSuiteFeatures from '@/pages/safesuite/SafeSuiteFeatures';

// SafePass Standalone App
import SafePassLayout from '@/layouts/SafePassLayout';
import SafePassLanding from '@/pages/safepass/SafePassLanding';
import SafePassAuth from '@/pages/safepass/SafePassAuth';
import SafePassAppDashboard from '@/pages/safepass/SafePassDashboard';
import SafePassImport from '@/pages/safepass/SafePassImport';
import SafePassExport from '@/pages/safepass/SafePassExport';
import SafePassSecurity from '@/pages/safepass/SafePassSecurity';
import SafePassBreachMonitor from '@/pages/safepass/SafePassBreachMonitor';

import SafeScorePage from '@/pages/products/SafeScorePage';
import SafeNetPage from '@/pages/products/SafeNetPage';
import TicketingPage from '@/pages/products/TicketingPage';
import AntivirusPage from '@/pages/products/AntivirusPage';
import SafeMDRPage from '@/pages/products/SafeMDRPage';
import AdvancedHelpdeskAdmin from '@/pages/admin/AdvancedHelpdeskAdmin';
import VanguardSubscriptionAdmin from '@/pages/admin/VanguardSubscriptionAdmin';
import SafeSuiteAdminCenter from '@/pages/admin/SafeSuiteAdminCenter';
import EmbedDemo from '@/pages/EmbedDemo';
import SafeDocEmbedDemo from '@/pages/SafeDocEmbedDemo';
import MSPDemos from '@/pages/MSPDemos';
import HelpdeskFeedback from '@/pages/helpdesk/HelpdeskFeedback';
import MSPControlCenter from '@/pages/MSPDashboard';
import MSPSecurityDashboard from '@/pages/MSPSecurityDashboard';
import MSPDashboardPage from '@/pages/MSPDashboardPage';
import MSPOnboardingPage from '@/pages/MSPOnboardingPage';
import MSPBillingPage from '@/pages/MSPBillingPage';
import MSPReportingPage from '@/pages/MSPReportingPage';
import ClientPortalDashboard from '@/pages/client/ClientPortalDashboard';
import ClientTicketsPage from '@/pages/client/ClientTicketsPage';
import ClientBillingPage from '@/pages/client/ClientBillingPage';
import SafeNetConnectorPage from '@/pages/SafeNetConnectorPage';
import SafeNetMSPPage from '@/pages/SafeNetMSPPage';
import SafeNetMobilePage from '@/pages/SafeNetMobilePage';
import SafeSIEM from '@/pages/SafeSIEM';
import SafeSIEMAlertRules from '@/pages/SafeSIEMAlertRules';
import SafeSIEMIncidents from '@/pages/SafeSIEMIncidents';
import SafeSIEMAnalytics from '@/pages/SafeSIEMAnalytics';
import UltriumVanguard from '@/pages/UltriumVanguard';
import VanguardDashboard from '@/pages/VanguardDashboard';
import VanguardDevices from '@/pages/VanguardDevices';
import VanguardDeviceDetail from '@/pages/VanguardDeviceDetail';
import VanguardSetup from '@/pages/VanguardSetup';
import SecurityPolicy from '@/pages/SecurityPolicy';
import SafeWebDashboard from '@/pages/SafeWebDashboard';
import SafeWebMSPDashboard from '@/pages/SafeWebMSPDashboard';
import SafeShield from '@/pages/SafeShield';
import { SafeShieldDashboard } from '@/components/shield/SafeShieldDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import TechnicianMobile from '@/pages/TechnicianMobile';
import SecurityAI from '@/pages/SecurityAI';
import AIStudio from '@/pages/AIStudio';
import SafeTrackPage from '@/pages/SafeTrackPage';
import BusinessBillingPage from '@/pages/BusinessBillingPage';
import BusinessBilling from '@/pages/BusinessBilling';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentCancel from '@/pages/PaymentCancel';
import { VoiceAssistantProvider } from '@/components/voice/VoiceAssistantProvider';
import { CustomerPortal } from '@/pages/CustomerPortal';
import { ClientLogin } from '@/pages/ClientLogin';
import { AuthProvider } from '@/hooks/useAuth';
import AssetManagementPage from '@/pages/AssetManagementPage';
import PatchManagementPage from '@/pages/PatchManagementPage';
import RemoteAccessPage from '@/pages/RemoteAccessPage';
import MonitoringPage from '@/pages/MonitoringPage';
import TicketManagementPage from '@/pages/TicketManagementPage';
import ClientPortalPage from '@/pages/ClientPortalPage';
import BillingPage from '@/pages/BillingPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

import { UnifiedAIAssistant } from '@/components/UnifiedAIAssistant';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

function AppRouter() {
  const { user, loading } = useAuth();
  const { getRedirectPath, shouldRedirectToRole } = useRoleBasedRedirect();
  const location = useLocation();
  const [isAIMinimized, setIsAIMinimized] = useState(true);
  const { trackPageView, identifyUser } = useAnalytics();
  useScrollToTop();
  
  // Check if we're on subdomains
  const isVanguard = isVanguardDomain();
  const isSafeSuite = isSafeSuiteDomain();

  // Track page views
  useEffect(() => {
    trackPageView(document.title, window.location.href);
  }, [location.pathname, trackPageView]);

  // Identify user for analytics
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.email,
        created_at: user.created_at,
      });
    }
  }, [user, identifyUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Determine AI context and source based on current page
  const getAIContext = () => {
    if (location.pathname.includes('security') || location.pathname.includes('safescan') || location.pathname.includes('safeshield')) return 'security';
    if (location.pathname.includes('helpdesk') || location.pathname.includes('admin')) return 'helpdesk';
    if (location.pathname.includes('rmm') || location.pathname.includes('technician')) return 'rmm';
    return 'dashboard';
  };

  const getAIDefaultSource = () => {
    if (location.pathname.includes('security') || location.pathname.includes('safescan') || location.pathname.includes('safeshield')) return 'security';
    if (location.pathname.includes('helpdesk') || location.pathname.includes('admin')) return 'helpdesk';
    if (location.pathname.includes('rmm') || location.pathname.includes('technician')) return 'rmm';
    if (location.pathname.includes('safescan')) return 'safescan';
    return 'ultrium';
  };

  // If on SafeSuite subdomain (safesuite.ultriumai.com), render SafeSuite-specific routes
  if (isSafeSuite) {
    return (
      <EnhancedErrorBoundary context="SafeSuite Application" level="critical">
        <SafeSuiteSubdomainRoutes />
        <CookieConsent />
      </EnhancedErrorBoundary>
    );
  }

  // If on Vanguard subdomain, render Vanguard-specific routes
  if (isVanguard) {
    return (
      <EnhancedErrorBoundary context="Vanguard Application" level="critical">
        <Routes>
          {/* Public routes without layout (landing, auth) */}
          {getVanguardPublicRoutes()}
          {/* Protected routes with layout */}
          <Route path="/app" element={<VanguardLayout />}>
            {getVanguardProtectedRoutes()}
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
        <CookieConsent />
      </EnhancedErrorBoundary>
    );
  }

  return (
    <EnhancedErrorBoundary context="Application Root" level="critical">
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Vanguard Public Routes (auth page) */}
        {getVanguardPublicRoutes()
          .filter((route) => Boolean(route.props.path))
          .map((route) => (
            <Route
              key={`vanguard-public-${route.props.path}`}
              path={`/vanguard/${route.props.path}`}
              element={route.props.element}
            />
          ))}
        
        {/* Vanguard Protected Routes (inside layout) */}
        <Route path="/vanguard" element={<VanguardLayout />}>
          {getVanguardProtectedRoutes()}
        </Route>
        <Route path="/agent" element={<Agent />} />
        <Route path="/auth" element={user ? <RoleBasedRedirect /> : <AuthPage />} />
        <Route path="/hub" element={
          <ProtectedRoute>
            <ProductHub />
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/msp-pricing" element={<MSPPricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/credits" element={<CreditsPurchase />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/security" element={<SecurityPolicy />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingFlow />
          </ProtectedRoute>
        } />
        {/* UltriumGPT Platform */}
        <Route path="/ultrium-gpt" element={
          <ProtectedRoute>
            <UltriumGPT />
          </ProtectedRoute>
        } />
        <Route path="/small-business" element={<SmallBusiness />} />
        <Route path="/medium-business" element={<MediumBusiness />} />
        <Route path="/enterprise" element={<Enterprise />} />
        <Route path="/msps" element={<MSPs />} />
        <Route path="/msp-solutions" element={<MSPSolutions />} />
        <Route path="/business-solutions" element={<BusinessSolutions />} />
        <Route path="/tegrity-dashboard" element={<TegrityDashboardPage />} />
        <Route path="/kaseya-dashboard" element={<KaseyaDashboardPage />} />
        <Route path="/quickbooks-dashboard" element={<QuickBooksDashboardPage />} />
        <Route path="/psa-ticketing" element={<PSATicketingPage />} />
        <Route path="/rmm-scripts" element={<RMMScriptPage />} />
        <Route path="/msp-onboarding" element={
          <SubscriptionProtectedRoute requiresPremium>
            <MSPOnboardingPage />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-billing" element={
          <SubscriptionProtectedRoute requiresPremium>
            <MSPBillingPage />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-reporting" element={
          <SubscriptionProtectedRoute requiresPremium>
            <MSPReportingPage />
          </SubscriptionProtectedRoute>
        } />
        
        {/* Client Portal Routes */}
        <Route path="/client" element={<ClientPortalDashboard />} />
        <Route path="/client/tickets" element={<ClientTicketsPage />} />
        <Route path="/client/billing" element={<ClientBillingPage />} />
        
        {/* Helpdesk Feedback Route (Public - for email links) */}
        <Route path="/helpdesk/feedback" element={<HelpdeskFeedback />} />
        
        <Route path="/mssps" element={<MSSPs />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/demos" element={<LiveDemos />} />
        <Route path="/portfolio" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/msp-demos" element={<MSPDemos />} />
          <Route path="/msp-control-center" element={
            <SubscriptionProtectedRoute requiresPremium>
              <MSPDashboardPage />
            </SubscriptionProtectedRoute>
          } />
          <Route path="/msp-security-dashboard" element={
            <SubscriptionProtectedRoute requiresPremium>
              <MSPSecurityDashboard />
            </SubscriptionProtectedRoute>
          } />
          <Route path="/msp-dashboard" element={
            <SubscriptionProtectedRoute requiresPremium>
              <MSPDashboardPage />
            </SubscriptionProtectedRoute>
          } />
        <Route path="/docs" element={
          <ProtectedRoute>
            <Docs />
          </ProtectedRoute>
        } />
        <Route path="/demos/safescan" element={<SafeScanDemoPage />} />
        <Route path="/demos/safepass" element={<SafePassDemoPage />} />
        <Route path="/demos/ultriumgpt" element={<UltriumGPTDemoPage />} />
        <Route path="/demos/custom-gpt-builder" element={<CustomGPTBuilderDemoPage />} />
        <Route path="/demos/safescore" element={<SafeScoreDemoPage />} />
        <Route path="/products/safescore" element={<SafeScorePage />} />
        <Route path="/products/security" element={<SecuritySuitePage />} />
        <Route path="/products/operations" element={<OperationsSuitePage />} />
        <Route path="/products/helpdesk" element={<HelpdeskPage />} />
        <Route path="/products/rmm" element={<RMMPage />} />
        <Route path="/products/safetrack" element={<SafeTrackProduct />} />
        <Route path="/products/safepass" element={<SafePassProduct />} />
        <Route path="/products/safeweb" element={<SafeWebProduct />} />
        <Route path="/products/safescan" element={<SafeScanProduct />} />
        <Route path="/safesuite/products/safetrack" element={<SafeTrackProduct />} />
        <Route path="/safesuite/products/safepass" element={<SafePassProduct />} />
        <Route path="/safesuite/products/safeweb" element={<SafeWebProduct />} />
        <Route path="/safesuite/products/safescan" element={<SafeScanProduct />} />
        <Route path="/demos/safenet" element={<SafeNetDemoPage />} />
        <Route path="/demos/safeintel" element={<DarkWebDemoPage />} />
        <Route path="/demos/rmm" element={<RMMDemoPage />} />
        <Route path="/demos/ticketing" element={<TicketingDemoPage />} />
        <Route path="/demos/antivirus" element={<AntivirusDemoPage />} />
        <Route path="/demos/safemdr" element={<SafeMDRDemoPage />} />
        <Route path="/demos/safescan" element={<SafeScanDemoPage />} />
        <Route path="/demos/safelink" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/demos/safemail" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/demos/safedoc" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/products/safelink" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/products/safemail" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/products/safedoc" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/safesuite/features" element={<SafeSuiteFeatures />} />
        <Route path="/demos/safeshield" element={<AntivirusDemoPage />} />
        <Route path="/demos/safecenter" element={<SafeCenterDemoPage />} />
        <Route path="/demos/safekb" element={<SafeKBDemoPage />} />
        <Route path="/demos/safesoc" element={<SafeSOCDemoPage />} />
        <Route path="/embed-demo" element={<EmbedDemo />} />
        <Route path="/safedoc-embed-demo" element={<SafeDocEmbedDemo />} />
        <Route path="/safemail-embed-demo" element={<SafeMailEmbedDemo />} />
        
        {/* SafeNet App Routes */}
        <Route path="/safenet-connector" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeNetConnectorPage />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safenet-msp-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeNetMSPPage />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safenet-mobile" element={<SafeNetMobilePage />} />
        <Route path="/technician-mobile" element={<TechnicianMobile />} />
        <Route path="/safeshield" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeShieldApp />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeSIEM />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/alert-rules" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeSIEMAlertRules />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/incidents" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeSIEMIncidents />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/analytics" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeSIEMAnalytics />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/ultrium-vanguard" element={<UltriumVanguard />} />
        <Route path="/vanguard-dashboard" element={<Navigate to="/vanguard/dashboard" replace />} />
        
        {/* Reports & Analytics Routes */}
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/chat/:gptId" element={
          <ProtectedRoute>
            <GPTChat />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile-old" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/subscriptions" element={
          <ProtectedRoute>
            <VanguardSubscriptionAdmin />
          </ProtectedRoute>
        } />
        <Route path="/admin/safesuite" element={
          <ProtectedRoute>
            <SafeSuiteAdminCenter />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safeshield" element={
          <ProtectedRoute>
            <SafeShieldApp />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/security-center" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safepass" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safekb" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safescan" element={
          <ProtectedRoute>
            <Navigate to="/safesuite/features" replace />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safenet" element={
          <ProtectedRoute>
            <SafeNetConnectorPage />
          </ProtectedRoute>
        } />
        <Route path="/security-ai" element={
          <ProtectedRoute>
            <SecurityAI />
          </ProtectedRoute>
        } />
        <Route path="/ai-studio" element={
          <ProtectedRoute>
            <AIStudio />
          </ProtectedRoute>
        } />
        <Route path="/safetrack" element={
          <ProtectedRoute>
            <SafeTrackPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/msp/billing" element={
          <SubscriptionProtectedRoute requiresPremium>
            <MSPBillingPage />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/business-billing" element={
          <ProtectedRoute>
            <BusinessBilling />
          </ProtectedRoute>
        } />
        <Route path="/assets" element={
          <ProtectedRoute>
            <AssetManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/patches" element={
          <ProtectedRoute>
            <PatchManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/remote-access" element={
          <ProtectedRoute>
            <RemoteAccessPage />
          </ProtectedRoute>
        } />
        <Route path="/monitoring" element={
          <ProtectedRoute>
            <MonitoringPage />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <TicketManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/client-portal" element={
          <ProtectedRoute>
            <ClientPortalPage />
          </ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />
        
        {/* Payment Success/Cancel Routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        
        {/* Customer Portal Routes */}
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/portal/client/:clientId" element={<CustomerPortal />} />
        
        {/* SafePass Standalone App Routes */}
        <Route path="/safepass-app" element={<SafePassLanding />} />
        <Route path="/safepass-app/auth" element={<SafePassAuth />} />
        <Route path="/safepass-app/portal" element={<SafePassLayout />}>
          <Route index element={<SafePassAppDashboard />} />
          <Route path="import" element={<SafePassImport />} />
          <Route path="security" element={<SafePassSecurity />} />
          <Route path="breach-monitor" element={<SafePassBreachMonitor />} />
        </Route>
        
        {/* SafeSuite Portal Routes */}
        <Route path="/safesuite" element={<SafeSuiteLanding />} />
        <Route path="/safesuite/auth" element={<SafeSuiteAuth />} />
        <Route path="/safesuite/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/safesuite/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/safesuite/auth/mfa-recovery" element={<MFARecoveryPage />} />
        <Route element={
          <ProtectedRoute>
            <SafeSuiteLayout />
          </ProtectedRoute>
        }>
          <Route path="/safesuite/dashboard" element={<SafeSuiteDashboard />} />
          <Route path="/safesuite/pass" element={<SafeSuitePass />} />
          <Route path="/safesuite/pass/shared" element={<SafePassShared />} />
          <Route path="/safesuite/pass/emergency" element={<SafePassEmergency />} />
          <Route path="/safesuite/pass/extension" element={<SafePassExtension />} />
          <Route path="/safesuite/pass/import" element={<SafePassImport />} />
          <Route path="/safesuite/pass/export" element={<SafePassExport />} />
          <Route path="/safesuite/pass/reminders" element={<SafePassReminders />} />
          <Route path="/safesuite/pass/breach" element={<SafePassBreach />} />
          <Route path="/safesuite/pass/settings" element={<SafePassSettings />} />
          <Route path="/safesuite/scan" element={<SafeSuiteScan />} />
          <Route path="/safesuite/scan/settings" element={<SafeScanSettings />} />
          <Route path="/safesuite/web" element={<SafeSuiteWeb />} />
          <Route path="/safesuite/web/settings" element={<SafeWebSettings />} />
          <Route path="/safesuite/track" element={<SafeSuiteTrack />} />
          <Route path="/safesuite/track/settings" element={<SafeTrackSettings />} />
          <Route path="/safesuite/billing" element={<SafeSuiteBilling />} />
          <Route path="/safesuite/settings" element={<SafeSuiteSettings />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global AI Assistant - Available on authenticated dashboard and MSP pages */}
      {user && location.pathname !== '/' && (
        location.pathname.startsWith('/dashboard') || 
        location.pathname.startsWith('/msp-') ||
        location.pathname.includes('security') ||
        location.pathname.includes('admin')
      ) && (
        <UnifiedAIAssistant
          isMinimized={isAIMinimized}
          onToggleMinimize={() => setIsAIMinimized(!isAIMinimized)}
          defaultSource={getAIDefaultSource() as any}
          context={getAIContext()}
        />
      )}
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </EnhancedErrorBoundary>
  );
}

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  // Ensure page starts at top on initial load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <EnhancedErrorBoundary context="Application Root" level="critical">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <VoiceAssistantProvider>
                <Router>
                  <AppRouter />
                  
                  <Toaster />
                </Router>
              </VoiceAssistantProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </EnhancedErrorBoundary>
    </ThemeProvider>
  );
}