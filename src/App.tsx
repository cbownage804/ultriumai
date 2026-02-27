import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
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
import { PageTransition } from '@/components/transitions/PageTransition';
import { isVanguardDomain, isSafeSuiteDomain } from '@/utils/subdomain';
import { getCrossDomainRedirect, isAppDomain } from '@/utils/domainRouter';
import { SystemStatusBanner } from '@/components/system/SystemStatusBanner';
// Lazy-loaded global components (reduce initial bundle)
const AIStudioCTABanner = lazy(() => import('@/components/marketing/AIStudioCTABanner').then(m => ({ default: m.AIStudioCTABanner })));
const GlobalCommandPalette = lazy(() => import('@/components/GlobalCommandPalette').then(m => ({ default: m.GlobalCommandPalette })));
const GlobalKeyboardShortcuts = lazy(() => import('@/components/GlobalKeyboardShortcuts').then(m => ({ default: m.GlobalKeyboardShortcuts })));
const GlobalBreadcrumbs = lazy(() => import('@/components/GlobalBreadcrumbs').then(m => ({ default: m.GlobalBreadcrumbs })));
const FloatingHelpButton = lazy(() => import('@/components/help/FloatingHelpButton').then(m => ({ default: m.FloatingHelpButton })));


// Lazy-loaded layouts (heavy dependency trees)
const VanguardLayout = lazy(() => import('@/components/vanguard/VanguardLayout').then(m => ({ default: m.VanguardLayout })));
const SafeSuiteLayout = lazy(() => import('@/layouts/SafeSuiteLayout'));
// SafePassLayout removed - standalone safepass redirects to safesuite

import { getVanguardProtectedRoutes, getVanguardPublicRoutes } from '@/routes/vanguardRoutes';
import { PageSkeleton, LoadingSpinner } from '@/components/ui/PageSkeleton';

// Core pages (always loaded - small footprint)
import AuthPage from '@/pages/AuthPage';
import AuthCallback from '@/pages/AuthCallback';
import AuthConfirm from '@/pages/AuthConfirm';
import NotFound from '@/pages/NotFound';
import LegacyVanguardRedirect from '@/routes/LegacyVanguardRedirect';

// Lazy-loaded Index (homepage is heavy)
const Index = lazy(() => import('@/pages/Index'));

// Lazy-loaded pages - Heavy dashboards and features
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProductHub = lazy(() => import('@/pages/ProductHub'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));
const GPTChat = lazy(() => import('@/pages/GPTChat'));
const GPTSettings = lazy(() => import('@/pages/GPTSettings'));
const AIAppBuilderWorkspacePage = lazy(() => import('@/pages/AIAppBuilderWorkspacePage'));
const GPTBuilderPage = lazy(() => import('@/pages/GPTBuilderPage'));
const AIStudioProjectsPage = lazy(() => import('@/pages/AIStudioProjectsPage'));
const AIStudioUsageAnalytics = lazy(() => import('@/pages/AIStudioUsageAnalytics'));
const AIStudioTemplateGallery = lazy(() => import('@/pages/AIStudioTemplateGallery'));
const Profile = lazy(() => import('@/pages/Profile'));
// ProfilePage removed - use Profile

// Lazy-loaded - Vanguard pages
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevices = lazy(() => import('@/pages/VanguardDevices'));
const VanguardDeviceDetail = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
const UltriumVanguard = lazy(() => import('@/pages/UltriumVanguard'));
// VanguardAuthPage removed - unified auth at /auth

// Lazy-loaded - MSP pages
// MSP pages removed - redirects in routes

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
const SafePassNotes = lazy(() => import('@/pages/safesuite/SafePassNotes'));
const SafePassCards = lazy(() => import('@/pages/safesuite/SafePassCards'));
const SafePassIdentity = lazy(() => import('@/pages/safesuite/SafePassIdentity'));
const SafePassHealth = lazy(() => import('@/pages/safesuite/SafePassHealth'));
const SafePassUsers = lazy(() => import('@/pages/safesuite/SafePassUsers'));

