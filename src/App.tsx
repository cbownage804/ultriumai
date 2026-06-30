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
const WraythPass = lazy(() => import('@/pages/safesuite/SafeSuitePass'));
const WraythScan = lazy(() => import('@/pages/safesuite/SafeSuiteScan'));
const WraythWeb = lazy(() => import('@/pages/safesuite/SafeSuiteWeb'));
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
const VaultHealth = lazy(() => import('@/pages/safesuite/SafePassHealth'));
const VaultUsers = lazy(() => import('@/pages/safesuite/SafePassUsers'));
const WraythPricing = lazy(() => import('@/pages/pricing/SafeSuitePricing'));
const WraythAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));
const Ray = lazy(() => import('@/pages/safesuite/Ray'));
const Identity = lazy(() => import('@/pages/safesuite/Identity'));
const Devices = lazy(() => import('@/pages/safesuite/Devices'));
const Reports = lazy(() => import('@/pages/safesuite/Reports'));
const RayOnboarding = lazy(() => import('@/pages/onboarding/RayOnboarding'));

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
        {/* Onboarding gate is enforced at /safesuite/dashboard from the DB. */}
        <Route path="/auth" element={user ? <Navigate to="/safesuite/dashboard" replace /> : <SuspenseWrapper><WraythAuth /></SuspenseWrapper>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/auth/forgot-password" element={<SuspenseWrapper variant="form"><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/reset-password" element={<SuspenseWrapper variant="form"><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/mfa-recovery" element={<SuspenseWrapper variant="form"><MFARecoveryPage /></SuspenseWrapper>} />

        {/* Wrayth app (keep /safesuite/* paths intact — layout has hardcoded links) */}
        <Route path="/safesuite" element={<Navigate to="/safesuite/dashboard" replace />} />
        <Route path="/safesuite/auth" element={<Navigate to="/auth" replace />} />
        <Route path="/safesuite/auth/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/safesuite/auth/reset-password" element={<Navigate to="/auth/reset-password" replace />} />
        <Route path="/safesuite/auth/mfa-recovery" element={<Navigate to="/auth/mfa-recovery" replace />} />
        <Route path="/safesuite/features" element={<SuspenseWrapper><WraythFeatures /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safepass" element={<SuspenseWrapper><VaultProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safeweb" element={<SuspenseWrapper><WatchProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safescan" element={<SuspenseWrapper><ScanProduct /></SuspenseWrapper>} />

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
          <Route path="/safesuite/dashboard" element={<SuspenseWrapper><WraythDashboard /></SuspenseWrapper>} />
          <Route path="/safesuite/assist" element={<SuspenseWrapper><WraythAssist /></SuspenseWrapper>} />
          <Route path="/safesuite/ray" element={<SuspenseWrapper><Ray /></SuspenseWrapper>} />
          <Route path="/safesuite/identity" element={<SuspenseWrapper><Identity /></SuspenseWrapper>} />
          <Route path="/safesuite/devices" element={<SuspenseWrapper><Devices /></SuspenseWrapper>} />
          <Route path="/safesuite/reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />
          <Route path="/safesuite/pass" element={<SuspenseWrapper><WraythPass /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/shared" element={<SuspenseWrapper><VaultShared /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/emergency" element={<SuspenseWrapper><VaultEmergency /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/extension" element={<SuspenseWrapper><VaultExtension /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/reminders" element={<SuspenseWrapper><VaultReminders /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/breach" element={<SuspenseWrapper><VaultBreach /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/settings" element={<SuspenseWrapper variant="form"><VaultSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/notes" element={<SuspenseWrapper><VaultNotes /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/cards" element={<SuspenseWrapper><VaultCards /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/identity" element={<SuspenseWrapper><VaultIdentity /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/health" element={<SuspenseWrapper><VaultHealth /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/users" element={<SuspenseWrapper><VaultUsers /></SuspenseWrapper>} />
          <Route path="/safesuite/scan" element={<SuspenseWrapper><WraythScan /></SuspenseWrapper>} />
          <Route path="/safesuite/scan/settings" element={<SuspenseWrapper variant="form"><ScanSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/web" element={<SuspenseWrapper><WraythWeb /></SuspenseWrapper>} />
          <Route path="/safesuite/web/settings" element={<SuspenseWrapper variant="form"><WatchSettings /></SuspenseWrapper>} />
          <Route path="/safesuite/billing" element={<SuspenseWrapper><WraythBilling /></SuspenseWrapper>} />
          <Route path="/safesuite/settings" element={<SuspenseWrapper variant="form"><WraythSettings /></SuspenseWrapper>} />
        </Route>

        {/* Convenience aliases */}
        <Route path="/dashboard" element={<Navigate to="/safesuite/dashboard" replace />} />
        <Route path="/billing" element={<Navigate to="/safesuite/billing" replace />} />
        <Route path="/settings" element={<Navigate to="/safesuite/settings" replace />} />

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
