import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isSafeSuiteDomain } from '@/utils/subdomain';
import ProtectedRoute from '@/components/ProtectedRoute';
import LegacySafeSuitePathRedirect from '@/components/LegacySafeSuitePathRedirect';
import UnifiedAuthRedirect from '@/components/auth/UnifiedAuthRedirect';
import SafeSuiteLayout from '@/layouts/SafeSuiteLayout';
import { Loader2 } from 'lucide-react';

// Loading component for lazy-loaded routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// SafeSuite pages - lazy loaded to match App.tsx
const UnifiedAdminCenter = lazy(() => import('@/pages/admin/UnifiedAdminCenter'));
const SafeSuiteProductPage = lazy(() => import('@/pages/products/SafeSuiteProductPage'));
const SafeSuiteDashboard = lazy(() => import('@/pages/safesuite/SafeSuiteDashboard'));
const SafeSuiteBilling = lazy(() => import('@/pages/safesuite/SafeSuiteBilling'));
const SafeSuiteSettings = lazy(() => import('@/pages/safesuite/SafeSuiteSettings'));
const SafeSuitePass = lazy(() => import('@/pages/safesuite/SafeSuitePass'));
const SafePassShared = lazy(() => import('@/pages/safesuite/SafePassShared'));
const SafePassEmergency = lazy(() => import('@/pages/safesuite/SafePassEmergency'));
const SafePassExtension = lazy(() => import('@/pages/safesuite/SafePassExtension'));
const SafePassNotes = lazy(() => import('@/pages/safesuite/SafePassNotes'));
const SafePassCards = lazy(() => import('@/pages/safesuite/SafePassCards'));
const SafePassIdentity = lazy(() => import('@/pages/safesuite/SafePassIdentity'));
const SafePassHealth = lazy(() => import('@/pages/safesuite/SafePassHealth'));
const SafePassUsers = lazy(() => import('@/pages/safesuite/SafePassUsers'));
const SafePassImport = lazy(() => import('@/pages/safepass/SafePassImport'));
const SafePassExport = lazy(() => import('@/pages/safepass/SafePassExport'));
const SafePassReminders = lazy(() => import('@/pages/safesuite/SafePassReminders'));
const SafePassBreach = lazy(() => import('@/pages/safesuite/SafePassBreach'));
const SafePassSettings = lazy(() => import('@/pages/safesuite/SafePassSettings'));
const SafePassTeam = lazy(() => import('@/pages/safesuite/SafePassTeam'));
const SafeSuiteScan = lazy(() => import('@/pages/safesuite/SafeSuiteScan'));
const SafeScanSettings = lazy(() => import('@/pages/safesuite/SafeScanSettings'));
const SafeSuiteWeb = lazy(() => import('@/pages/safesuite/SafeSuiteWeb'));
const SafeWebSettings = lazy(() => import('@/pages/safesuite/SafeWebSettings'));
const SafeSuiteTrack = lazy(() => import('@/pages/safesuite/SafeSuiteTrack'));
const SafeTrackSettings = lazy(() => import('@/pages/safesuite/SafeTrackSettings'));
const SafeSuiteAssist = lazy(() => import('@/pages/safesuite/SafeSuiteAssist'));
const AssetManagementPage = lazy(() => import('@/pages/AssetManagementPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/safesuite/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/safesuite/ResetPasswordPage'));
const MFARecoveryPage = lazy(() => import('@/pages/safesuite/MFARecoveryPage'));
const SafePassResetMasterPassword = lazy(() => import('@/pages/safesuite/SafePassResetMasterPassword'));

// Product pages
const SafePassProduct = lazy(() => import('@/pages/safesuite/products/SafePassProduct'));
const SafeScanProduct = lazy(() => import('@/pages/safesuite/products/SafeScanProduct'));
const SafeWebProduct = lazy(() => import('@/pages/safesuite/products/SafeWebProduct'));
const SafeTrackProduct = lazy(() => import('@/pages/safesuite/products/SafeTrackProduct'));
const SafePassSecurityPage = lazy(() => import('@/pages/safesuite/SafePassSecurityPage'));