// SafePass standalone removed - redirects in routes

// Lazy-loaded - Marketing/Public pages
const Pricing = lazy(() => import('@/pages/Pricing'));
// MSPPricing removed
const AIStudioPricing = lazy(() => import('@/pages/pricing/AIStudioPricing'));
const SafeSuitePricing = lazy(() => import('@/pages/pricing/SafeSuitePricing'));
const VanguardPricing = lazy(() => import('@/pages/pricing/VanguardPricing'));
const CustomAppsPricing = lazy(() => import('@/pages/pricing/CustomAppsPricing'));
// Solutions/LiveDemos removed
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const Docs = lazy(() => import('@/pages/Docs'));
const SafeSuiteKnowledgeBase = lazy(() => import('@/pages/docs/SafeSuiteKnowledgeBase'));
const AIStudioKnowledgeBase = lazy(() => import('@/pages/docs/AIStudioKnowledgeBase'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Security = lazy(() => import('@/pages/Security'));
const SecurityPolicy = lazy(() => import('@/pages/SecurityPolicy'));
// Marketing pages removed
const CreditsPurchase = lazy(() => import('@/pages/CreditsPurchase'));
const Contact = lazy(() => import('@/pages/Contact'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/NotificationPreferencesPage'));
const InstallPage = lazy(() => import('@/pages/InstallPage'));
// StatusPage removed
const APIDocsPage = lazy(() => import('@/pages/APIDocsPage'));

// Demo pages removed

// Lazy-loaded - Product pages
const AIStudioProductPage = lazy(() => import('@/pages/products/AIStudioProductPage'));
const VanguardProductPage = lazy(() => import('@/pages/products/VanguardProductPage'));
const SafeSuiteProductPage = lazy(() => import('@/pages/products/SafeSuiteProductPage'));

// Lazy-loaded - Admin pages
const AdvancedHelpdeskAdmin = lazy(() => import('@/pages/admin/AdvancedHelpdeskAdmin'));
const UnifiedAdminCenter = lazy(() => import('@/pages/admin/UnifiedAdminCenter'));
const ReconProvisioningPage = lazy(() => import('@/pages/admin/ReconProvisioningPage'));

// Lazy-loaded - Other pages
const AgentComponent = lazy(() => import('@/pages/Agent').then(m => ({ default: m.Agent })));
const Reports = lazy(() => import('@/pages/Reports'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const OnboardingFlow = lazy(() => import('@/components/OnboardingFlow'));
const SafeShieldApp = lazy(() => import('@/components/apps/SafeShieldApp').then(m => ({ default: m.SafeShieldApp })));
const SafeShieldDashboard = lazy(() => import('@/components/shield/SafeShieldDashboard').then(m => ({ default: m.SafeShieldDashboard })));
const TemplateTestSuite = lazy(() => import('@/components/gpt/TemplateTestSuite'));
// BusinessBilling pages removed
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel'));
const CustomerPortal = lazy(() => import('@/pages/CustomerPortal').then(m => ({ default: m.CustomerPortal })));
const ClientLogin = lazy(() => import('@/pages/ClientLogin').then(m => ({ default: m.ClientLogin })));
// Standalone management pages removed - now in Vanguard
const HelpdeskFeedback = lazy(() => import('@/pages/helpdesk/HelpdeskFeedback'));
const SurveyPage = lazy(() => import('@/pages/SurveyPage'));
const ClientPortalDashboard = lazy(() => import('@/pages/client/ClientPortalDashboard'));
const ClientTicketsPage = lazy(() => import('@/pages/client/ClientTicketsPage'));
const ClientBillingPage = lazy(() => import('@/pages/client/ClientBillingPage'));
const PublicGPTEmbed = lazy(() => import('@/pages/PublicGPTEmbed'));
const ReferralProgram = lazy(() => import('@/pages/ReferralProgram'));
const ChangelogPage = lazy(() => import('@/pages/ChangelogPage'));
const FeatureRequestBoard = lazy(() => import('@/pages/FeatureRequestBoard'));
const GuidePage = lazy(() => import('@/pages/GuidePage'));
const OrganizationManagement = lazy(() => import('@/pages/OrganizationManagement'));
const OrgAcceptInvite = lazy(() => import('@/pages/OrgAcceptInvite'));

// Customer Portal (End-User Self-Service)
const CustomerPortalLogin = lazy(() => import('@/pages/customer-portal/CustomerPortalLogin'));
const CustomerPortalDashboard = lazy(() => import('@/pages/customer-portal/CustomerPortalDashboard'));
const CustomerPortalNewTicket = lazy(() => import('@/pages/customer-portal/CustomerPortalNewTicket'));
const CustomerPortalTickets = lazy(() => import('@/pages/customer-portal/CustomerPortalTickets'));
const CustomerPortalTicketDetail = lazy(() => import('@/pages/customer-portal/CustomerPortalTicketDetail'));
const CustomerPortalForgotPassword = lazy(() => import('@/pages/customer-portal/CustomerPortalForgotPassword'));
const CustomerPortalResetPassword = lazy(() => import('@/pages/customer-portal/CustomerPortalResetPassword'));
const CustomerPortalChangePassword = lazy(() => import('@/pages/customer-portal/CustomerPortalChangePassword'));
const PortalAcceptInvite = lazy(() => import('@/pages/portal/AcceptInvite'));

// Components that need to be loaded for layouts
const VoiceAssistantProvider = lazy(() => import('@/components/voice/VoiceAssistantProvider').then(m => ({ default: m.VoiceAssistantProvider })));
import { AuthProvider } from '@/hooks/useAuth';
const PortalLayout = lazy(() => import('@/components/customer-portal/PortalLayout').then(m => ({ default: m.PortalLayout })));

import { useAnalytics } from '@/hooks/useAnalytics';

// Suspense wrapper with branded loading state + page transitions
function SuspenseWrapper({ children, variant = 'dashboard' }: { children: React.ReactNode; variant?: 'dashboard' | 'list' | 'detail' | 'form' | 'cards' }) {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <PageTransition>
        {children}
      </PageTransition>
    </Suspense>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();
  const { getRedirectPath, shouldRedirectToRole } = useRoleBasedRedirect();
  const location = useLocation();
  
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

  // Cross-domain redirect: wrong domain for this route → redirect
  // Exception: authenticated users on app domain root → send to /hub instead of marketing
  const crossDomainRedirect = getCrossDomainRedirect(location.pathname, location.search, location.hash);
  if (crossDomainRedirect) {
    // If user is authenticated and on app domain root, go to hub instead of marketing site
    if (user && isAppDomain() && location.pathname === '/') {
      // Let React Router handle it — Index component will navigate to /hub
    } else {
      window.location.replace(crossDomainRedirect);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <LoadingSpinner />
        </div>
      );
    }
  }

  // If on SafeSuite subdomain, redirect to main domain with /safesuite prefix
  if (isSafeSuite) {
    const mainDomain = window.location.hostname.includes('lovable.app')
      ? 'https://ultriumai.lovable.app'
      : 'https://ultriumai.app';
    const currentPath = location.pathname === '/' ? '' : location.pathname;
    const targetUrl = `${mainDomain}/safesuite${currentPath}${location.search}${location.hash}`;
    window.location.replace(targetUrl);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // If on Vanguard subdomain, redirect to main domain with /vanguard prefix
  if (isVanguard) {
    const mainDomain = window.location.hostname.includes('lovable.app')
      ? 'https://ultriumai.lovable.app'
      : 'https://ultriumai.app';
    // Map subdomain paths: /app/* → /vanguard/app/*, / → /vanguard
    const currentPath = location.pathname === '/' ? '' : location.pathname;
    const targetUrl = `${mainDomain}/vanguard${currentPath}${location.search}${location.hash}`;
    window.location.replace(targetUrl);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary context="Application Root" level="critical">
      <Routes>
        <Route path="/" element={<SuspenseWrapper><Index /></SuspenseWrapper>} />
        
        {/* Vanguard root redirects to the Vanguard dashboard */}
        <Route path="/vanguard" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        
        {/* Vanguard Auth Route - redirect to unified auth */}
        <Route path="/vanguard/auth" element={<Navigate to="/auth?return=vanguard" replace />} />
        
        {/* Vanguard Protected App Routes (inside layout) */}
        <Route path="/vanguard/app" element={<SuspenseWrapper><VanguardLayout /></SuspenseWrapper>}>
          {getVanguardProtectedRoutes()}
        </Route>
        
        {/* Vanguard Dashboard redirects to app */}
        <Route path="/vanguard/dashboard" element={<Navigate to="/vanguard/app/dashboard" replace />} />

         {/* Legacy Vanguard routes (pre /vanguard/app move) */}
         <Route path="/vanguard/*" element={<LegacyVanguardRedirect />} />

        <Route path="/agent" element={<SuspenseWrapper><AgentComponent /></SuspenseWrapper>} />
        <Route path="/auth" element={user ? <RoleBasedRedirect /> : <AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/hub" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="cards">
              <ProductHub />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={<Navigate to="/pricing/vanguard" replace />} />
        <Route path="/pricing/ai-studio" element={<SuspenseWrapper variant="cards"><AIStudioPricing /></SuspenseWrapper>} />
        <Route path="/pricing/safesuite" element={<SuspenseWrapper variant="cards"><SafeSuitePricing /></SuspenseWrapper>} />
        <Route path="/pricing/vanguard" element={<SuspenseWrapper variant="cards"><VanguardPricing /></SuspenseWrapper>} />
        <Route path="/pricing/custom-apps" element={<SuspenseWrapper variant="cards"><CustomAppsPricing /></SuspenseWrapper>} />
        <Route path="/msp-pricing" element={<Navigate to="/pricing/vanguard" replace />} />
        <Route path="/contact" element={<SuspenseWrapper><Contact /></SuspenseWrapper>} />
        <Route path="/about" element={<Navigate to="/vanguard" replace />} />
        <Route path="/features" element={<Navigate to="/products" replace />} />
        <Route path="/credits" element={<SuspenseWrapper><CreditsPurchase /></SuspenseWrapper>} />
        <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
        <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
        <Route path="/security" element={<SuspenseWrapper><SecurityPolicy /></SuspenseWrapper>} />
        <Route path="/status" element={<Navigate to="/vanguard" replace />} />
        <Route path="/api-docs" element={<SuspenseWrapper variant="detail"><APIDocsPage /></SuspenseWrapper>} />
        <Route path="/install" element={<SuspenseWrapper><InstallPage /></SuspenseWrapper>} />
        <Route path="/changelog" element={<SuspenseWrapper><ChangelogPage /></SuspenseWrapper>} />
        <Route path="/feedback" element={<SuspenseWrapper><FeatureRequestBoard /></SuspenseWrapper>} />
        <Route path="/guide" element={<SuspenseWrapper><GuidePage /></SuspenseWrapper>} />
        <Route path="/organization" element={
          <ProtectedRoute>
            <SuspenseWrapper><OrganizationManagement /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/referrals" element={
          <ProtectedRoute>
            <SuspenseWrapper><ReferralProgram /></SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/notifications/preferences" element={
          <ProtectedRoute>
            <SuspenseWrapper variant="form">
              <NotificationPreferencesPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
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
        {/* Legacy redirects */}
        <Route path="/ai-studio/assistant" element={<Navigate to="/ai-studio" replace />} />
        <Route path="/ultrium-gpt" element={<Navigate to="/ai-studio" replace />} />
        <Route path="/ai-studio-platform" element={<Navigate to="/products/ai-studio" replace />} />
        <Route path="/ai-studio/use-cases" element={<Navigate to="/products/ai-studio" replace />} />
        <Route path="/small-business" element={<Navigate to="/products" replace />} />
        <Route path="/medium-business" element={<Navigate to="/products" replace />} />
        <Route path="/enterprise" element={<Navigate to="/products" replace />} />
        <Route path="/msps" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/ai-studio/msps" element={<Navigate to="/msps" replace />} />
        <Route path="/ai-studio-for-msps" element={<Navigate to="/msps" replace />} />
        <Route path="/msp-solutions" element={<Navigate to="/msps" replace />} />
        <Route path="/business-solutions" element={<Navigate to="/products" replace />} />
        <Route path="/tegrity-dashboard" element={<Navigate to="/hub" replace />} />
        <Route path="/kaseya-dashboard" element={<Navigate to="/hub" replace />} />
        <Route path="/quickbooks-dashboard" element={<Navigate to="/hub" replace />} />
        <Route path="/psa-ticketing" element={<Navigate to="/hub" replace />} />
        <Route path="/rmm-scripts" element={<Navigate to="/hub" replace />} />
        <Route path="/msp-onboarding" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        <Route path="/msp-billing" element={<Navigate to="/vanguard/app/billing" replace />} />
        <Route path="/msp-reporting" element={<Navigate to="/vanguard/app/reports" replace />} />
        
        {/* Client Portal Routes */}
        <Route path="/client" element={<SuspenseWrapper><ClientPortalDashboard /></SuspenseWrapper>} />
        <Route path="/client/tickets" element={<SuspenseWrapper variant="list"><ClientTicketsPage /></SuspenseWrapper>} />
        <Route path="/client/billing" element={<SuspenseWrapper><ClientBillingPage /></SuspenseWrapper>} />
        
        {/* Customer Portal Routes (End-User Self-Service) */}
        <Route path="/customer-portal/login" element={<SuspenseWrapper variant="form"><CustomerPortalLogin /></SuspenseWrapper>} />
        <Route path="/customer-portal/forgot-password" element={<SuspenseWrapper variant="form"><CustomerPortalForgotPassword /></SuspenseWrapper>} />
        <Route path="/customer-portal/reset-password" element={<SuspenseWrapper variant="form"><CustomerPortalResetPassword /></SuspenseWrapper>} />
        <Route path="/customer-portal/change-password" element={<SuspenseWrapper variant="form"><PortalLayout><CustomerPortalChangePassword /></PortalLayout></SuspenseWrapper>} />
        <Route path="/customer-portal/dashboard" element={<SuspenseWrapper><PortalLayout><CustomerPortalDashboard /></PortalLayout></SuspenseWrapper>} />
        <Route path="/customer-portal/tickets" element={<SuspenseWrapper variant="list"><PortalLayout><CustomerPortalTickets /></PortalLayout></SuspenseWrapper>} />
        <Route path="/customer-portal/tickets/new" element={<SuspenseWrapper variant="form"><PortalLayout><CustomerPortalNewTicket /></PortalLayout></SuspenseWrapper>} />
        <Route path="/customer-portal/tickets/:ticketId" element={<SuspenseWrapper variant="detail"><PortalLayout><CustomerPortalTicketDetail /></PortalLayout></SuspenseWrapper>} />
        
        {/* Organization Invitation Acceptance (Public) */}
        <Route path="/org/accept-invite" element={<SuspenseWrapper variant="form"><OrgAcceptInvite /></SuspenseWrapper>} />
        
        {/* Portal Invitation Acceptance (Public) */}
        <Route path="/portal/accept-invite" element={<SuspenseWrapper variant="form"><PortalAcceptInvite /></SuspenseWrapper>} />
        
        {/* Helpdesk Feedback Route (Public - for email links) */}
        <Route path="/helpdesk/feedback" element={<SuspenseWrapper variant="form"><HelpdeskFeedback /></SuspenseWrapper>} />
        
        <Route path="/mssps" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/solutions" element={<Navigate to="/products" replace />} />
        <Route path="/demos" element={<Navigate to="/products" replace />} />
        <Route path="/portfolio" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<SuspenseWrapper variant="cards"><ProductsPage /></SuspenseWrapper>} />
        <Route path="/msp-demos" element={<Navigate to="/products" replace />} />
        <Route path="/msp-control-center" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        <Route path="/msp-security-dashboard" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        <Route path="/msp-dashboard" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        {/* Public Documentation - accessible without auth */}
        <Route path="/docs" element={<SuspenseWrapper variant="detail"><Docs /></SuspenseWrapper>} />
        <Route path="/docs/safesuite" element={<SuspenseWrapper variant="detail"><SafeSuiteKnowledgeBase /></SuspenseWrapper>} />
        <Route path="/docs/ai-studio" element={<SuspenseWrapper variant="detail"><AIStudioKnowledgeBase /></SuspenseWrapper>} />
        <Route path="/demos/safescan" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/demos/safepass" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/demos/ai-studio" element={<Navigate to="/products/ai-studio" replace />} />
        {/* Legacy redirect */}
        <Route path="/demos/ultriumgpt" element={<Navigate to="/products/ai-studio" replace />} />
        <Route path="/demos/custom-gpt-builder" element={<Navigate to="/products/ai-studio" replace />} />
        <Route path="/demos/vanguard" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/demos/darkweb" element={<Navigate to="/products/vanguard" replace />} />
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
        
        <Route path="/products/safescore" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/products/security" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/products/operations" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/products/helpdesk" element={<Navigate to="/products/vanguard" replace />} />
        <Route path="/products/rmm" element={<Navigate to="/products/vanguard" replace />} />
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
        <Route path="/embed-demo" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/safedoc-embed-demo" element={<Navigate to="/products/safesuite" replace />} />
        <Route path="/safemail-embed-demo" element={<Navigate to="/products/safesuite" replace />} />
        
        {/* Legacy SafeNet/SIEM redirects */}
        <Route path="/safenet-connector" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/safenet-msp-dashboard" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/safenet-mobile" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/technician-mobile" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/safesiem" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/safesiem/*" element={<Navigate to="/vanguard/dashboard" replace />} />
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
        <Route path="/dashboard" element={<Navigate to="/ai-studio" replace />} />
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
        <Route path="/profile-old" element={<Navigate to="/profile" replace />} />
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
        <Route path="/dashboard/safenet" element={<Navigate to="/vanguard/dashboard" replace />} />
        <Route path="/security-ai" element={<Navigate to="/vanguard/dashboard" replace />} />
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
        {/* Legacy redirects for removed pages */}
        <Route path="/ai-studio/agents" element={<Navigate to="/ai-studio" replace />} />
        <Route path="/ai-studio/agents/*" element={<Navigate to="/ai-studio" replace />} />
        <Route path="/ai-studio/workflows" element={<Navigate to="/ai-studio" replace />} />
        <Route path="/ai-studio/projects" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <AIStudioProjectsPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/app-builder" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton variant="dashboard" />}>
              <AIAppBuilderWorkspacePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/gpt-builder" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton variant="dashboard" />}>
              <GPTBuilderPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/gpt-builder/:gptId" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSkeleton variant="dashboard" />}>
              <GPTBuilderPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/analytics" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <AIStudioUsageAnalytics />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/ai-studio/templates" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <AIStudioTemplateGallery />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/safetrack" element={<Navigate to="/vanguard/app/assets" replace />} />
        <Route path="/dashboard/msp/billing" element={<Navigate to="/vanguard/app/billing" replace />} />
        <Route path="/business-billing" element={<Navigate to="/vanguard/app/billing" replace />} />
        <Route path="/assets" element={<Navigate to="/vanguard/app/assets" replace />} />
        <Route path="/patches" element={<Navigate to="/vanguard/app/patches" replace />} />
        <Route path="/remote-access" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        <Route path="/monitoring" element={<Navigate to="/vanguard/app/dashboard" replace />} />
        <Route path="/tickets" element={<Navigate to="/vanguard/app/tickets" replace />} />
        <Route path="/client-portal" element={<Navigate to="/vanguard/app/customers" replace />} />
        <Route path="/billing" element={<Navigate to="/vanguard/app/billing" replace />} />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <Analytics />
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
        
        {/* SafePass Standalone - redirect to SafeSuite */}
        <Route path="/safepass-app" element={<Navigate to="/safesuite" replace />} />
        <Route path="/safepass-app/*" element={<Navigate to="/safesuite/pass" replace />} />
        
        {/* SafeSuite Portal Routes */}
        <Route path="/safesuite" element={<Navigate to="/safesuite/dashboard" replace />} />
        <Route path="/safesuite/auth" element={<SuspenseWrapper><SafeSuiteAuth /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/forgot-password" element={<SuspenseWrapper variant="form"><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/reset-password" element={<SuspenseWrapper variant="form"><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/safesuite/auth/mfa-recovery" element={<SuspenseWrapper variant="form"><MFARecoveryPage /></SuspenseWrapper>} />
        <Route element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SafeSuiteLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }>
          <Route path="/safesuite/dashboard" element={<SuspenseWrapper><SafeSuiteDashboard /></SuspenseWrapper>} />
          <Route path="/safesuite/pass" element={<SuspenseWrapper><SafeSuitePass /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/shared" element={<SuspenseWrapper><SafePassShared /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/emergency" element={<SuspenseWrapper><SafePassEmergency /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/extension" element={<SuspenseWrapper><SafePassExtension /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/import" element={<Navigate to="/safesuite/pass" replace />} />
          <Route path="/safesuite/pass/export" element={<Navigate to="/safesuite/pass" replace />} />
          <Route path="/safesuite/pass/reminders" element={<SuspenseWrapper><SafePassReminders /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/breach" element={<SuspenseWrapper><SafePassBreach /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/settings" element={<SuspenseWrapper variant="form"><SafePassSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/notes" element={<SuspenseWrapper><SafePassNotes /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/cards" element={<SuspenseWrapper><SafePassCards /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/identity" element={<SuspenseWrapper><SafePassIdentity /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/health" element={<SuspenseWrapper><SafePassHealth /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/users" element={<SuspenseWrapper><SafePassUsers /></SuspenseWrapper>} />
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
      
      
      {/* Global Command Palette (Cmd+K) */}
      <Suspense fallback={null}>
        {user && <GlobalCommandPalette />}
        {user && <GlobalKeyboardShortcuts />}
        {user && <FloatingHelpButton />}
        <GlobalBreadcrumbs />
        <AIStudioCTABanner />
      </Suspense>
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </EnhancedErrorBoundary>
  );
}

// Create a QueryClient instance at module level - this is the recommended approach
// as it avoids potential issues with HMR and React hooks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Scroll to top effect - using module-level execution once
if (typeof window !== 'undefined') {
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <EnhancedErrorBoundary context="Application Root" level="critical">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <VoiceAssistantProvider>
                  <Router>
                    <SystemStatusBanner />
                    <AppRouter />
                    <ShadcnToaster />
                    <SonnerToaster />
                  </Router>
                </VoiceAssistantProvider>
              </Suspense>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </EnhancedErrorBoundary>
    </ThemeProvider>
  );
}
