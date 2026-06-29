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

// SafeSuite layout
const SafeSuiteLayout = lazy(() => import('@/layouts/SafeSuiteLayout'));

// SafeSuite pages
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
const SafeSuitePricing = lazy(() => import('@/pages/pricing/SafeSuitePricing'));

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
        <Route path="/" element={<SuspenseWrapper><SafeSuiteLanding /></SuspenseWrapper>} />
        <Route path="/pricing" element={<SuspenseWrapper variant="cards"><SafeSuitePricing /></SuspenseWrapper>} />
        <Route path="/features" element={<SuspenseWrapper><SafeSuiteFeatures /></SuspenseWrapper>} />
        <Route path="/products/safepass" element={<SuspenseWrapper><SafePassProduct /></SuspenseWrapper>} />
        <Route path="/products/safescan" element={<SuspenseWrapper><SafeScanProduct /></SuspenseWrapper>} />
        <Route path="/products/safeweb" element={<SuspenseWrapper><SafeWebProduct /></SuspenseWrapper>} />
        <Route path="/products/safetrack" element={<SuspenseWrapper><SafeTrackProduct /></SuspenseWrapper>} />
        <Route path="/contact" element={<SuspenseWrapper><Contact /></SuspenseWrapper>} />
        <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
        <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
        <Route path="/security" element={<SuspenseWrapper><Security /></SuspenseWrapper>} />
        <Route path="/security-policy" element={<SuspenseWrapper><SecurityPolicy /></SuspenseWrapper>} />
        <Route path="/payment-success" element={<SuspenseWrapper><PaymentSuccess /></SuspenseWrapper>} />
        <Route path="/payment-cancel" element={<SuspenseWrapper><PaymentCancel /></SuspenseWrapper>} />

        {/* Auth */}
        <Route path="/auth" element={user ? <Navigate to="/safesuite/dashboard" replace /> : <SuspenseWrapper><SafeSuiteAuth /></SuspenseWrapper>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/auth/forgot-password" element={<SuspenseWrapper variant="form"><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/reset-password" element={<SuspenseWrapper variant="form"><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/auth/mfa-recovery" element={<SuspenseWrapper variant="form"><MFARecoveryPage /></SuspenseWrapper>} />

        {/* SafeSuite app (keep /safesuite/* paths intact — layout has hardcoded links) */}
        <Route path="/safesuite" element={<Navigate to="/safesuite/dashboard" replace />} />
        <Route path="/safesuite/auth" element={<Navigate to="/auth" replace />} />
        <Route path="/safesuite/auth/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/safesuite/auth/reset-password" element={<Navigate to="/auth/reset-password" replace />} />
        <Route path="/safesuite/auth/mfa-recovery" element={<Navigate to="/auth/mfa-recovery" replace />} />
        <Route path="/safesuite/features" element={<SuspenseWrapper><SafeSuiteFeatures /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safetrack" element={<SuspenseWrapper><SafeTrackProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safepass" element={<SuspenseWrapper><SafePassProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safeweb" element={<SuspenseWrapper><SafeWebProduct /></SuspenseWrapper>} />
        <Route path="/safesuite/products/safescan" element={<SuspenseWrapper><SafeScanProduct /></SuspenseWrapper>} />

        <Route element={
          <ProtectedRoute>
            <SuspenseWrapper><SafeSuiteLayout /></SuspenseWrapper>
          </ProtectedRoute>
        }>
          <Route path="/safesuite/dashboard" element={<SuspenseWrapper><SafeSuiteDashboard /></SuspenseWrapper>} />
          <Route path="/safesuite/pass" element={<SuspenseWrapper><SafeSuitePass /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/shared" element={<SuspenseWrapper><SafePassShared /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/emergency" element={<SuspenseWrapper><SafePassEmergency /></SuspenseWrapper>} />
          <Route path="/safesuite/pass/extension" element={<SuspenseWrapper><SafePassExtension /></SuspenseWrapper>} />
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