/**
 * SafeSuite routes for the dedicated subdomain (safesuite.ultriumai.com)
 * Uses clean URLs at root level (/, /dashboard, /pass, etc.)
 */
export const SafeSuiteSubdomainRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<SafeSuiteProductPage />} />
        <Route path="/features" element={<SafeSuiteProductPage />} />
        <Route path="/products/safepass" element={<SafePassProduct />} />
        <Route path="/products/safepass/security" element={<SafePassSecurityPage />} />
        <Route path="/products/safescan" element={<SafeScanProduct />} />
        <Route path="/products/safeweb" element={<SafeWebProduct />} />
        <Route path="/products/safetrack" element={<SafeTrackProduct />} />
        <Route path="/auth" element={<UnifiedAuthRedirect />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/mfa-recovery" element={<MFARecoveryPage />} />
        <Route path="/pass/reset-master-password" element={<SafePassResetMasterPassword />} />
        
        {/* Protected routes with layout */}
        <Route element={
          <ProtectedRoute>
            <SafeSuiteLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<SafeSuiteDashboard />} />
          <Route path="/pass" element={<SafeSuitePass />} />
          <Route path="/pass/shared" element={<SafePassShared />} />
          <Route path="/pass/emergency" element={<SafePassEmergency />} />
          <Route path="/pass/extension" element={<SafePassExtension />} />
          <Route path="/pass/notes" element={<SafePassNotes />} />
          <Route path="/pass/cards" element={<SafePassCards />} />
          <Route path="/pass/identity" element={<SafePassIdentity />} />
          <Route path="/pass/health" element={<SafePassHealth />} />
          <Route path="/pass/users" element={<SafePassUsers />} />
          <Route path="/pass/import" element={<SafePassImport />} />
          <Route path="/pass/export" element={<SafePassExport />} />
          <Route path="/pass/reminders" element={<SafePassReminders />} />
          <Route path="/pass/breach" element={<SafePassBreach />} />
          <Route path="/pass/settings" element={<SafePassSettings />} />
          <Route path="/pass/team" element={<SafePassTeam />} />
          <Route path="/scan" element={<SafeSuiteScan />} />
          <Route path="/scan/settings" element={<SafeScanSettings />} />
          <Route path="/web" element={<SafeSuiteWeb />} />
          <Route path="/web/settings" element={<SafeWebSettings />} />
          <Route path="/track" element={<SafeSuiteTrack />} />
          <Route path="/track/settings" element={<SafeTrackSettings />} />
          <Route path="/assist" element={<SafeSuiteAssist />} />
          <Route path="/asset-management" element={<AssetManagementPage />} />
          <Route path="/billing" element={<SafeSuiteBilling />} />
          <Route path="/settings" element={<SafeSuiteSettings />} />
          <Route path="/admin/*" element={<UnifiedAdminCenter />} />
        </Route>
        
        {/* Redirect old /safesuite/* paths to clean URLs (including nested routes) */}
        <Route path="/safesuite/*" element={<LegacySafeSuitePathRedirect />} />
        <Route path="/safesuite" element={<Navigate to="/" replace />} />
        <Route path="/safesuite/auth" element={<Navigate to="/auth" replace />} />
        <Route path="/safesuite/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/safesuite/pass" element={<Navigate to="/pass" replace />} />
        <Route path="/safesuite/scan" element={<Navigate to="/scan" replace />} />
        <Route path="/safesuite/web" element={<Navigate to="/web" replace />} />
        <Route path="/safesuite/track" element={<Navigate to="/track" replace />} />
        <Route path="/safesuite/billing" element={<Navigate to="/billing" replace />} />
        <Route path="/safesuite/settings" element={<Navigate to="/settings" replace />} />
        
        {/* Catch-all for 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

/**
 * Check if we should use SafeSuite subdomain routing
 */
export const useSafeSuiteSubdomain = (): boolean => {
  return isSafeSuiteDomain();
};