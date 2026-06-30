import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/hooks/useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import CookieConsent from '@/components/CookieConsent';
import { PageTransition } from '@/components/transitions/PageTransition';
import { PageSkeleton, LoadingSpinner } from '@/components/ui/PageSkeleton';

// Core pages (always loaded)
import AuthCallback from '@/pages/AuthCallback';
import AuthConfirm from '@/pages/AuthConfirm';
import NotFound from '@/pages/NotFound';

// Wrayth layout
const WraythLayout = lazy(() => import('@/layouts/SafeSuiteLayout'));

// Wrayth pages
const WraythLanding = lazy(() => import('@/pages/safesuite/SafeSuiteLanding'));
const WraythAuth = lazy(() => import('@/pages/safesuite/SafeSuiteAuth'));
const WraythDashboard = lazy(() => import('@/pages/safesuite/SafeSuiteDashboard'));
const WraythBilling = lazy(() => import('@/pages/safesuite/SafeSuiteBilling'));
const WraythSettings = lazy(() => import('@/pages/safesuite/SafeSuiteSettings'));
const Passwords = lazy(() => import('@/pages/safesuite/Passwords'));
const Threats = lazy(() => import('@/pages/safesuite/Threats'));
const Exposure = lazy(() => import('@/pages/safesuite/Exposure'));
const MorningBrief = lazy(() => import('@/pages/safesuite/MorningBrief'));
const VaultSettings = lazy(() => import('@/pages/safesuite/SafePassSettings'));
const VaultReminders = lazy(() => import('@/pages/safesuite/SafePassReminders'));
const VaultBreach = lazy(() => import('@/pages/safesuite/SafePassBreach'));
const VaultShared = lazy(() => import('@/pages/safesuite/SafePassShared'));
const VaultEmergency = lazy(() => import('@/pages/safesuite/SafePassEmergency'));
const VaultExtension = lazy(() => import('@/pages/safesuite/SafePassExtension'));
const ScanSettings = lazy(() => import('@/pages/safesuite/SafeScanSettings'));
const WatchSettings = lazy(() => import('@/pages/safesuite/SafeWebSettings'));
const ForgotPasswordPage = lazy(() => import('@/pages/safesuite/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/safesuite/ResetPasswordPage'));
const MFARecoveryPage = lazy(() => import('@/pages/safesuite/MFARecoveryPage'));
const VaultProduct = lazy(() => import('@/pages/safesuite/products/SafePassProduct'));
const ScanProduct = lazy(() => import('@/pages/safesuite/products/SafeScanProduct'));
const WatchProduct = lazy(() => import('@/pages/safesuite/products/SafeWebProduct'));
const WraythFeatures = lazy(() => import('@/pages/safesuite/SafeSuiteFeatures'));
const VaultNotes = lazy(() => import('@/pages/safesuite/SafePassNotes'));
const VaultCards = lazy(() => import('@/pages/safesuite/SafePassCards'));
const VaultIdentity = lazy(() => import('@/pages/safesuite/SafePassIdentity'));
const RayMFAHub = lazy(() => import('@/pages/safesuite/RayMFAHub'));
const VaultHealth = lazy(() => import('@/pages/safesuite/SafePassHealth'));
const VaultUsers = lazy(() => import('@/pages/safesuite/SafePassUsers'));
const WraythPricing = lazy(() => import('@/pages/pricing/SafeSuitePricing'));
const WraythAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));
const Ray = lazy(() => import('@/pages/safesuite/Ray'));
const Identity = lazy(() => import('@/pages/safesuite/Identity'));
const Devices = lazy(() => import('@/pages/safesuite/Devices'));
const Reports = lazy(() => import('@/pages/safesuite/Reports'));
const Missions = lazy(() => import('@/pages/safesuite/Missions'));
const Trends = lazy(() => import('@/pages/safesuite/Trends'));
const TrustCenter = lazy(() => import('@/pages/safesuite/TrustCenter'));
const RayOnboarding = lazy(() => import('@/pages/onboarding/RayOnboarding'));
const RayTimelinePage = lazy(() => import('@/pages/safesuite/RayTimelinePage'));
const PlaybookRunnerPage = lazy(() => import('@/pages/safesuite/PlaybookRunnerPage'));

