import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isSafeSuiteDomain } from '@/utils/subdomain';
import ProtectedRoute from '@/components/ProtectedRoute';

// SafeSuite imports
import SafeSuiteLayout from '@/layouts/SafeSuiteLayout';
import SafeSuiteLanding from '@/pages/safesuite/SafeSuiteLanding';
import SafeSuiteAuth from '@/pages/safesuite/SafeSuiteAuth';
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
import SafeSuiteScan from '@/pages/safesuite/SafeSuiteScan';
import SafeSuiteWeb from '@/pages/safesuite/SafeSuiteWeb';
import SafeSuiteTrack from '@/pages/safesuite/SafeSuiteTrack';
import ForgotPasswordPage from '@/pages/safesuite/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/safesuite/ResetPasswordPage';
import MFARecoveryPage from '@/pages/safesuite/MFARecoveryPage';

/**
 * SafeSuite routes for the dedicated subdomain (safesuite.ultriumai.com)
 * Uses clean URLs at root level (/, /dashboard, /pass, etc.)
 */
export const SafeSuiteSubdomainRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<SafeSuiteLanding />} />
      <Route path="/auth" element={<SafeSuiteAuth />} />
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
        <Route path="/scan" element={<SafeSuiteScan />} />
        <Route path="/web" element={<SafeSuiteWeb />} />
        <Route path="/track" element={<SafeSuiteTrack />} />
        <Route path="/billing" element={<SafeSuiteBilling />} />
        <Route path="/settings" element={<SafeSuiteSettings />} />
      </Route>
      
      {/* Redirect old /safesuite/* paths to clean URLs */}
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
