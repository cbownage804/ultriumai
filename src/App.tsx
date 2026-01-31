import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, useState } from 'react';
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
import { PageSkeleton, LoadingSpinner } from '@/components/ui/PageSkeleton';

// Core pages (always loaded)
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';
import LegacyVanguardRedirect from '@/routes/LegacyVanguardRedirect';

// SafeSuite Layout imports (needed for nested routes)
import SafeSuiteLayout from '@/layouts/SafeSuiteLayout';
import SafePassLayout from '@/layouts/SafePassLayout';

// Lazy-loaded pages - Heavy dashboards and features
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProductHub = lazy(() => import('@/pages/ProductHub'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));
const StudioAssistant = lazy(() => import('@/pages/StudioAssistant'));
const GPTChat = lazy(() => import('@/pages/GPTChat'));
const GPTSettings = lazy(() => import('@/pages/GPTSettings'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Lazy-loaded - Vanguard pages
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevices = lazy(() => import('@/pages/VanguardDevices'));
const VanguardDeviceDetail = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
const UltriumVanguard = lazy(() => import('@/pages/UltriumVanguard'));
const VanguardAuthPage = lazy(() => import('@/pages/vanguard/VanguardAuthPage'));

// Lazy-loaded - MSP pages
const MSPDashboardPage = lazy(() => import('@/pages/MSPDashboardPage'));
const MSPSecurityDashboard = lazy(() => import('@/pages/MSPSecurityDashboard'));
const MSPBillingPage = lazy(() => import('@/pages/MSPBillingPage'));
const MSPReportingPage = lazy(() => import('@/pages/MSPReportingPage'));
const MSPOnboardingPage = lazy(() => import('@/pages/MSPOnboardingPage'));

// Lazy-loaded - SafeSuite pages
const SafeSuiteLanding = lazy(() => import('@/pages/safesuite/SafeSuiteLanding'));
const SafeSuiteAuth = lazy(() => import('@/pages/safesuite/SafeSuiteAuth'));
const SafeSuiteDashboard = lazy(() => import('@/pages/safesuite/SafeSuiteDashboard'));
const SafeSuiteBilling = lazy(() => import('@/pages/safesuite/SafeSuiteBilling'));
const SafeSuiteSettings = lazy(() => import('@/pages/safesuite/SafeSuiteSettings'));
const SafeSuitePass = lazy(() => import('@/pages/safesuite/SafeSuitePass'));
const SafeSuiteScan = lazy(() => import('@/pages/safesuite/SafeSuiteScan'));
const SafeSuiteWeb = lazy(() => import('@/pages/safesuite/SafeSuiteWeb'));
const SafeSuiteTrack = lazy(() => import('@/pages/safesuite/SafeSuiteTrack'));
const SafePassSettings = lazy(() => import('@/pages/safesuite/SafePassSettings'));
const SafePassReminders = lazy(() => import('@/pages/safesuite/SafePassReminders'));
const SafePassBreach = lazy(() => import('@/pages/safesuite/SafePassBreach'));
const SafePassShared = lazy(() => import('@/pages/safesuite/SafePassShared'));
const SafePassEmergency = lazy(() => import('@/pages/safesuite/SafePassEmergency'));
const SafePassExtension = lazy(() => import('@/pages/safesuite/SafePassExtension'));
const SafeScanSettings = lazy(() => import('@/pages/safesuite/SafeScanSettings'));
const SafeWebSettings = lazy(() => import('@/pages/safesuite/SafeWebSettings'));
const SafeTrackSettings = lazy(() => import('@/pages/safesuite/SafeTrackSettings'));
const ForgotPasswordPage = lazy(() => import('@/pages/safesuite/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/safesuite/ResetPasswordPage'));
const MFARecoveryPage = lazy(() => import('@/pages/safesuite/MFARecoveryPage'));
const SafePassProduct = lazy(() => import('@/pages/safesuite/products/SafePassProduct'));
const SafeScanProduct = lazy(() => import('@/pages/safesuite/products/SafeScanProduct'));
const SafeWebProduct = lazy(() => import('@/pages/safesuite/products/SafeWebProduct'));
const SafeTrackProduct = lazy(() => import('@/pages/safesuite/products/SafeTrackProduct'));
const SafeSuiteFeatures = lazy(() => import('@/pages/safesuite/SafeSuiteFeatures'));

// Lazy-loaded - SafePass Standalone
const SafePassLanding = lazy(() => import('@/pages/safepass/SafePassLanding'));
const SafePassAuth = lazy(() => import('@/pages/safepass/SafePassAuth'));
const SafePassAppDashboard = lazy(() => import('@/pages/safepass/SafePassDashboard'));
const SafePassImport = lazy(() => import('@/pages/safepass/SafePassImport'));
const SafePassExport = lazy(() => import('@/pages/safepass/SafePassExport'));
const SafePassSecurity = lazy(() => import('@/pages/safepass/SafePassSecurity'));
const SafePassBreachMonitor = lazy(() => import('@/pages/safepass/SafePassBreachMonitor'));

// Lazy-loaded - Marketing/Public pages
const Pricing = lazy(() => import('@/pages/Pricing'));
const MSPPricing = lazy(() => import('@/pages/MSPPricing'));
const AIStudioPricing = lazy(() => import('@/pages/pricing/AIStudioPricing'));
const SafeSuitePricing = lazy(() => import('@/pages/pricing/SafeSuitePricing'));
const VanguardPricing = lazy(() => import('@/pages/pricing/VanguardPricing'));
const Solutions = lazy(() => import('@/pages/Solutions'));
const LiveDemos = lazy(() => import('@/pages/LiveDemos'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const Docs = lazy(() => import('@/pages/Docs'));
const SafeSuiteKnowledgeBase = lazy(() => import('@/pages/docs/SafeSuiteKnowledgeBase'));
const AIStudioKnowledgeBase = lazy(() => import('@/pages/docs/AIStudioKnowledgeBase'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Security = lazy(() => import('@/pages/Security'));
const SecurityPolicy = lazy(() => import('@/pages/SecurityPolicy'));
const SmallBusiness = lazy(() => import('@/pages/SmallBusiness'));
const MediumBusiness = lazy(() => import('@/pages/MediumBusiness'));
const Enterprise = lazy(() => import('@/pages/Enterprise'));
const MSPs = lazy(() => import('@/pages/MSPs'));
const AIStudioForMSPs = lazy(() => import('@/pages/AIStudioForMSPs'));
const MSPSolutions = lazy(() => import('@/pages/MSPSolutions'));
const BusinessSolutions = lazy(() => import('@/pages/BusinessSolutions'));
const MSSPs = lazy(() => import('@/pages/MSSPs'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));
const Features = lazy(() => import('@/pages/Features'));
const Blog = lazy(() => import('@/pages/Blog'));
const Documentation = lazy(() => import('@/pages/Documentation'));
const CreditsPurchase = lazy(() => import('@/pages/CreditsPurchase'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// Lazy-loaded - Demo pages
const SafeScanDemoPage = lazy(() => import('@/pages/demos/SafeScanDemoPage'));
const SafePassDemoPage = lazy(() => import('@/pages/demos/SafePassDemoPage'));
const VanguardDemoPage = lazy(() => import('@/pages/demos/VanguardDemoPage'));
const AIStudioDemoPage = lazy(() => import('@/pages/demos/AIStudioDemoPage'));
const CustomGPTBuilderDemoPage = lazy(() => import('@/pages/demos/CustomGPTBuilderDemoPage'));
const DarkWebDemoPage = lazy(() => import('@/pages/demos/DarkWebDemoPage'));
const MSPDemos = lazy(() => import('@/pages/MSPDemos'));
const EmbedDemo = lazy(() => import('@/pages/EmbedDemo'));
const SafeDocEmbedDemo = lazy(() => import('@/pages/SafeDocEmbedDemo'));
const SafeMailEmbedDemo = lazy(() => import('@/pages/SafeMailEmbedDemo'));

// Lazy-loaded - Product pages
const SecuritySuitePage = lazy(() => import('@/pages/products/SecuritySuitePage'));
const OperationsSuitePage = lazy(() => import('@/pages/products/OperationsSuitePage'));
const HelpdeskPage = lazy(() => import('@/pages/products/HelpdeskPage'));
const RMMPage = lazy(() => import('@/pages/products/RMMPage'));
const AIStudioProductPage = lazy(() => import('@/pages/products/AIStudioProductPage'));
const VanguardProductPage = lazy(() => import('@/pages/products/VanguardProductPage'));
const SafeSuiteProductPage = lazy(() => import('@/pages/products/SafeSuiteProductPage'));
const SafeScorePage = lazy(() => import('@/pages/products/SafeScorePage'));
const SafeNetPage = lazy(() => import('@/pages/products/SafeNetPage'));
const TicketingPage = lazy(() => import('@/pages/products/TicketingPage'));
const AntivirusPage = lazy(() => import('@/pages/products/AntivirusPage'));
const SafeMDRPage = lazy(() => import('@/pages/products/SafeMDRPage'));

// Lazy-loaded - Admin pages
const AdvancedHelpdeskAdmin = lazy(() => import('@/pages/admin/AdvancedHelpdeskAdmin'));
const UnifiedAdminCenter = lazy(() => import('@/pages/admin/UnifiedAdminCenter'));
const ReconProvisioningPage = lazy(() => import('@/pages/admin/ReconProvisioningPage'));

// Lazy-loaded - Integration dashboards
const TegrityDashboardPage = lazy(() => import('@/pages/TegrityDashboardPage'));
const KaseyaDashboardPage = lazy(() => import('@/pages/KaseyaDashboardPage'));
const QuickBooksDashboardPage = lazy(() => import('@/pages/QuickBooksDashboardPage'));
const PSATicketingPage = lazy(() => import('@/pages/PSATicketingPage'));
const RMMScriptPage = lazy(() => import('@/pages/RMMScriptPage'));

// Lazy-loaded - SIEM pages
const SafeSIEM = lazy(() => import('@/pages/SafeSIEM'));
const SafeSIEMAlertRules = lazy(() => import('@/pages/SafeSIEMAlertRules'));
const SafeSIEMIncidents = lazy(() => import('@/pages/SafeSIEMIncidents'));
const SafeSIEMAnalytics = lazy(() => import('@/pages/SafeSIEMAnalytics'));

// Lazy-loaded - Other pages
import { Agent as AgentComponent } from '@/pages/Agent';
const Reports = lazy(() => import('@/pages/Reports'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const OnboardingFlow = lazy(() => import('@/components/OnboardingFlow'));
const SafeShieldApp = lazy(() => import('@/components/apps/SafeShieldApp').then(m => ({ default: m.SafeShieldApp })));
const SafeShieldDashboard = lazy(() => import('@/components/shield/SafeShieldDashboard').then(m => ({ default: m.SafeShieldDashboard })));
const SafeWebDashboard = lazy(() => import('@/pages/SafeWebDashboard'));
const SafeWebMSPDashboard = lazy(() => import('@/pages/SafeWebMSPDashboard'));
const SafeShield = lazy(() => import('@/pages/SafeShield'));
const TechnicianMobile = lazy(() => import('@/pages/TechnicianMobile'));
const SecurityAI = lazy(() => import('@/pages/SecurityAI'));
const TemplateTestSuite = lazy(() => import('@/components/gpt/TemplateTestSuite'));
const SafeTrackPage = lazy(() => import('@/pages/SafeTrackPage'));
const BusinessBillingPage = lazy(() => import('@/pages/BusinessBillingPage'));
const BusinessBilling = lazy(() => import('@/pages/BusinessBilling'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel'));
const CustomerPortal = lazy(() => import('@/pages/CustomerPortal').then(m => ({ default: m.CustomerPortal })));
const ClientLogin = lazy(() => import('@/pages/ClientLogin').then(m => ({ default: m.ClientLogin })));
const AssetManagementPage = lazy(() => import('@/pages/AssetManagementPage'));
const PatchManagementPage = lazy(() => import('@/pages/PatchManagementPage'));
const RemoteAccessPage = lazy(() => import('@/pages/RemoteAccessPage'));
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage'));
const TicketManagementPage = lazy(() => import('@/pages/TicketManagementPage'));
const ClientPortalPage = lazy(() => import('@/pages/ClientPortalPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SafeNetConnectorPage = lazy(() => import('@/pages/SafeNetConnectorPage'));
const SafeNetMSPPage = lazy(() => import('@/pages/SafeNetMSPPage'));
const SafeNetMobilePage = lazy(() => import('@/pages/SafeNetMobilePage'));
const HelpdeskFeedback = lazy(() => import('@/pages/helpdesk/HelpdeskFeedback'));
const SurveyPage = lazy(() => import('@/pages/SurveyPage'));
const ClientPortalDashboard = lazy(() => import('@/pages/client/ClientPortalDashboard'));
const ClientTicketsPage = lazy(() => import('@/pages/client/ClientTicketsPage'));
const ClientBillingPage = lazy(() => import('@/pages/client/ClientBillingPage'));
const PublicGPTEmbed = lazy(() => import('@/pages/PublicGPTEmbed'));

// Components that need to be loaded for layouts
import { VoiceAssistantProvider } from '@/components/voice/VoiceAssistantProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { UnifiedAIAssistant } from '@/components/UnifiedAIAssistant';
import { Loader2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Suspense wrapper with branded loading state
function SuspenseWrapper({ children, variant = 'dashboard' }: { children: React.ReactNode; variant?: 'dashboard' | 'list' | 'detail' | 'form' | 'cards' }) {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      {children}
    </Suspense>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
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
          {/* Dashboard shortcut - redirect to app */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          {/* Catch-all: redirect to landing page, not app (let users see marketing first) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <CookieConsent />
      </EnhancedErrorBoundary>
    );
  }

  return (
    <EnhancedErrorBoundary context="Application Root" level="critical">
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Vanguard Public Landing Page (no auth required) */}
        <Route path="/vanguard" element={<SuspenseWrapper><VanguardProductPage /></SuspenseWrapper>} />
        
        {/* Vanguard Auth Route */}
        <Route path="/vanguard/auth" element={<SuspenseWrapper><VanguardAuthPage /></SuspenseWrapper>} />
        
        {/* Vanguard Protected App Routes (inside layout) */}
        <Route path="/vanguard/app" element={<VanguardLayout />}>
          {getVanguardProtectedRoutes()}
        </Route>
        
        {/* Vanguard Dashboard redirects to app */}
        <Route path="/vanguard/dashboard" element={<Navigate to="/vanguard/app/dashboard" replace />} />

         {/* Legacy Vanguard routes (pre /vanguard/app move) */}
         <Route path="/vanguard/*" element={<LegacyVanguardRedirect />} />

        <Route path="/agent" element={<AgentComponent />} />
        <Route path="/auth" element={user ? <RoleBasedRedirect /> : <AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/hub" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="cards">
              <ProductHub />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={<SuspenseWrapper variant="cards"><Pricing /></SuspenseWrapper>} />
        <Route path="/pricing/ai-studio" element={<SuspenseWrapper variant="cards"><AIStudioPricing /></SuspenseWrapper>} />
        <Route path="/pricing/safesuite" element={<SuspenseWrapper variant="cards"><SafeSuitePricing /></SuspenseWrapper>} />
        <Route path="/pricing/vanguard" element={<SuspenseWrapper variant="cards"><VanguardPricing /></SuspenseWrapper>} />
        <Route path="/msp-pricing" element={<SuspenseWrapper variant="cards"><MSPPricing /></SuspenseWrapper>} />
        <Route path="/contact" element={<SuspenseWrapper variant="form"><Contact /></SuspenseWrapper>} />
        <Route path="/about" element={<SuspenseWrapper><About /></SuspenseWrapper>} />
        <Route path="/features" element={<SuspenseWrapper><Features /></SuspenseWrapper>} />
        <Route path="/credits" element={<SuspenseWrapper><CreditsPurchase /></SuspenseWrapper>} />
        <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
        <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
        <Route path="/security" element={<SuspenseWrapper><SecurityPolicy /></SuspenseWrapper>} />
        
        {/* Public Survey Page (no auth required) */}
        <Route path="/survey" element={<SuspenseWrapper variant="form"><SurveyPage /></SuspenseWrapper>} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <OnboardingFlow />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        {/* AI Studio Platform */}
        <Route path="/ai-studio/assistant" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <StudioAssistant />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        {/* Legacy redirect */}
        <Route path="/ultrium-gpt" element={<Navigate to="/ai-studio/assistant" replace />} />
        <Route path="/small-business" element={<SuspenseWrapper><SmallBusiness /></SuspenseWrapper>} />
        <Route path="/medium-business" element={<SuspenseWrapper><MediumBusiness /></SuspenseWrapper>} />
        <Route path="/enterprise" element={<SuspenseWrapper><Enterprise /></SuspenseWrapper>} />
        <Route path="/msps" element={<SuspenseWrapper><MSPs /></SuspenseWrapper>} />
        <Route path="/ai-studio/msps" element={<SuspenseWrapper><AIStudioForMSPs /></SuspenseWrapper>} />
        <Route path="/ai-studio-for-msps" element={<SuspenseWrapper><AIStudioForMSPs /></SuspenseWrapper>} />
        <Route path="/msp-solutions" element={<SuspenseWrapper><MSPSolutions /></SuspenseWrapper>} />
        <Route path="/business-solutions" element={<SuspenseWrapper><BusinessSolutions /></SuspenseWrapper>} />
        <Route path="/tegrity-dashboard" element={<SuspenseWrapper><TegrityDashboardPage /></SuspenseWrapper>} />
        <Route path="/kaseya-dashboard" element={<SuspenseWrapper><KaseyaDashboardPage /></SuspenseWrapper>} />
        <Route path="/quickbooks-dashboard" element={<SuspenseWrapper><QuickBooksDashboardPage /></SuspenseWrapper>} />
        <Route path="/psa-ticketing" element={<SuspenseWrapper><PSATicketingPage /></SuspenseWrapper>} />
        <Route path="/rmm-scripts" element={<SuspenseWrapper><RMMScriptPage /></SuspenseWrapper>} />
        <Route path="/msp-onboarding" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper variant="form">
              <MSPOnboardingPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-billing" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPBillingPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-reporting" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPReportingPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        
        {/* Client Portal Routes */}
        <Route path="/client" element={<SuspenseWrapper><ClientPortalDashboard /></SuspenseWrapper>} />
        <Route path="/client/tickets" element={<SuspenseWrapper variant="list"><ClientTicketsPage /></SuspenseWrapper>} />
        <Route path="/client/billing" element={<SuspenseWrapper><ClientBillingPage /></SuspenseWrapper>} />
        
        {/* Helpdesk Feedback Route (Public - for email links) */}
        <Route path="/helpdesk/feedback" element={<SuspenseWrapper variant="form"><HelpdeskFeedback /></SuspenseWrapper>} />
        
        <Route path="/mssps" element={<SuspenseWrapper><MSSPs /></SuspenseWrapper>} />
        <Route path="/solutions" element={<SuspenseWrapper><Solutions /></SuspenseWrapper>} />
        <Route path="/demos" element={<SuspenseWrapper variant="cards"><LiveDemos /></SuspenseWrapper>} />
        <Route path="/portfolio" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<SuspenseWrapper variant="cards"><ProductsPage /></SuspenseWrapper>} />
        <Route path="/msp-demos" element={<SuspenseWrapper variant="cards"><MSPDemos /></SuspenseWrapper>} />
        <Route path="/msp-control-center" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPDashboardPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-security-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPSecurityDashboard />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/msp-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPDashboardPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/docs" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="detail">
              <Docs />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/docs/safesuite" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="detail">
              <SafeSuiteKnowledgeBase />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/docs/ai-studio" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="detail">
              <AIStudioKnowledgeBase />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/demos/safescan" element={<SuspenseWrapper><SafeScanDemoPage /></SuspenseWrapper>} />
        <Route path="/demos/safepass" element={<SuspenseWrapper><SafePassDemoPage /></SuspenseWrapper>} />
        <Route path="/demos/ai-studio" element={<SuspenseWrapper><AIStudioDemoPage /></SuspenseWrapper>} />
        {/* Legacy redirect */}
        <Route path="/demos/ultriumgpt" element={<Navigate to="/demos/ai-studio" replace />} />
        <Route path="/demos/custom-gpt-builder" element={<SuspenseWrapper><CustomGPTBuilderDemoPage /></SuspenseWrapper>} />
        <Route path="/demos/vanguard" element={<SuspenseWrapper><VanguardDemoPage /></SuspenseWrapper>} />
        <Route path="/demos/darkweb" element={<SuspenseWrapper><DarkWebDemoPage /></SuspenseWrapper>} />
        <Route path="/demos/safeintel" element={<Navigate to="/demos/darkweb" replace />} />
        
        {/* Redirect deprecated demo routes to active products */}
        <Route path="/demos/safescore" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/demos/safenet" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/rmm" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/ticketing" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/antivirus" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/safemdr" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/safelink" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/demos/safemail" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/demos/safedoc" element={<Navigate to="/demos/safescan" replace />} />
        <Route path="/demos/safeshield" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/safecenter" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/safekb" element={<Navigate to="/products/ai-studio" replace />} />
        <Route path="/demos/safesoc" element={<Navigate to="/products/vanguard" replace />} />
        
        <Route path="/products/safescore" element={<SuspenseWrapper><SafeScorePage /></SuspenseWrapper>} />
        <Route path="/products/security" element={<SuspenseWrapper><SecuritySuitePage /></SuspenseWrapper>} />
        <Route path="/products/operations" element={<SuspenseWrapper><OperationsSuitePage /></SuspenseWrapper>} />
        <Route path="/products/helpdesk" element={<SuspenseWrapper><HelpdeskPage /></SuspenseWrapper>} />
        <Route path="/products/rmm" element={<SuspenseWrapper><RMMPage /></SuspenseWrapper>} />
        <Route path="/products/ai-studio" element={<SuspenseWrapper><AIStudioProductPage /></SuspenseWrapper>} />
        <Route path="/products/vanguard" element={<SuspenseWrapper><VanguardProductPage /></SuspenseWrapper>} />
        <Route path="/products/safesuite" element={<SuspenseWrapper><SafeSuiteProductPage /></SuspenseWrapper>} />
        <Route path="/products/safetrack" element={<SuspenseWrapper><SafeTrackProduct /></SuspenseWrapper>} />
        <Route path="/products/safepass" element={<SuspenseWrapper><SafePassProduct /></SuspenseWrapper>} />
        <Route path="/products/safeweb" element={<SuspenseWrapper><SafeWebProduct /></SuspenseWrapper>} />
        <Route path="/products/safescan" element={<SuspenseWrapper><SafeScanProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safetrack" element={<SuspenseWrapper><SafeTrackProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safepass" element={<SuspenseWrapper><SafePassProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safeweb" element={<SuspenseWrapper><SafeWebProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safescan" element={<SuspenseWrapper><SafeScanProduct /></SuspenseWrapper>} />
        <Route path="/products/safelink" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/products/safemail" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/products/safedoc" element={<Navigate to="/safesuite/features" replace />} />
        <Route path="/safesuite/features" element={<SuspenseWrapper><SafeSuiteFeatures /></SuspenseWrapper>} />
        <Route path="/embed-demo" element={<SuspenseWrapper><EmbedDemo /></SuspenseWrapper>} />
        <Route path="/safedoc-embed-demo" element={<SuspenseWrapper><SafeDocEmbedDemo /></SuspenseWrapper>} />
        <Route path="/safemail-embed-demo" element={<SuspenseWrapper><SafeMailEmbedDemo /></SuspenseWrapper>} />
        
        {/* SafeNet App Routes */}
        <Route path="/safenet-connector" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <SafeNetConnectorPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safenet-msp-dashboard" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <SafeNetMSPPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safenet-mobile" element={<SuspenseWrapper><SafeNetMobilePage /></SuspenseWrapper>} />
        <Route path="/technician-mobile" element={<SuspenseWrapper><TechnicianMobile /></SuspenseWrapper>} />
        <Route path="/safeshield" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <SafeShieldApp />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <SafeSIEM />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/alert-rules" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper variant="list">
              <SafeSIEMAlertRules />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/incidents" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper variant="list">
              <SafeSIEMIncidents />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/safesiem/analytics" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <SafeSIEMAnalytics />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/ultrium-vanguard" element={<SuspenseWrapper><UltriumVanguard /></SuspenseWrapper>} />
        <Route path="/vanguard-dashboard" element={<Navigate to="/vanguard/dashboard" replace />} />
        
        {/* Reports & Analytics Routes */}
        <Route path="/reports" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Reports />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Analytics />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Dashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Dashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/chat/:gptId" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <GPTChat />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/chat/:gptId" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <GPTChat />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <Profile />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <SettingsPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/profile-old" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <ProfilePage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <UnifiedAdminCenter />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/recon-provisioning" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <ReconProvisioningPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <UnifiedAdminCenter />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safeshield" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SafeShieldApp />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/security-center" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Dashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safepass" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Dashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safekb" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Dashboard />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safescan" element={
          <ProtectedRoute>
            <Navigate to="/safesuite/features" replace />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/safenet" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SafeNetConnectorPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/security-ai" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SecurityAI />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <AIStudio />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/test-suite" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background p-6">
              <SuspenseWrapper>
                <TemplateTestSuite />
              </SuspenseWrapper>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/settings/:gptId" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <GPTSettings />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/safetrack" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SafeTrackPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/msp/billing" element={
          <SubscriptionProtectedRoute requiresPremium>
            <SuspenseWrapper>
              <MSPBillingPage />
            </SuspenseWrapper>
          </SubscriptionProtectedRoute>
        } />
        <Route path="/business-billing" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <BusinessBilling />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/assets" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="list">
              <AssetManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/patches" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="list">
              <PatchManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/remote-access" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <RemoteAccessPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/monitoring" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <MonitoringPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="list">
              <TicketManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/client-portal" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <ClientPortalPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <BillingPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <AnalyticsPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        {/* Payment Success/Cancel Routes */}
        <Route path="/payment/success" element={<SuspenseWrapper><PaymentSuccess /></SuspenseWrapper>} />
        <Route path="/payment/cancel" element={<SuspenseWrapper><PaymentCancel /></SuspenseWrapper>} />
        
        {/* Public GPT Embed Routes - No auth required */}
        <Route path="/gpt/:gptId" element={<SuspenseWrapper><PublicGPTEmbed /></SuspenseWrapper>} />
        <Route path="/gpt/:gptId/embed" element={<SuspenseWrapper><PublicGPTEmbed /></SuspenseWrapper>} />
        
        {/* Customer Portal Routes */}
        <Route path="/client-login" element={<SuspenseWrapper><ClientLogin /></SuspenseWrapper>} />
        <Route path="/portal/client/:clientId" element={<SuspenseWrapper><CustomerPortal /></SuspenseWrapper>} />
        
        {/* SafePass Standalone App Routes */}
        <Route path="/safepass-app" element={<SuspenseWrapper><SafePassLanding /></SuspenseWrapper>} />
        <Route path="/safepass-app/auth" element={<SuspenseWrapper><SafePassAuth /></SuspenseWrapper>} />
        <Route path="/safepass-app/portal" element={<SafePassLayout />}>
          <Route index element={<SuspenseWrapper><SafePassAppDashboard /></SuspenseWrapper>} />
          <Route path="import" element={<SuspenseWrapper><SafePassImport /></SuspenseWrapper>} />
          <Route path="security" element={<SuspenseWrapper><SafePassSecurity /></SuspenseWrapper>} />
          <Route path="breach-monitor" element={<SuspenseWrapper><SafePassBreachMonitor /></SuspenseWrapper>} />
        </Route>
        
        {/* SafeSuite Portal Routes */}
        <Route path="/safesuite" element={<SuspenseWrapper><SafeSuiteLanding /></SuspenseWrapper>} />
        <Route path="/safesuite/auth" element={<SuspenseWrapper><SafeSuiteAuth /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/forgot-password" element={<SuspenseWrapper variant="form"><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/reset-password" element={<SuspenseWrapper variant="form"><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/mfa-recovery" element={<SuspenseWrapper variant="form"><MFARecoveryPage /></SuspenseWrapper>} />
        <Route element={
          <ProtectedRoute>
            <SafeSuiteLayout />
          </ProtectedRoute>
        }>
          <Route path="/safesuite/dashboard" element={<SuspenseWrapper><SafeSuiteDashboard /></SuspenseWrapper>} />
          <Route path="/safesuite/pass" element={<SuspenseWrapper><SafeSuitePass /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/shared" element={<SuspenseWrapper><SafePassShared /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/emergency" element={<SuspenseWrapper><SafePassEmergency /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/extension" element={<SuspenseWrapper><SafePassExtension /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/import" element={<SuspenseWrapper><SafePassImport /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/export" element={<SuspenseWrapper><SafePassExport /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/reminders" element={<SuspenseWrapper><SafePassReminders /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/breach" element={<SuspenseWrapper><SafePassBreach /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/settings" element={<SuspenseWrapper variant="form"><SafePassSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/scan" element={<SuspenseWrapper><SafeSuiteScan /></SuspenseWrapper>} />
          <Route path="/safesuite/scan/settings" element={<SuspenseWrapper variant="form"><SafeScanSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/web" element={<SuspenseWrapper><SafeSuiteWeb /></SuspenseWrapper>} />
          <Route path="/safesuite/web/settings" element={<SuspenseWrapper variant="form"><SafeWebSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/track" element={<SuspenseWrapper><SafeSuiteTrack /></SuspenseWrapper>} />
          <Route path="/safesuite/track/settings" element={<SuspenseWrapper variant="form"><SafeTrackSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/billing" element={<SuspenseWrapper><SafeSuiteBilling /></SuspenseWrapper>} />
          <Route path="/safesuite/settings" element={<SuspenseWrapper variant="form"><SafeSuiteSettings /></SuspenseWrapper>} />
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
