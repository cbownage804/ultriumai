import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isSafeSuiteDomain } from '@/utils/subdomain';
import ProtectedRoute from '@/components/ProtectedRoute';
import LegacySafeSuitePathRedirect from '@/components/LegacySafeSuitePathRedirect';
import UnifiedAuthRedirect from '@/components/auth/UnifiedAuthRedirect';

// SafeSuite imports
import SafeSuiteLayout from '@/layouts/SafeSuiteLayout';
import SafeSuiteLanding from '@/pages/safesuite/SafeSuiteLanding';
import SafeSuiteDashboard from '@/pages/safesuite/SafeSuiteDashboard';
import SafeSuiteBilling from '@/pages/safesuite/SafeSuiteBilling';
import SafeSuiteSettings from '@/pages/safesuite/SafeSuiteSettings';
import SafeSuitePass from '@/pages/safesuite/SafeSuitePass';
import SafePassShared from '@/pages/safesuite/SafePassShared';
import SafePassEmergency from '@/pages/safesuite/SafePassEmergency';
import SafePassExtension from '@/pages/safesuite/SafePassExtension';
import SafePassNotes from '@/pages/safesuite/SafePassNotes';
import SafePassCards from '@/pages/safesuite/SafePassCards';
import SafePassIdentity from '@/pages/safesuite/SafePassIdentity';
import SafePassHealth from '@/pages/safesuite/SafePassHealth';
import SafePassUsers from '@/pages/safesuite/SafePassUsers';
import SafePassImport from '@/pages/safepass/SafePassImport';
import SafePassExport from '@/pages/safepass/SafePassExport';
import SafePassReminders from '@/pages/safesuite/SafePassReminders';
import SafePassBreach from '@/pages/safesuite/SafePassBreach';
import SafePassSettings from '@/pages/safesuite/SafePassSettings';
import SafePassTeam from '@/pages/safesuite/SafePassTeam';
import SafeSuiteScan from '@/pages/safesuite/SafeSuiteScan';
import SafeScanSettings from '@/pages/safesuite/SafeScanSettings';
import SafeSuiteWeb from '@/pages/safesuite/SafeSuiteWeb';
import SafeWebSettings from '@/pages/safesuite/SafeWebSettings';
import SafeSuiteTrack from '@/pages/safesuite/SafeSuiteTrack';
import SafeTrackSettings from '@/pages/safesuite/SafeTrackSettings';
import AssetManagementPage from '@/pages/AssetManagementPage';
import ForgotPasswordPage from '@/pages/safesuite/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/safesuite/ResetPasswordPage';
import MFARecoveryPage from '@/pages/safesuite/MFARecoveryPage';

// Product pages
import SafePassProduct from '@/pages/safesuite/products/SafePassProduct';
import SafeScanProduct from '@/pages/safesuite/products/SafeScanProduct';
import SafeWebProduct from '@/pages/safesuite/products/SafeWebProduct';
import SafeTrackProduct from '@/pages/safesuite/products/SafeTrackProduct';
import SafePassSecurityPage from '@/pages/safesuite/SafePassSecurityPage';

/**
 * SafeSuite routes for the dedicated subdomain (safesuite.ultriumai.com)
 * Uses clean URLs at root level (/, /dashboard, /pass, etc.)
 */
export const SafeSuiteSubdomainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SafeSuiteLanding />} />
      <Route path="/features" element={<SafeSuiteLanding />} />
      <Route path="/products/safepass" element={<SafePassProduct />} />
      <Route path="/products/safepass/security" element={<SafePassSecurityPage />} />
      <Route path="/products/safescan" element={<SafeScanProduct />} />
      <Route path="/products/safeweb" element={<SafeWebProduct />} />
      <Route path="/products/safetrack" element={<SafeTrackProduct />} />
      <Route path="/auth" element={<UnifiedAuthRedirect />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/mfa-recovery" element={<MFARecoveryPage />} />
      
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
        <Route path="/asset-management" element={<AssetManagementPage />} />
        <Route path="/billing" element={<SafeSuiteBilling />} />
        <Route path="/settings" element={<SafeSuiteSettings />} />
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
  );
};

/**
 * Check if we should use SafeSuite subdomain routing
 */
export const useSafeSuiteSubdomain = (): boolean => {
  return isSafeSuiteDomain();
};