// Public/legal pages
const Contact = lazy(() => import('@/pages/Contact'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Security = lazy(() => import('@/pages/Security'));
const SecurityPolicy = lazy(() => import('@/pages/SecurityPolicy'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel'));

function SuspenseWrapper({ children, variant = 'dashboard' }: { children: React.ReactNode; variant?: 'dashboard' | 'list' | 'detail' | 'form' | 'cards' }) {
  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

/** Rewrites any /safesuite/<rest> URL to /app/<rest>, preserving search + hash. */
function LegacySafesuiteRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/safesuite/, '') || '/dashboard';
  return <Navigate to={`/app${rest}${location.search}${location.hash}`} replace />;
}



function AppRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();
  useScrollToTop();

  // Track page views (lightweight - no analytics dep)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', { page_path: location.pathname });
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary context="Application Root" level="critical">
      <Routes>
        {/* Marketing landing */}
        <Route path="/" element={<SuspenseWrapper><WraythLanding /></SuspenseWrapper>} />
        <Route path="/pricing" element={<SuspenseWrapper variant="cards"><WraythPricing /></SuspenseWrapper>} />
        <Route path="/features" element={<SuspenseWrapper><WraythFeatures /></SuspenseWrapper>} />
        <Route path="/products/safepass" element={<SuspenseWrapper><VaultProduct /></SuspenseWrapper>} />
        <Route path="/products/safescan" element={<SuspenseWrapper><ScanProduct /></SuspenseWrapper>} />
        <Route path="/products/safeweb" element={<SuspenseWrapper><WatchProduct /></SuspenseWrapper>} />
        <Route path="/contact" element={<SuspenseWrapper><Contact /></SuspenseWrapper>} />
        <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
        <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
        <Route path="/security" element={<SuspenseWrapper><Security /></SuspenseWrapper>} />
        <Route path="/security-policy" element={<SuspenseWrapper><SecurityPolicy /></SuspenseWrapper>} />
        <Route path="/payment-success" element={<SuspenseWrapper><PaymentSuccess /></SuspenseWrapper>} />
        <Route path="/payment-cancel" element={<SuspenseWrapper><PaymentCancel /></SuspenseWrapper>} />

        {/* Auth */}
        {/* Onboarding gate is enforced at /app/dashboard from the DB. */}
        <Route path="/auth" element={user ? <Navigate to="/app/dashboard" replace /> : <SuspenseWrapper><WraythAuth /></SuspenseWrapper>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/auth/forgot-password" element={<SuspenseWrapper variant="form"><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/reset-password" element={<SuspenseWrapper variant="form"><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/mfa-recovery" element={<SuspenseWrapper variant="form"><MFARecoveryPage /></SuspenseWrapper>} />

        {/* Wrayth app — canonical prefix is /app/*. Legacy /safesuite/* redirects below. */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/auth" element={<Navigate to="/auth" replace />} />
        <Route path="/app/auth/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/app/auth/reset-password" element={<Navigate to="/auth/reset-password" replace />} />
        <Route path="/app/auth/mfa-recovery" element={<Navigate to="/auth/mfa-recovery" replace />} />
        <Route path="/app/features" element={<SuspenseWrapper><WraythFeatures /></SuspenseWrapper>} />
        <Route path="/app/products/safepass" element={<SuspenseWrapper><VaultProduct /></SuspenseWrapper>} />
        <Route path="/app/products/safeweb" element={<SuspenseWrapper><WatchProduct /></SuspenseWrapper>} />
        <Route path="/app/products/safescan" element={<SuspenseWrapper><ScanProduct /></SuspenseWrapper>} />

        <Route path="/onboarding/ray" element={
          <ProtectedRoute>
            <SuspenseWrapper><RayOnboarding /></SuspenseWrapper>
          </ProtectedRoute>
        } />



        <Route element={
          <ProtectedRoute>
            <SuspenseWrapper><WraythLayout /></SuspenseWrapper>
          </ProtectedRoute>
        }>
          <Route path="/app/dashboard" element={<SuspenseWrapper><WraythDashboard /></SuspenseWrapper>} />
          <Route path="/app/brief" element={<SuspenseWrapper><MorningBrief /></SuspenseWrapper>} />
          <Route path="/app/assist" element={<SuspenseWrapper><WraythAssist /></SuspenseWrapper>} />
          <Route path="/app/ray" element={<SuspenseWrapper><Ray /></SuspenseWrapper>} />
          <Route path="/app/ray/playbook/:runId" element={<SuspenseWrapper><PlaybookRunnerPage /></SuspenseWrapper>} />
          <Route path="/app/timeline" element={<SuspenseWrapper><RayTimelinePage /></SuspenseWrapper>} />
          <Route path="/app/missions" element={<SuspenseWrapper><Missions /></SuspenseWrapper>} />
          <Route path="/app/trends" element={<SuspenseWrapper><Trends /></SuspenseWrapper>} />
          <Route path="/app/trust" element={<SuspenseWrapper><TrustCenter /></SuspenseWrapper>} />
          <Route path="/app/identity" element={<SuspenseWrapper><Identity /></SuspenseWrapper>} />
          <Route path="/app/devices" element={<SuspenseWrapper><Devices /></SuspenseWrapper>} />
          <Route path="/app/reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />

          {/* Canonical product routes */}
          <Route path="/app/passwords" element={<SuspenseWrapper><Passwords /></SuspenseWrapper>} />
          <Route path="/app/threats" element={<SuspenseWrapper><Threats /></SuspenseWrapper>} />
          <Route path="/app/exposure" element={<SuspenseWrapper><Exposure /></SuspenseWrapper>} />

          {/* Legacy product routes — redirect to canonical */}
          <Route path="/app/pass" element={<Navigate to="/app/passwords" replace />} />
          <Route path="/app/scan" element={<Navigate to="/app/threats" replace />} />
          <Route path="/app/scan/settings" element={<Navigate to="/app/threats/settings" replace />} />
          <Route path="/app/web" element={<Navigate to="/app/exposure" replace />} />
          <Route path="/app/web/settings" element={<Navigate to="/app/exposure/settings" replace />} />

          <Route path="/app/mfa" element={<SuspenseWrapper><RayMFAHub /></SuspenseWrapper>} />
          <Route path="/app/passwords/shared" element={<SuspenseWrapper><VaultShared /></SuspenseWrapper>} />
          <Route path="/app/passwords/emergency" element={<SuspenseWrapper><VaultEmergency /></SuspenseWrapper>} />
          <Route path="/app/passwords/extension" element={<SuspenseWrapper><VaultExtension /></SuspenseWrapper>} />
          <Route path="/app/passwords/reminders" element={<SuspenseWrapper><VaultReminders /></SuspenseWrapper>} />
          <Route path="/app/passwords/breach" element={<SuspenseWrapper><VaultBreach /></SuspenseWrapper>} />
          <Route path="/app/passwords/settings" element={<SuspenseWrapper variant="form"><VaultSettings /></SuspenseWrapper>} />
          <Route path="/app/passwords/notes" element={<SuspenseWrapper><VaultNotes /></SuspenseWrapper>} />
          <Route path="/app/passwords/cards" element={<SuspenseWrapper><VaultCards /></SuspenseWrapper>} />
          <Route path="/app/passwords/identity" element={<SuspenseWrapper><VaultIdentity /></SuspenseWrapper>} />
          <Route path="/app/passwords/health" element={<SuspenseWrapper><VaultHealth /></SuspenseWrapper>} />
          <Route path="/app/passwords/users" element={<SuspenseWrapper><VaultUsers /></SuspenseWrapper>} />

          {/* Legacy /app/pass/* sub-routes → /app/passwords/* */}
          <Route path="/app/pass/shared" element={<Navigate to="/app/passwords/shared" replace />} />
          <Route path="/app/pass/emergency" element={<Navigate to="/app/passwords/emergency" replace />} />
          <Route path="/app/pass/extension" element={<Navigate to="/app/passwords/extension" replace />} />
          <Route path="/app/pass/reminders" element={<Navigate to="/app/passwords/reminders" replace />} />
          <Route path="/app/pass/breach" element={<Navigate to="/app/passwords/breach" replace />} />
          <Route path="/app/pass/settings" element={<Navigate to="/app/passwords/settings" replace />} />
          <Route path="/app/pass/notes" element={<Navigate to="/app/passwords/notes" replace />} />
          <Route path="/app/pass/cards" element={<Navigate to="/app/passwords/cards" replace />} />
          <Route path="/app/pass/identity" element={<Navigate to="/app/passwords/identity" replace />} />
          <Route path="/app/pass/health" element={<Navigate to="/app/passwords/health" replace />} />
          <Route path="/app/pass/users" element={<Navigate to="/app/passwords/users" replace />} />

          <Route path="/app/threats/settings" element={<SuspenseWrapper variant="form"><ScanSettings /></SuspenseWrapper>} />
          <Route path="/app/exposure/settings" element={<SuspenseWrapper variant="form"><WatchSettings /></SuspenseWrapper>} />
          <Route path="/app/billing" element={<SuspenseWrapper><WraythBilling /></SuspenseWrapper>} />
          <Route path="/app/settings" element={<SuspenseWrapper variant="form"><WraythSettings /></SuspenseWrapper>} />
        </Route>

        {/* Convenience aliases */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/billing" element={<Navigate to="/app/billing" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        {/* Legacy /safesuite/* → /app/* (preserves old bookmarks, emails, screenshots) */}
        <Route path="/safesuite" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/safesuite/*" element={<LegacySafesuiteRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <CookieConsent />
    </EnhancedErrorBoundary>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

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
              <Router>
                <AppRouter />
                <ShadcnToaster />
                <SonnerToaster />
              </Router>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </EnhancedErrorBoundary>
    </ThemeProvider>
  );
}
