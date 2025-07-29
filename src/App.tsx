import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { NotificationProvider } from '@/hooks/useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';
import { RoleBasedRedirect } from '@/components/RoleBasedRedirect';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionProtectedRoute from '@/components/SubscriptionProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import CookieConsent from '@/components/CookieConsent';
import Index from '@/pages/Index';
import { Agent } from '@/pages/Agent';
import Reports from '@/pages/Reports';
import Analytics from '@/pages/Analytics';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import GPTChat from '@/pages/GPTChat';
import NotFound from '@/pages/NotFound';
import ProfilePage from '@/pages/ProfilePage';

import Pricing from '@/pages/Pricing';
import MSPPricing from '@/pages/MSPPricing';
import UltriumGPT from '@/pages/UltriumGPT';
import Solutions from '@/pages/Solutions';
import LiveDemos from '@/pages/LiveDemos';
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
import SafeScanPage from '@/pages/SafeScanPage';
import { SafeShieldApp } from '@/components/apps/SafeShieldApp';
import SafePassDemoPage from '@/pages/demos/SafePassDemoPage';
import SafeScoreDemoPage from '@/pages/demos/SafeScoreDemoPage';
import SafeNetDemoPage from '@/pages/demos/SafeNetDemoPage';
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
import SafeLinkPage from '@/pages/products/SafeLinkPage';
import SafeDocPage from '@/pages/products/SafeDocPage';
import SafePassPage from '@/pages/products/SafePassPage';
import SafeWebPage from '@/pages/products/SafeWebPage';
import SafeScorePage from '@/pages/products/SafeScorePage';
import SafeNetPage from '@/pages/products/SafeNetPage';
import TicketingPage from '@/pages/products/TicketingPage';
import AntivirusPage from '@/pages/products/AntivirusPage';
import SafeMDRPage from '@/pages/products/SafeMDRPage';
import AdvancedHelpdeskAdmin from '@/pages/admin/AdvancedHelpdeskAdmin';
import EmbedDemo from '@/pages/EmbedDemo';
import SafeDocEmbedDemo from '@/pages/SafeDocEmbedDemo';
import MSPDemos from '@/pages/MSPDemos';
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
import SecurityDashboard from '@/pages/SecurityDashboard';
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

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/auth" element={user ? <RoleBasedRedirect /> : <Auth />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/msp-pricing" element={<MSPPricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/credits" element={<CreditsPurchase />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/security" element={<Security />} />
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
        <Route path="/mssps" element={<MSSPs />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/demos" element={<LiveDemos />} />
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
        <Route path="/demos/safenet" element={<SafeNetDemoPage />} />
        <Route path="/demos/safeintel" element={<DarkWebDemoPage />} />
        <Route path="/demos/rmm" element={<RMMDemoPage />} />
        <Route path="/demos/ticketing" element={<TicketingDemoPage />} />
        <Route path="/demos/antivirus" element={<AntivirusDemoPage />} />
        <Route path="/demos/safemdr" element={<SafeMDRDemoPage />} />
        <Route path="/demos/safescan" element={<SafeScanDemoPage />} />
        <Route path="/demos/safelink" element={<SafeScanDemoPage />} />
        <Route path="/demos/safemail" element={<SafeScanDemoPage />} />
        <Route path="/demos/safedoc" element={<SafeScanDemoPage />} />
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
        <Route path="/security-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SecurityDashboard />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safeweb-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeWebDashboard />
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safeweb-msp-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SafeWebMSPDashboard />
          </SubscriptionProtectedRoute>
        } />
        
        {/* Product Pages */}
        <Route path="/products/safescan" element={<SafeScanPage />} />
        <Route path="/products/safepass" element={<SafePassPage />} />
        <Route path="/products/safeweb" element={<SafeWebPage />} />
        <Route path="/products/safescore" element={<SafeScorePage />} />
        <Route path="/products/safenet" element={<SafeNetPage />} />
        <Route path="/products/ticketing" element={<TicketingPage />} />
        <Route path="/products/antivirus" element={<AntivirusPage />} />
        <Route path="/products/safemdr" element={<SafeMDRPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/helpdesk" element={
          <ProtectedRoute>
            <AdvancedHelpdeskAdmin />
          </ProtectedRoute>
        } />
        
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
            <SafeScanPage />
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
        
        {/* Payment Success/Cancel Routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        
        {/* Customer Portal Routes */}
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/portal/client/:clientId" element={<CustomerPortal />} />
        
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
    </ErrorBoundary>
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
  // Initialize dark mode as default on app startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Ensure page starts at top on initial load
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}